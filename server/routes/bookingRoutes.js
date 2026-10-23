const express = require('express');
const router = express.Router();
const {
  lockSeats,
  releaseSeats,
  createBooking,
  cancelBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
} = require('../controllers/bookingController');
const fetchUser = require('../middlewares/fetchUser');
const fetchAdmin = require('../middlewares/fetchAdmin');

// POST /api/bookings/lock  (user — temporarily lock seats)
router.post('/lock', fetchUser, lockSeats);

// POST /api/bookings/release  (user — release locked seats on failure/cancel)
router.post('/release', fetchUser, releaseSeats);

// POST /api/bookings  (user — confirm booking)
router.post('/', fetchUser, createBooking);

// PUT /api/bookings/cancel/:bookingId  (user — cancel booking)
router.put('/cancel/:bookingId', fetchUser, cancelBooking);

// GET /api/bookings/user  (user — own bookings)
// IMPORTANT: must come before /:bookingId to avoid param capture
router.get('/user', fetchUser, getUserBookings);

// GET /api/bookings  (admin — all bookings)
router.get('/', fetchAdmin, getAllBookings);

// GET /api/bookings/:bookingId  (user or admin)
router.get('/:bookingId', fetchUser, getBookingById);

module.exports = router;
