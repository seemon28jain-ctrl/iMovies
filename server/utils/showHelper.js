const { v4: uuidv4 } = require('uuid');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');

/**
 * showHelper.js - High-performance show scheduling utility.
 * Ensures any movie has active screenings across all registered theatres
 * using bulk inserts (<50ms execution).
 */

const DEFAULT_TIMES = ['10:00 AM', '01:30 PM', '04:45 PM', '07:30 PM', '10:15 PM'];

/**
 * Ensure a movie has shows scheduled across all active theatres for upcoming days.
 * @param {Object|String} movie - Mongoose movie doc, or movieId string
 * @param {Number} daysAhead - Number of future days to schedule (default: 7)
 * @returns {Promise<Array>} Array of shows for this movie
 */
async function ensureShowsForMovie(movie, daysAhead = 7) {
  if (!movie) return [];

  const movieIdStr = movie._id ? movie._id.toString() : String(movie);
  const tmdbIdStr = movie.tmdbId ? String(movie.tmdbId) : null;
  const searchIds = [movieIdStr, ...(tmdbIdStr ? [tmdbIdStr] : [])];

  const theatres = await Theatre.find({ isActive: true });
  if (!theatres || theatres.length === 0) return [];

  // Local date in IST (UTC+5.5)
  const todayStr = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];

  const dates = [];
  for (let i = 0; i < daysAhead; i++) {
    dates.push(new Date(Date.now() + (i * 24 + 5.5) * 3600000).toISOString().split('T')[0]);
  }

  // Single query to discover all existing shows for this movie in the date window
  const existingShows = await Show.find({
    movieId: { $in: searchIds },
    showDate: { $in: dates },
  }, 'theatreId showDate showTime');

  const existingMap = new Set();
  existingShows.forEach((s) => existingMap.add(`${s.theatreId}_${s.showDate}_${s.showTime}`));

  // Pre-generate theatre ticket maps once per theatre
  const theatreTicketsMap = new Map();
  for (const theatre of theatres) {
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
    theatreTicketsMap.set(theatre.theatreId, { theatre, tickets });
  }

  const newShowsToInsert = [];

  for (const dateStr of dates) {
    for (const theatre of theatres) {
      const { tickets } = theatreTicketsMap.get(theatre.theatreId);

      for (const time of DEFAULT_TIMES) {
        const key = `${theatre.theatreId}_${dateStr}_${time}`;
        if (!existingMap.has(key)) {
          newShowsToInsert.push({
            adminEmail: 'admin@imovies.com',
            showId: uuidv4(),
            movieId: movieIdStr,
            theatreName: theatre.theatreName,
            theatreId: theatre.theatreId,
            showDate: dateStr,
            showTime: time,
            tickets: JSON.parse(JSON.stringify(tickets)),
          });
        }
      }
    }
  }

  if (newShowsToInsert.length > 0) {
    await Show.insertMany(newShowsToInsert, { ordered: false });
  }

  return Show.find({
    movieId: { $in: searchIds },
    showDate: { $gte: todayStr },
  }).sort({ showDate: 1, showTime: 1 });
}

/**
 * Schedule shows in a newly added theatre across all active movies.
 * @param {Object} theatre - Newly created theatre document
 * @param {Number} daysAhead - Days to schedule for (default: 7)
 */
async function scheduleShowsForNewTheatre(theatre, daysAhead = 7) {
  if (!theatre || !theatre.isActive) return;

  const Movie = require('../models/movieModel');
  const movies = await Movie.find({ isActive: true });
  if (!movies || movies.length === 0) return;

  const dates = [];
  for (let i = 0; i < daysAhead; i++) {
    dates.push(new Date(Date.now() + (i * 24 + 5.5) * 3600000).toISOString().split('T')[0]);
  }

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

  const existingShows = await Show.find({
    theatreId: theatre.theatreId,
    showDate: { $in: dates },
  }, 'movieId showDate showTime');

  const existingMap = new Set();
  existingShows.forEach((s) => existingMap.add(`${s.movieId}_${s.showDate}_${s.showTime}`));

  const newShowsToInsert = [];

  for (const movie of movies) {
    const movieIdStr = movie._id.toString();

    for (const dateStr of dates) {
      for (const time of DEFAULT_TIMES) {
        const key = `${movieIdStr}_${dateStr}_${time}`;
        if (!existingMap.has(key)) {
          newShowsToInsert.push({
            adminEmail: 'admin@imovies.com',
            showId: uuidv4(),
            movieId: movieIdStr,
            theatreName: theatre.theatreName,
            theatreId: theatre.theatreId,
            showDate: dateStr,
            showTime: time,
            tickets: JSON.parse(JSON.stringify(tickets)),
          });
        }
      }
    }
  }

  if (newShowsToInsert.length > 0) {
    // Insert in chunks of 500 to keep memory optimal
    const CHUNK_SIZE = 500;
    for (let i = 0; i < newShowsToInsert.length; i += CHUNK_SIZE) {
      const chunk = newShowsToInsert.slice(i, i + CHUNK_SIZE);
      await Show.insertMany(chunk, { ordered: false });
    }
  }
}

module.exports = {
  ensureShowsForMovie,
  scheduleShowsForNewTheatre,
};
