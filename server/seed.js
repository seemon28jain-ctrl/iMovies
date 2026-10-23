/**
 * seed.js - Database Seeder Script for iMovies
 * Creates default Admin, User, Sample Movies, Theatres, and Shows
 * Run with: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = require('./models/userModel');
const Admin = require('./models/adminModel');
const Movie = require('./models/movieModel');
const Theatre = require('./models/theatreModel');
const Show = require('./models/showModel');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/imovies';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // 1. Create Default Admin
    const adminEmail = 'admin@imovies.com';
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = new Admin({
        username: 'iMoviesAdmin',
        email: adminEmail,
        password: hashedPassword,
      });
      await admin.save();
      console.log('✅ Default Admin created: admin@imovies.com / admin123');
    } else {
      console.log('ℹ️ Admin already exists');
    }

    // 2. Create Default User
    const userEmail = 'user@imovies.com';
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);
      user = new User({
        username: 'MovieFanatic',
        email: userEmail,
        password: hashedPassword,
      });
      await user.save();
      console.log('✅ Default User created: user@imovies.com / user123');
    } else {
      console.log('ℹ️ User already exists');
    }

    // 3. Create Sample Theatres
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

    let theatre1 = await Theatre.findOne({ theatreId: 'pvr-imax-01' });
    if (!theatre1) {
      theatre1 = new Theatre({
        theatreName: 'PVR IMAX Metropolis',
        theatreId: 'pvr-imax-01',
        location: 'Downtown Square, South Wing',
        balconySeatPrice: 450,
        middleSeatPrice: 300,
        lowerSeatPrice: 180,
        balconySeats: buildSeatSection(['A', 'B'], 10),
        middleSeats: buildSeatSection(['C', 'D', 'E'], 12),
        lowerSeats: buildSeatSection(['F', 'G'], 14),
      });
      await theatre1.save();
      console.log('✅ Theatre 1 created: PVR IMAX Metropolis');
    }

    let theatre2 = await Theatre.findOne({ theatreId: 'inox-laser-02' });
    if (!theatre2) {
      theatre2 = new Theatre({
        theatreName: 'INOX Megaplex 4K',
        theatreId: 'inox-laser-02',
        location: 'Central Avenue, Grand Mall',
        balconySeatPrice: 380,
        middleSeatPrice: 250,
        lowerSeatPrice: 160,
        balconySeats: buildSeatSection(['A', 'B'], 8),
        middleSeats: buildSeatSection(['C', 'D'], 10),
        lowerSeats: buildSeatSection(['E', 'F'], 12),
      });
      await theatre2.save();
      console.log('✅ Theatre 2 created: INOX Megaplex 4K');
    }

    // 4. Fetch Live Market Movies from TMDB (No mock seeded movies)
    const tmdbService = require('./services/tmdbService');
    console.log('[Seed] Synchronising live market movies from TMDB...');
    let liveMovies = [];
    try {
      const tmdbData = await tmdbService.getNowPlayingMovies();
      if (tmdbData && tmdbData.movies) {
        for (const m of tmdbData.movies) {
          const doc = await Movie.findOneAndUpdate(
            { tmdbId: m.tmdbId },
            { $set: { ...m, isActive: true } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          liveMovies.push(doc);
        }
      }
    } catch (e) {
      console.warn('[Seed] TMDB sync notice:', e.message);
      liveMovies = await Movie.find({ tmdbId: { $exists: true } });
    }

    const savedMovies = liveMovies.slice(0, 6);

    // 5. Create Sample Shows for Today and Next Few Days
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const showTimes = ['10:00 AM', '01:30 PM', '04:45 PM', '07:30 PM', '10:15 PM'];

    const initializeTickets = (theatre) => {
      const tickets = {};
      const addSection = (map, type, price) => {
        Object.keys(map).forEach((seatId) => {
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
      addSection(theatre.balconySeats, 'balcony', theatre.balconySeatPrice);
      addSection(theatre.middleSeats, 'middle', theatre.middleSeatPrice);
      addSection(theatre.lowerSeats, 'lower', theatre.lowerSeatPrice);
      return tickets;
    };

    let showCount = 0;
    for (const movie of savedMovies) {
      for (const date of [today, tomorrow]) {
        for (const time of ['01:30 PM', '07:30 PM']) {
          const existing = await Show.findOne({
            movieId: movie._id.toString(),
            theatreId: theatre1.theatreId,
            showDate: date,
            showTime: time,
          });

          if (!existing) {
            const show = new Show({
              adminEmail: admin.email,
              showId: uuidv4(),
              movieId: movie._id.toString(),
              theatreName: theatre1.theatreName,
              theatreId: theatre1.theatreId,
              showDate: date,
              showTime: time,
              tickets: initializeTickets(theatre1),
            });
            await show.save();
            showCount++;
          }
        }
      }
    }
    console.log(`✅ Seeded ${showCount} scheduled showtimes.`);

    console.log('\n=========================================');
    console.log('🎉 iMovies Database Seeding Completed!');
    console.log('Admin login: admin@imovies.com / admin123');
    console.log('User login:  user@imovies.com / user123');
    console.log('=========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  }
};

seedData();
