const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    showId: { type: String, required: true },
    movieId: { type: String, required: true },
    movieName: { type: String, default: '' },
    theatreName: { type: String, required: true },
    showDate: { type: String, required: true },
    showTime: { type: String, required: true },
    // ticketsData mirrors the per-seat details at booking time
    ticketsData: { type: Object, required: true },
    selectedSeats: [String],
    totalAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
      default: 'Pending',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    refundId: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
