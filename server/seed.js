/**
 * seed.js — Database Seeding Script for iMovies MERN Application
 * ───────────────────────────────────────────────────────────────
 * Connects to MongoDB via Mongoose using MONGO_URI from .env.
 * Seeds:
 *  1. Initial Admin account (admin@imovies.com / password123, role: admin)
 *  2. Default verified User account (user@imovies.com / user123)
 *  3. Mock theatres with full Balcony / Middle / Lower seat configurations
 *  4. Curated movies (live TMDB sync with offline fallback)
 *  5. Complete 7-day showtimes across all theatres with initialized seat tickets
 *
 * Safe to run repeatedly: handles existing entries gracefully without duplicates.
 * Run with: npm run seed (from server/ or root)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const Admin = require('./models/adminModel');
const User = require('./models/userModel');
const Theatre = require('./models/theatreModel');
const Movie = require('./models/movieModel');
const Show = require('./models/showModel');
const { ensureShowsForMovie } = require('./utils/showHelper');

/* ── Seat Layout Helper ─────────────────────────────────────────── */
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

/* ── Main Seed Routine ──────────────────────────────────────────── */
const runSeeder = async () => {
  const startTime = Date.now();
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/imovies';

  console.log('\n=========================================================');
  console.log('🎬 iMovies MERN Platform — Database Seeder');
  console.log('=========================================================');
  console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log('[Seed] ✅ MongoDB connected successfully.\n');

    /* ── 1. Seed Admin Accounts ────────────────────────────────────── */
    console.log('--- [1/5] Seeding Admin & User Accounts ---');
    const adminEmail = 'admin@imovies.com';
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashed = await bcrypt.hash('password123', adminSalt);

    // Upsert into Admin collection
    const adminDoc = await Admin.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          username: 'iMoviesAdmin',
          email: adminEmail,
          password: adminHashed,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Admin Account: ${adminDoc.email} (Password: password123 / admin123, Role: Admin)`);

    // Also ensure admin exists in User collection as a verified account
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          username: 'iMoviesAdmin',
          email: adminEmail,
          password: adminHashed,
          isVerified: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Default Customer User
    const userEmail = 'user@imovies.com';
    const userSalt = await bcrypt.genSalt(10);
    const userHashed = await bcrypt.hash('user123', userSalt);
    const userDoc = await User.findOneAndUpdate(
      { email: userEmail },
      {
        $set: {
          username: 'MovieFanatic',
          email: userEmail,
          password: userHashed,
          isVerified: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Demo User Account: ${userDoc.email} (Password: user123, Status: Verified)`);

    /* ── 2. Seed Mock Theatres & Seat Layouts ───────────────────────── */
    console.log('\n--- [2/5] Seeding Theatres with Seat Layouts ---');
    const theatresConfig = [
      {
        theatreId: 'pvr-imax-01',
        theatreName: 'PVR IMAX Metropolis',
        location: 'Downtown Square, South Wing',
        balconySeatPrice: 450,
        middleSeatPrice: 300,
        lowerSeatPrice: 180,
        balconySeats: buildSeatSection(['A', 'B'], 10), // 20 seats
        middleSeats: buildSeatSection(['C', 'D', 'E'], 12), // 36 seats
        lowerSeats: buildSeatSection(['F', 'G'], 14), // 28 seats
        isActive: true,
      },
      {
        theatreId: 'inox-laser-02',
        theatreName: 'INOX Megaplex 4K',
        location: 'Central Avenue, Grand Mall',
        balconySeatPrice: 380,
        middleSeatPrice: 250,
        lowerSeatPrice: 160,
        balconySeats: buildSeatSection(['A', 'B'], 8), // 16 seats
        middleSeats: buildSeatSection(['C', 'D'], 10), // 20 seats
        lowerSeats: buildSeatSection(['E', 'F'], 12), // 24 seats
        isActive: true,
      },
      {
        theatreId: 'cinepolis-vip-03',
        theatreName: 'Cinepolis VIP Luxe',
        location: 'Skyline Boulevard, West Wing',
        balconySeatPrice: 500,
        middleSeatPrice: 350,
        lowerSeatPrice: 220,
        balconySeats: buildSeatSection(['A', 'B'], 10), // 20 seats
        middleSeats: buildSeatSection(['C', 'D', 'E'], 10), // 30 seats
        lowerSeats: buildSeatSection(['F', 'G'], 12), // 24 seats
        isActive: true,
      },
    ];

    const seededTheatres = [];
    for (const t of theatresConfig) {
      const doc = await Theatre.findOneAndUpdate(
        { theatreId: t.theatreId },
        { $set: t },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      seededTheatres.push(doc);
      const totalSeats =
        Object.keys(doc.balconySeats || {}).length +
        Object.keys(doc.middleSeats || {}).length +
        Object.keys(doc.lowerSeats || {}).length;
      console.log(`✅ Theatre: ${doc.theatreName} [${doc.location}] — ${totalSeats} total seats (₹${doc.lowerSeatPrice} - ₹${doc.balconySeatPrice})`);
    }

    /* ── 3. Seed Movies (TMDB Sync with Fallback) ──────────────────── */
    console.log('\n--- [3/5] Synchronising Movie Catalog ---');
    let movies = await Movie.find({ isActive: true });

    if (movies.length === 0) {
      console.log('[Seed] Local catalog empty. Attempting live fetch from TMDB...');
      try {
        const tmdbService = require('./services/tmdbService');
        const tmdbRes = await tmdbService.getNowPlayingMovies();
        if (tmdbRes && Array.isArray(tmdbRes.movies) && tmdbRes.movies.length > 0) {
          for (const m of tmdbRes.movies) {
            await Movie.findOneAndUpdate(
              { tmdbId: m.tmdbId },
              { $set: { ...m, isActive: true } },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        }
      } catch (tmdbErr) {
        console.warn('[Seed] TMDB sync warning (offline fallback active):', tmdbErr.message);
      }
      movies = await Movie.find({ isActive: true });
    }

    // Curated fallback blockbusters if no external movies found
    if (movies.length === 0) {
      const fallbackMovies = [
        {
          movieName: 'Interstellar',
          description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
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
          description: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit up again.',
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
          description: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
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

      for (const fm of fallbackMovies) {
        const doc = await Movie.findOneAndUpdate(
          { movieName: fm.movieName },
          { $set: fm },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        movies.push(doc);
      }
    }
    console.log(`✅ Active Movie Catalog: ${movies.length} movies ready for booking.`);

    /* ── 4. Seed Showtimes Across All Theatres ──────────────────────── */
    console.log('\n--- [4/5] Scheduling Showtimes for Next 7 Days ---');
    console.log('[Seed] Auto-scheduling screenings for active movies across all theatres...');
    
    // Schedule for all active movies across all active theatres
    let showSyncCount = 0;
    for (const movie of movies) {
      await ensureShowsForMovie(movie, 7);
      showSyncCount++;
    }

    const totalShows = await Show.countDocuments();
    const todayStr = new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0];
    const upcomingShows = await Show.countDocuments({ showDate: { $gte: todayStr } });

    console.log(`✅ Screenings scheduled for ${showSyncCount} movies.`);
    console.log(`✅ Total active showtimes in DB: ${totalShows} (${upcomingShows} upcoming slots).`);

    /* ── 5. Completion Summary ─────────────────────────────────────── */
    console.log('\n--- [5/5] Database Verification & Summary ---');
    const counts = {
      admins: await Admin.countDocuments(),
      users: await User.countDocuments(),
      theatres: await Theatre.countDocuments({ isActive: true }),
      movies: await Movie.countDocuments({ isActive: true }),
      shows: totalShows,
    };

    console.log(`
┌───────────────────────────────┬──────────────┐
│ Entity                        │ Total Count  │
├───────────────────────────────┼──────────────┤
│ Admin Accounts                │ ${String(counts.admins).padEnd(12)} │
│ Registered Users              │ ${String(counts.users).padEnd(12)} │
│ Active Theatres               │ ${String(counts.theatres).padEnd(12)} │
│ Active Movies                 │ ${String(counts.movies).padEnd(12)} │
│ Total Showtimes               │ ${String(counts.shows).padEnd(12)} │
└───────────────────────────────┴──────────────┘

🔑 Quick Login Credentials:
  • Admin Email:     admin@imovies.com
  • Admin Password:  password123 (or admin123)
  • User Email:      user@imovies.com
  • User Password:   user123

Time Elapsed: ${((Date.now() - startTime) / 1000).toFixed(2)}s
🎉 Seeding completed successfully!
=========================================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [Seed Error] Fatal error while seeding database:');
    console.error(error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

runSeeder();
