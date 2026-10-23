const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    movieId: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent duplicate favorites for the same user + movie
favoriteSchema.index({ userEmail: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
