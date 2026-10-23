const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Theatre = require('../models/theatreModel');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const { ensureShowsForMovie } = require('./showHelper');

/**
 * autoSeeder.js — Automatic Self-Healing Seeder
 * ─────────────────────────────────────────────
 * Automatically runs on backend boot (e.g., when deploying to Render / MongoDB Atlas).
 * Detects if the database is fresh/empty and seeds essential admins, theatres,
 * movies, and upcoming showtimes without manual terminal intervention.
 */

const buildSeatSection = (rows, cols) => {
  const seats = {};
  rows.forEach((row) => {
    for (let col = 1; col <= cols; col++) {
      const seatId = `${row}${col}`;
      seats[seatId] = { seatNumber: seatId, row, col };
    }
  });
  return seats;
};

async function autoSeedDatabase() {
  console.log('[AutoSeed] 🔍 Checking database collections status...');

  try {
    /* ── 1. Admin Verification / Seeding ── */
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('[AutoSeed] No admin accounts found. Creating default admin...');
      const adminEmail = 'admin@imovies.com';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await Admin.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            username: 'iMoviesAdmin',
            email: adminEmail,
            password: hashedPassword,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await User.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            username: 'iMoviesAdmin',
            email: adminEmail,
            password: hashedPassword,
            isVerified: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log('[AutoSeed] ✅ Admin ready: admin@imovies.com / password123 (or admin123)');
    }

    /* ── 2. Theatres Verification / Seeding ── */
    const theatreCount = await Theatre.countDocuments({ isActive: true });
    if (theatreCount === 0) {
      console.log('[AutoSeed] No active theatres found. Seeding core theatres with screen layouts...');
      const defaultTheatres = [
        {
          theatreId: 'pvr-imax-01',
          theatreName: 'PVR IMAX Metropolis',
          location: 'Downtown Square, South Wing',
          balconySeatPrice: 450,
          middleSeatPrice: 300,
          lowerSeatPrice: 180,
          balconySeats: buildSeatSection(['A', 'B'], 10),
          middleSeats: buildSeatSection(['C', 'D', 'E'], 12),
          lowerSeats: buildSeatSection(['F', 'G'], 14),
          isActive: true,
        },
        {
          theatreId: 'inox-laser-02',
          theatreName: 'INOX Megaplex 4K',
          location: 'Central Avenue, Grand Mall',
          balconySeatPrice: 380,
          middleSeatPrice: 250,
          lowerSeatPrice: 160,
          balconySeats: buildSeatSection(['A', 'B'], 8),
          middleSeats: buildSeatSection(['C', 'D'], 10),
          lowerSeats: buildSeatSection(['E', 'F'], 12),
          isActive: true,
        },
        {
          theatreId: 'cinepolis-vip-03',
          theatreName: 'Cinepolis VIP Luxe',
          location: 'Skyline Boulevard, West Wing',
          balconySeatPrice: 500,
          middleSeatPrice: 350,
          lowerSeatPrice: 220,
          balconySeats: buildSeatSection(['A', 'B'], 10),
          middleSeats: buildSeatSection(['C', 'D', 'E'], 10),
          lowerSeats: buildSeatSection(['F', 'G'], 12),
          isActive: true,
        },
        {
          theatreId: 'see-cinema-04',
          theatreName: 'SEE Cinema',
          location: 'Rau, Indore',
          balconySeatPrice: 351,
          middleSeatPrice: 250,
          lowerSeatPrice: 150,
          balconySeats: buildSeatSection(['A', 'B'], 10),
          middleSeats: buildSeatSection(['C', 'D', 'E'], 12),
          lowerSeats: buildSeatSection(['F', 'G'], 12),
          isActive: true,
        },
      ];

      for (const t of defaultTheatres) {
        await Theatre.findOneAndUpdate(
          { theatreId: t.theatreId },
          { $set: t },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`[AutoSeed] ✅ Seeded ${defaultTheatres.length} core theatres.`);
    }

    /* ── 3. Movies Catalog Verification ── */
    let movieCount = await Movie.countDocuments({ isActive: true });
    if (movieCount === 0) {
      console.log('[AutoSeed] Movie catalog empty. Synchronising initial movies...');
      try {
        const tmdbService = require('../services/tmdbService');
        const tmdbData = await tmdbService.getNowPlayingMovies();
        if (tmdbData && Array.isArray(tmdbData.movies) && tmdbData.movies.length > 0) {
          for (const m of tmdbData.movies) {
            await Movie.findOneAndUpdate(
              { tmdbId: m.tmdbId },
              { $set: { ...m, isActive: true } },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        }
      } catch (tmdbErr) {
        console.warn('[AutoSeed] TMDB auto-fetch notice:', tmdbErr.message);
      }

      movieCount = await Movie.countDocuments({ isActive: true });
      if (movieCount === 0) {
        // Fallback blockbusters if TMDB key is offline
        const fallback = [
          {
            movieName: 'Interstellar',
            description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
            genres: ['Sci-Fi', 'Adventure', 'Drama'],
            releaseDate: new Date('2014-11-07'),
            language: 'English',
            duration: '169 min',
            certification: 'U/A',
            posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            avgRating: 4.8,
            isActive: true,
          },
          {
            movieName: 'Deadpool & Wolverine',
            description: 'Deadpool\'s peaceful existence comes crashing down when the Time Variance Authority recruits him to help safeguard the multiverse.',
            genres: ['Action', 'Comedy', 'Sci-Fi'],
            releaseDate: new Date('2024-07-26'),
            language: 'English',
            duration: '128 min',
            certification: 'A',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
            avgRating: 4.6,
            isActive: true,
          },
          {
            movieName: 'The Dark Knight',
            description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
            genres: ['Action', 'Crime', 'Drama'],
            releaseDate: new Date('2008-07-18'),
            language: 'English',
            duration: '152 min',
            certification: 'U/A',
            posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
            avgRating: 4.9,
            isActive: true,
          },
        ];

        for (const m of fallback) {
          await Movie.findOneAndUpdate(
            { movieName: m.movieName },
            { $set: m },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
    }

    /* ── 4. Showtimes Verification & Scheduling ── */
    const todayStr = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];
    const upcomingShows = await Show.countDocuments({ showDate: { $gte: todayStr } });

    if (upcomingShows < 20) {
      console.log('[AutoSeed] Scheduling upcoming 7-day showtimes across all theatres...');
      const movies = await Movie.find({ isActive: true }).limit(20);
      for (const m of movies) {
        await ensureShowsForMovie(m, 7);
      }
      const newCount = await Show.countDocuments({ showDate: { $gte: todayStr } });
      console.log(`[AutoSeed] ✅ Scheduled ${newCount} screening slots.`);
    }

    console.log('[AutoSeed] ✅ Production database check complete.');
  } catch (err) {
    console.warn('[AutoSeed] Notice (non-fatal):', err.message);
  }
}

module.exports = { autoSeedDatabase };
