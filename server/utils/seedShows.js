const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const Theatre = require('../models/theatreModel');

async function seedShowsForMovies() {
  await mongoose.connect(process.env.MONGO_URI);
  const theatres = await Theatre.find({ isActive: true });
  console.log('Found theatres:', theatres.length);
  const movies = await Movie.find({ isActive: true });
  console.log('Found active movies:', movies.length);

  const times = ['10:00 AM', '01:30 PM', '04:45 PM', '07:30 PM', '10:15 PM'];
  let createdCount = 0;

  for (const movie of movies) {
    const movieIdStr = movie._id.toString();
    const tmdbIdStr = movie.tmdbId ? String(movie.tmdbId) : null;
    const searchIds = [movieIdStr, ...(tmdbIdStr ? [tmdbIdStr] : [])];

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

            const show = new Show({
              adminEmail: 'admin@imovies.com',
              showId: uuidv4(),
              movieId: movieIdStr,
              theatreName: theatre.theatreName,
              theatreId: theatre.theatreId,
              showDate: dateStr,
              showTime: time,
              tickets
            });
            await show.save();
            createdCount++;
          }
        }
      }
    }
  }

  console.log('Total new shows created across all movies & theatres:', createdCount);
  const totalShows = await Show.countDocuments();
  console.log('Total shows now in DB:', totalShows);
  await mongoose.disconnect();
}

seedShowsForMovies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
