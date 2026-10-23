const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Show = require('../models/showModel');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');
const emailService = require('../services/emailService');

// How long a seat lock is valid (10 minutes in ms)
const LOCK_DURATION_MS = 10 * 60 * 1000;

const isShowTimePast = (showDate, showTime) => {
  if (!showDate || !showTime) return false;
  try {
    const parts = showTime.trim().split(' ');
    const timeParts = parts[0].split(':').map(Number);
    let hours = timeParts[0];
    const minutes = timeParts[1] || 0;
    const modifier = (parts[1] || '').toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const [year, month, day] = showDate.split('-').map(Number);
    const showDateTime = new Date(year, month - 1, day, hours, minutes);
    return showDateTime.getTime() < Date.now() - 5 * 60 * 1000;
  } catch (e) {
    return false;
  }
};

const findShowByIdOrUuid = async (showId) => {
  if (!showId) return null;
  if (mongoose.isValidObjectId(showId)) {
    return await Show.findOne({ $or: [{ showId }, { _id: showId }] });
  }
  return await Show.findOne({ showId });
};

const findBookingByIdOrUuid = async (bookingId) => {
  if (!bookingId) return null;
  if (mongoose.isValidObjectId(bookingId)) {
    return await Booking.findOne({ $or: [{ bookingId }, { _id: bookingId }] });
  }
  return await Booking.findOne({ bookingId });
};

/* ─────────────────────────── Lock Seats ─────────────────────────── */

/**
 * POST /api/bookings/lock
 * Temporarily lock selected seats for the requesting user.
 * Body: { showId, selectedSeats: ['A1', 'A2', ...] }
 */
const lockSeats = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !selectedSeats.length) {
      return res.status(400).json({ success: false, message: 'showId and selectedSeats are required.' });
    }

    const show = await findShowByIdOrUuid(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // Check if the showtime has already concluded
    if (isShowTimePast(show.showDate, show.showTime)) {
      return res.status(400).json({
        success: false,
        message: 'This screening has already concluded. Please choose an upcoming showtime.',
      });
    }

    const tickets = show.tickets;
    const now = Date.now();

    // Verify all requested seats are available
    for (const seatId of selectedSeats) {
      const seat = tickets[seatId];
      if (!seat) {
        return res.status(400).json({ success: false, message: `Seat ${seatId} does not exist.` });
      }
      if (seat.status === 'booked') {
        return res.status(409).json({ success: false, message: `Seat ${seatId} is already booked.` });
      }
      if (seat.status === 'locked' && seat.lockExpiry > now && seat.bookedBy !== userEmail) {
        return res.status(409).json({ success: false, message: `Seat ${seatId} is currently locked by another user.` });
      }
    }

    // Lock the seats
    const updatedTickets = { ...tickets };
    for (const seatId of selectedSeats) {
      updatedTickets[seatId] = {
        ...updatedTickets[seatId],
        status: 'locked',
        lockExpiry: now + LOCK_DURATION_MS,
        bookedBy: userEmail,
      };
    }

    // Use markModified because tickets is a Mixed type
    show.tickets = updatedTickets;
    show.markModified('tickets');
    await show.save();

    // Broadcast lock update via socket
    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seats-locked', {
        showId: show.showId,
        selectedSeats,
        userEmail,
      });
      io.to(show.showId).emit('seat-status-update', {
        showId: show.showId,
        tickets: show.tickets,
      });
    }

    res.json({
      success: true,
      message: 'Seats locked successfully.',
      lockExpiry: now + LOCK_DURATION_MS,
      selectedSeats,
    });
  } catch (err) {
    console.error('[lockSeats]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────── Release Locked Seats ─────────────────────────── */

/**
 * POST /api/bookings/release
 * Release temporarily locked seats if payment fails or user cancels checkout.
 * Body: { showId, selectedSeats: ['A1', 'A2', ...] }
 */
const releaseSeats = async (req, res) => {
  try {
    const { showId, selectedSeats } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !selectedSeats.length) {
      return res.status(400).json({ success: false, message: 'showId and selectedSeats are required.' });
    }

    const show = await findShowByIdOrUuid(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const updatedTickets = { ...show.tickets };
    selectedSeats.forEach((seatId) => {
      if (
        updatedTickets[seatId] &&
        updatedTickets[seatId].status === 'locked' &&
        updatedTickets[seatId].bookedBy === userEmail
      ) {
        updatedTickets[seatId] = {
          ...updatedTickets[seatId],
          status: 'available',
          lockExpiry: null,
          bookedBy: null,
        };
      }
    });

    show.tickets = updatedTickets;
    show.markModified('tickets');
    await show.save();

    const io = req.app.get('io');
    if (io) {
      io.to(show.showId).emit('seats-released', {
        showId: show.showId,
        selectedSeats,
      });
      io.to(show.showId).emit('seat-status-update', {
        showId: show.showId,
        tickets: show.tickets,
      });
    }

    res.json({
      success: true,
      message: 'Seats released successfully.',
      selectedSeats,
    });
  } catch (err) {
    console.error('[releaseSeats]', err.message);
    res.status(500).json({ success: false, message: 'Server error releasing seats.' });
  }
};

/* ─────────────────────────── Create Booking ─────────────────────────── */

/**
 * POST /api/bookings
 * Confirm booking for previously locked seats. Marks seats as 'booked'.
 * Body: { showId, selectedSeats, totalAmount }
 */
const createBooking = async (req, res) => {
  try {
    const { showId, selectedSeats, totalAmount } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !selectedSeats.length) {
      return res.status(400).json({ success: false, message: 'showId and selectedSeats are required.' });
    }

    const show = await findShowByIdOrUuid(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const tickets = show.tickets;
    const now = Date.now();

    // Verify seats are still locked by this user and not expired
    for (const seatId of selectedSeats) {
      const seat = tickets[seatId];
      if (!seat || seat.status !== 'locked' || seat.bookedBy !== userEmail || seat.lockExpiry < now) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatId} lock has expired or is not held by you. Please re-select.`,
        });
      }
    }

    // Mark seats as booked
    const updatedTickets = { ...tickets };
    const ticketsData = {};
    for (const seatId of selectedSeats) {
      updatedTickets[seatId] = {
        ...updatedTickets[seatId],
        status: 'booked',
        lockExpiry: null,
      };
      ticketsData[seatId] = updatedTickets[seatId];
    }

    show.tickets = updatedTickets;
    show.markModified('tickets');
    await show.save();

    // Create the booking record
    const bookingId = uuidv4();
    const booking = new Booking({
      bookingId,
      userEmail,
      showId,
      movieId: show.movieId,
      theatreName: show.theatreName,
      showDate: show.showDate,
      showTime: show.showTime,
      ticketsData,
      selectedSeats,
      totalAmount: totalAmount || 0,
      paymentStatus: 'Completed',
    });

    await booking.save();

    emailService.sendBookingConfirmationEmail(userEmail, {
      bookingId,
      movieName: booking.movieName || 'Movie Screening',
      theatreName: show.theatreName,
      showDate: show.showDate,
      showTime: show.showTime,
      selectedSeats,
      totalAmount: totalAmount || 0,
    }).catch((e) => console.warn('[createBooking] Brevo email notice:', e.message));

    res.status(201).json({ success: true, message: 'Booking confirmed.', booking });
  } catch (err) {
    console.error('[createBooking]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────── Cancel Booking ─────────────────────────── */

/**
 * PUT /api/bookings/cancel/:bookingId
 * Cancel a booking and release seats back to 'available'.
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userEmail = req.user.email;

    const booking = await findBookingByIdOrUuid(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userEmail !== userEmail) {
      return res.status(403).json({ success: false, message: 'Not authorised to cancel this booking.' });
    }

    if (booking.paymentStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled.' });
    }

    // Release seats back to available in the show
    const show = await findShowByIdOrUuid(booking.showId);
    if (show) {
      const updatedTickets = { ...show.tickets };
      for (const seatId of booking.selectedSeats) {
        if (updatedTickets[seatId]) {
          updatedTickets[seatId] = {
            ...updatedTickets[seatId],
            status: 'available',
            lockExpiry: null,
            bookedBy: null,
          };
        }
      }
      show.tickets = updatedTickets;
      show.markModified('tickets');
      await show.save();
    }

    // Update booking status
    booking.paymentStatus = 'Cancelled';
    await booking.save();

    emailService.sendBookingStatusUpdateEmail(userEmail, {
      bookingId: booking.bookingId,
      movieName: booking.movieName || 'Movie Screening',
      status: 'Cancelled',
      reason: 'User cancelled booking and released seats',
    }).catch((e) => console.warn('[cancelBooking] Brevo email notice:', e.message));

    res.json({ success: true, message: 'Booking cancelled and seats released.', booking });
  } catch (err) {
    console.error('[cancelBooking]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────── Get Bookings ─────────────────────────── */

/**
 * GET /api/bookings/user
 * Get all bookings for the currently logged-in user.
 */
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userEmail: req.user.email }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('[getUserBookings]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/bookings
 * Admin only — get all bookings across all users.
 */
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('[getAllBookings]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/bookings/:bookingId
 * Get details of a single booking by bookingId.
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await findBookingByIdOrUuid(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Users can only view their own bookings
    if (!req.user.isAdmin && booking.userEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error('[getBookingById]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  lockSeats,
  releaseSeats,
  createBooking,
  cancelBooking,
  getUserBookings,
  getAllBookings,
  getBookingById,
};
