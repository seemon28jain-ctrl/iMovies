const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    movieName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    genres: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one genre is required',
      },
    },
    releaseDate: { type: Date, required: true },
    language: { type: String, required: true },
    duration: { type: String, required: true },
    certification: { type: String, default: 'U/A' },
    posterUrl: { type: String, default: '' },
    trailerUrl: { type: String, default: '' },
    cast: [{ name: String, role: String }],
    avgRating: { type: Number, default: 4.0 },
    tmdbId: { type: Number, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
