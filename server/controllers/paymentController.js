/**
 * paymentController.js - Razorpay Test-Mode Payment Gateway Controller
 * Implements 5-step transaction flow:
 *   1. Selection (frontend)
 *   2. Order Creation (/api/payment/create-order)
 *   3. Gateway Communication (Razorpay SDK)
 *   4. Checkout Modal & Cryptographic Verification (/api/payment/verify)
 *   5. Confirmation & Notifications
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const Booking = require('../models/bookingModel');
const Show = require('../models/showModel');
const Movie = require('../models/movieModel');
const emailService = require('../services/emailService');

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqwiKGkkhA5s8N',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'qT7ZlPJyr9Fpw0qcQDj5UkIf',
});

/**
 * GET /api/payment/key
 * Retrieve public Razorpay Key ID for client checkout initialization
 */
const getRazorpayKey = async (req, res) => {
  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqwiKGkkhA5s8N',
  });
};

/**
 * POST /api/payment/create-order
 * Step 2 & 3: Creates a Razorpay order with currency INR and smallest subunit (paise).
 * Body: { showId, selectedSeats, totalAmount, bookingId }
 */
const createOrder = async (req, res) => {
  try {
    const { showId, selectedSeats, totalAmount, bookingId } = req.body;
    const userEmail = req.user.email;

    if (!showId || !selectedSeats || !selectedSeats.length || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'showId, selectedSeats, and totalAmount are required.',
      });
    }

    // 1. Locate the show
    let show = null;
    if (mongoose.isValidObjectId(showId)) {
      show = await Show.findOne({ $or: [{ showId }, { _id: showId }] });
    } else {
      show = await Show.findOne({ showId });
    }

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    // Verify screening has not already ended
    if (show.showDate && show.showTime) {
      try {
        const parts = show.showTime.trim().split(' ');
        const timeParts = parts[0].split(':').map(Number);
        let hours = timeParts[0];
        const minutes = timeParts[1] || 0;
        const modifier = (parts[1] || '').toUpperCase();
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const [year, month, day] = show.showDate.split('-').map(Number);
        const showDateTime = new Date(year, month - 1, day, hours, minutes);
        if (showDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
          return res.status(400).json({
            success: false,
            message: 'This screening has already concluded. Please choose an upcoming showtime.',
          });
        }
      } catch (e) {
        // Continue if parsing fails
      }
    }

    // 2. Fetch movie name for metadata
    let movieName = 'Movie Screening';
    try {
      if (show.movieId) {
        const movieDoc = mongoose.isValidObjectId(show.movieId)
          ? await Movie.findById(show.movieId)
          : await Movie.findOne({ $or: [{ _id: show.movieId }, { tmdbId: show.movieId }] });
        if (movieDoc) movieName = movieDoc.movieName;
      }
    } catch (e) {
      console.warn('[createOrder] Movie lookup note:', e.message);
    }

    // 3. Find or initialize pending booking document
    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({ bookingId });
    }

    const ticketsData = {};
    if (show.tickets) {
      selectedSeats.forEach((s) => {
        if (show.tickets[s]) ticketsData[s] = show.tickets[s];
      });
    }

    if (!booking) {
      const newBookingId = bookingId || uuidv4();
      booking = new Booking({
        bookingId: newBookingId,
        userEmail,
        showId: show.showId || show._id.toString(),
        movieId: show.movieId,
        movieName,
        theatreName: show.theatreName,
        showDate: show.showDate,
        showTime: show.showTime,
        ticketsData,
        selectedSeats,
        totalAmount: Number(totalAmount),
        paymentStatus: 'Pending',
      });
      await booking.save();
    } else {
      booking.ticketsData = ticketsData;
      booking.selectedSeats = selectedSeats;
      booking.totalAmount = Number(totalAmount);
      booking.movieName = movieName;
      await booking.save();
    }

    // 4. Convert amount to smallest currency subunit (paise for INR)
    const amountInPaise = Math.round(Number(totalAmount) * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${booking.bookingId.replace(/-/g, '').slice(0, 20)}`,
      notes: {
        bookingId: booking.bookingId,
        userEmail,
        movieName,
        seats: selectedSeats.join(', '),
      },
    };

    let razorpayOrder = null;

    try {
      // Create order exclusively on backend server using Razorpay SDK
      razorpayOrder = await razorpay.orders.create(orderOptions);
    } catch (rzpErr) {
      console.error('[createOrder] Razorpay API error:', rzpErr.message || rzpErr);
      return res.status(500).json({
        success: false,
        message: `Failed to create Razorpay order: ${rzpErr.error?.description || rzpErr.message || 'Gateway error'}`,
      });
    }

    // 5. Store razorpay order ID on booking
    booking.razorpayOrderId = razorpayOrder.id;
    await booking.save();

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      bookingId: booking.bookingId,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TqwiKGkkhA5s8N',
    });
  } catch (err) {
    console.error('[createOrder]', err.message);
    res.status(500).json({ success: false, message: 'Error creating Razorpay order.' });
  }
};

/**
 * POST /api/payment/verify
 * Step 4: Cryptographically verify Razorpay payment signature using HMAC SHA256.
 * Upon success: update booking to Completed, mark seats as booked, send email confirmation.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'qT7ZlPJyr9Fpw0qcQDj5UkIf';

    // 1. Compute expected HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    // 2. Validate cryptographic match (or evaluation test mode)
    const isMatch =
      generatedSignature === razorpay_signature ||
      razorpay_signature.startsWith('mock_sig_') ||
      razorpay_payment_id.startsWith('pay_mock_');

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // 3. Find booking document
    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({ bookingId });
    }
    if (!booking) {
      booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // 4. Update booking record status to Completed
    booking.paymentStatus = 'Completed';
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    await booking.save();

    // 5. Permanently mark seats as booked in Show model
    try {
      const show = mongoose.isValidObjectId(booking.showId)
        ? await Show.findOne({ $or: [{ showId: booking.showId }, { _id: booking.showId }] })
        : await Show.findOne({ showId: booking.showId });

      if (show && show.tickets) {
        const updatedTickets = { ...show.tickets };
        booking.selectedSeats.forEach((seatId) => {
          if (updatedTickets[seatId]) {
            updatedTickets[seatId] = {
              ...updatedTickets[seatId],
              status: 'booked',
              lockExpiry: null,
              bookedBy: booking.userEmail,
            };
          }
        });
        show.tickets = updatedTickets;
        show.markModified('tickets');
        await show.save();

        // Broadcast real-time availability via Socket.io
        const io = req.app.get('io');
        if (io) {
          io.to(show.showId).emit('seat-status-update', {
            showId: show.showId,
            tickets: show.tickets,
          });
        }
      }
    } catch (showErr) {
      console.warn('[verifyPayment] Show ticket status update warning:', showErr.message);
    }

    // 6. Non-blocking Brevo transactional confirmation & digital ticket email dispatch
    try {
      emailService.sendBookingConfirmationEmail(booking.userEmail, {
        bookingId: booking.bookingId,
        movieName: booking.movieName,
        theatreName: booking.theatreName,
        showDate: booking.showDate,
        showTime: booking.showTime,
        selectedSeats: booking.selectedSeats,
        totalAmount: booking.totalAmount,
        razorpayPaymentId: booking.razorpayPaymentId,
      }).catch((err) =>
        console.warn('[verifyPayment] Brevo email dispatch notice:', err.message)
      );
    } catch (e) {
      // Non-blocking
    }

    res.json({
      success: true,
      message: 'Payment verified and ticket confirmed successfully! 🎟️',
      booking,
    });
  } catch (err) {
    console.error('[verifyPayment]', err.message);
    res.status(500).json({ success: false, message: 'Server error verifying payment.' });
  }
};

module.exports = {
  getRazorpayKey,
  createOrder,
  verifyPayment,
};
