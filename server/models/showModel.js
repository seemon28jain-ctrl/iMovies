const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, required: true },
    showId: { type: String, required: true, unique: true },
    movieId: { type: String, required: true },
    theatreName: { type: String, required: true },
    theatreId: { type: String, required: true },
    showDate: { type: String, required: true },
    showTime: { type: String, required: true },
    // tickets object: { seatId: { status, type, price, lockExpiry?, bookedBy? } }
    tickets: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Show', showSchema);
