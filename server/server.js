/**
 * iMovies — Main Express Server
 * ─────────────────────────────
 * Boots the Express HTTP server, connects to MongoDB, mounts all API
 * routes, initialises Socket.io for real-time seat updates, and
 * starts background cron services (cleanup + reminders).
 */

const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (_) {
  // Production containers inject process.env directly
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Route imports ─────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const emailRoutes = require('./routes/emailRoutes');

// ── Background services ───────────────────────────────────────────
const { startCleanupService } = require('./utils/cleanupService');
const { startReminderService } = require('./utils/reminderService');

/* ═══════════════════════════════════════════════════════════════════
   App + HTTP server + Socket.io initialisation
═══════════════════════════════════════════════════════════════════ */

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

/* ═══════════════════════════════════════════════════════════════════
   Global Middlewares — Dynamic CORS for Vercel, Localhost & Production
═══════════════════════════════════════════════════════════════════ */

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Dynamically echo and allow:
      // 1. Any localhost port (Vite dev 5173, 3000, 4173, etc.)
      // 2. Any Vercel deployment (*.vercel.app)
      // 3. Any Render deployment (*.onrender.com)
      // 4. Any custom production domain configured in CLIENT_URL
      // 5. Fallback allow all origins to prevent any live deployment blocks
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'auth-token',
      'admin-auth-token',
    ],
    exposedHeaders: ['auth-token', 'admin-auth-token'],
    optionsSuccessStatus: 200,
  })
);

// Enable explicit preflight support for all routes
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ═══════════════════════════════════════════════════════════════════
   Health check endpoint
═══════════════════════════════════════════════════════════════════ */

app.get('/', (req, res) => {
  res.json({ success: true, message: 'iMovies API is running 🎬', version: '1.0.0' });
});

/* ═══════════════════════════════════════════════════════════════════
   API Routes
═══════════════════════════════════════════════════════════════════ */

app.use('/api/auth', authRoutes);
app.use('/api/auth/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatre', theatreRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/show', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/reviews', reviewRoutes);

/* ═══════════════════════════════════════════════════════════════════
   Static frontend serving (Production / Render single-service support)
═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

/* ═══════════════════════════════════════════════════════════════════
   404 handler (must come after all routes)
═══════════════════════════════════════════════════════════════════ */

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

/* ═══════════════════════════════════════════════════════════════════
   Global error handler
═══════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ═══════════════════════════════════════════════════════════════════
   Socket.io — Real-time Seat Updates
═══════════════════════════════════════════════════════════════════ */

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  /**
   * join-show
   * Client joins a show's room to receive real-time seat status updates.
   * Payload: { showId: string }
   */
  socket.on('join-show', ({ showId }) => {
    if (!showId) return;
    socket.join(showId);
    console.log(`[Socket.io] Socket ${socket.id} joined show room: ${showId}`);
  });

  /**
   * leave-show
   * Client leaves a show room (e.g., navigates away from seat selection).
   * Payload: { showId: string }
   */
  socket.on('leave-show', ({ showId }) => {
    if (!showId) return;
    socket.leave(showId);
    console.log(`[Socket.io] Socket ${socket.id} left show room: ${showId}`);
  });

  /**
   * lock-seats (client-triggered optimistic update)
   * Broadcast a seat lock event to all other clients in the show room
   * so the UI immediately reflects the pending lock.
   * Payload: { showId, selectedSeats, userEmail }
   */
  socket.on('lock-seats', ({ showId, selectedSeats, userEmail }) => {
    if (!showId || !selectedSeats) return;
    // Broadcast to everyone in the room except the sender
    socket.to(showId).emit('seats-locked', { showId, selectedSeats, userEmail });
    console.log(
      `[Socket.io] Seat lock broadcast for show ${showId}: [${selectedSeats.join(', ')}]`
    );
  });

  /**
   * release-seats (client-triggered optimistic update)
   * Broadcast a seat release event to all other clients in the room.
   * Payload: { showId, selectedSeats }
   */
  socket.on('release-seats', ({ showId, selectedSeats }) => {
    if (!showId || !selectedSeats) return;
    socket.to(showId).emit('seats-released', { showId, selectedSeats });
    console.log(
      `[Socket.io] Seat release broadcast for show ${showId}: [${selectedSeats.join(', ')}]`
    );
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   MongoDB Connection + Server Start
═══════════════════════════════════════════════════════════════════ */

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('\n⚠️ [MongoDB Config Warning] MONGO_URI environment variable is not defined!');
  console.error('Please set MONGO_URI in your cloud deployment environment variables (e.g. Render/Vercel).');
  console.error('Example: MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/imovies?retryWrites=true&w=majority\n');
}

mongoose
  .connect(MONGO_URI || 'mongodb://localhost:27017/imovies')
  .then(async () => {
    const maskedUri = (MONGO_URI || 'mongodb://localhost:27017/imovies').replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log('[MongoDB] Connected successfully to', maskedUri);

    // Auto-seed check: if deployed with an empty database, seed initial theatres, admin, and shows
    try {
      const { autoSeedDatabase } = require('./utils/autoSeeder');
      await autoSeedDatabase();
    } catch (seedErr) {
      console.warn('[AutoSeed] Notice:', seedErr.message);
    }

    // Start background cron services after DB is ready
    startCleanupService(io);
    startReminderService();

    // Start the HTTP server
    server.listen(PORT, () => {
      console.log(`[Server] iMovies API running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { app, io };
