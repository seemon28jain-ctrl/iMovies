const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');

/**
 * GET /api/shows
 * Fetch all shows. Supports ?movieId= filter.
 * Enriches each show with movie details and seat metrics.
 */
const getAllShows = async (req, res) => {
  try {
    const filter = {};
    if (req.query.movieId) {
      filter.movieId = req.query.movieId;
    }
    const shows = await Show.find(filter).sort({ showDate: -1, showTime: 1 }).lean();

    // Fetch movies to map movie titles and posters
    const movies = await Movie.find({}, 'movieName posterUrl tmdbId').lean();
    const movieMap = {};
    movies.forEach((m) => {
      movieMap[m._id.toString()] = m;
      if (m.tmdbId) movieMap[String(m.tmdbId)] = m;
    });

    const enrichedShows = shows.map((s) => {
      const movieInfo = movieMap[s.movieId] || {};
      const totalSeats = s.tickets ? Object.keys(s.tickets).length : 0;
      const bookedSeats = s.tickets
        ? Object.values(s.tickets).filter((t) => t.status === 'booked').length
        : 0;
      return {
        ...s,
        movieName: movieInfo.movieName || 'Featured Movie',
        posterUrl: movieInfo.posterUrl || '',
        totalSeats,
        bookedSeats,
      };
    });

    res.json({ success: true, count: enrichedShows.length, shows: enrichedShows });
  } catch (err) {
    console.error('[getAllShows]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/shows/movie/:movieId
 * Get all shows for a specific movieId.
 * Auto-schedules screenings across active theatres for upcoming 7 days if none exist yet.
 */
const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Resolve movie document to obtain both _id and tmdbId
    let movie = null;
    if (mongoose.isValidObjectId(movieId)) {
      movie = await Movie.findById(movieId);
    }
    if (!movie) {
      const orConditions = [];
      if (!isNaN(Number(movieId))) {
        orConditions.push({ tmdbId: Number(movieId) });
      }
      if (mongoose.isValidObjectId(movieId)) {
        orConditions.push({ _id: movieId });
      }
      if (orConditions.length > 0) {
        movie = await Movie.findOne({ $or: orConditions });
      }
    }

    const searchIds = [movieId];
    if (movie) {
      searchIds.push(movie._id.toString());
      if (movie.tmdbId) searchIds.push(String(movie.tmdbId));
    }

    // Determine current local date (IST UTC+5.5)
    const today = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];

    let shows = await Show.find({
      movieId: { $in: searchIds },
      showDate: { $gte: today }
    }).sort({
      showDate: 1,
      showTime: 1,
    });

    // Auto-schedule demo screenings ONLY for seed TMDB movies when absolutely zero shows exist
    if (shows.length === 0 && movie && movie.tmdbId) {
      const theatres = await Theatre.find({ isActive: true });
      if (theatres.length > 0) {
        const times = ['10:00 AM', '01:30 PM', '04:45 PM', '07:30 PM', '10:15 PM'];

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const dateStr = new Date(Date.now() + (dayOffset * 24 + 5.5) * 3600000).toISOString().split('T')[0];

          for (const theatre of theatres) {
            for (const time of times) {
              const existing = await Show.findOne({
                movieId: { $in: searchIds },
                theatreId: theatre.theatreId,
                showDate: dateStr,
                showTime: time
              });

              if (!existing) {
                const tickets = {};
                const buildSeats = (seatMap, type, price) => {
                  Object.keys(seatMap || {}).forEach((seatId) => {
                    tickets[seatId] = {
                      seatId,
                      type,
                      price,
                      status: 'available',
                      lockExpiry: null,
                      bookedBy: null,
                    };
                  });
                };
                buildSeats(theatre.balconySeats, 'balcony', theatre.balconySeatPrice);
                buildSeats(theatre.middleSeats, 'middle', theatre.middleSeatPrice);
                buildSeats(theatre.lowerSeats, 'lower', theatre.lowerSeatPrice);

                const newShow = new Show({
                  adminEmail: 'admin@imovies.com',
                  showId: uuidv4(),
                  movieId: movie ? movie._id.toString() : movieId,
                  theatreName: theatre.theatreName,
                  theatreId: theatre.theatreId,
                  showDate: dateStr,
                  showTime: time,
                  tickets,
                });
                await newShow.save();
              }
            }
          }
        }

        shows = await Show.find({
          movieId: { $in: searchIds },
          showDate: { $gte: today }
        }).sort({
          showDate: 1,
          showTime: 1,
        });
      }
    }

    res.json({ success: true, count: shows.length, shows });
  } catch (err) {
    console.error('[getShowsByMovie]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/shows/:id
 * Fetch a single show with full ticket status.
 */
const getShowById = async (req, res) => {
  try {
    const id = req.params.id;
    let show = null;
    if (mongoose.isValidObjectId(id)) {
      show = await Show.findOne({ $or: [{ _id: id }, { showId: id }] });
    } else {
      show = await Show.findOne({ showId: id });
    }
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }
    res.json({ success: true, show });
  } catch (err) {
    console.error('[getShowById]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/shows
 * Admin only — create a show.
 * Initialises the tickets object from the linked theatre's seat configuration.
 */
const addShow = async (req, res) => {
  try {
    const { movieId, theatreId, showDate, showTime } = req.body;

    if (!movieId || !theatreId || !showDate || !showTime) {
      return res
        .status(400)
        .json({ success: false, message: 'movieId, theatreId, showDate and showTime are required.' });
    }

    // Fetch the theatre to build the initial ticket map
    const theatre = await Theatre.findOne({ theatreId });
    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    // Build the tickets object by flattening all seat sections
    const tickets = {};

    const buildSeats = (seatMap, type, price) => {
      Object.keys(seatMap).forEach((seatId) => {
        tickets[seatId] = {
          seatId,
          type,
          price,
          status: 'available',  // available | locked | booked
          lockExpiry: null,
          bookedBy: null,
        };
      });
    };

    buildSeats(theatre.balconySeats, 'balcony', theatre.balconySeatPrice);
    buildSeats(theatre.middleSeats, 'middle', theatre.middleSeatPrice);
    buildSeats(theatre.lowerSeats, 'lower', theatre.lowerSeatPrice);

    const showId = uuidv4();

    const show = new Show({
      adminEmail: req.admin.email,
      showId,
      movieId,
      theatreName: theatre.theatreName,
      theatreId,
      showDate,
      showTime,
      tickets,
    });

    await show.save();
    res.status(201).json({ success: true, message: 'Show created successfully.', show });
  } catch (err) {
    console.error('[addShow]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PUT /api/shows/:id
 * Admin only — update show details (does not overwrite tickets).
 */
const updateShow = async (req, res) => {
  try {
    // Prevent overwriting the tickets map accidentally
    const { tickets, ...updateData } = req.body;

    const show = await Show.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    res.json({ success: true, message: 'Show updated successfully.', show });
  } catch (err) {
    console.error('[updateShow]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/shows/:id
 * Admin only — permanently delete a show by Mongo _id or UUID showId.
 */
const deleteShow = async (req, res) => {
  try {
    const id = req.params.id;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { showId: id };
    const show = await Show.findOneAndDelete(query);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }
    res.json({ success: true, message: 'Show deleted successfully.' });
  } catch (err) {
    console.error('[deleteShow]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllShows,
  getShowsByMovie,
  getShowById,
  addShow,
  updateShow,
  deleteShow,
};
