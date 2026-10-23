const Favorite = require('../models/favoriteModel');
const Movie = require('../models/movieModel');

/**
 * POST /api/favorites
 * Add a movie to the logged-in user's favorites.
 * Body: { movieId }
 */
const addFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userEmail = req.user.email;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required.' });
    }

    // Check the movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    // findOneAndUpdate with upsert avoids duplicate key errors on concurrent requests
    const favorite = await Favorite.findOneAndUpdate(
      { userEmail, movieId },
      { userEmail, movieId },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Movie added to favorites.', favorite });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Movie already in favorites.' });
    }
    console.error('[addFavorite]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/favorites/:movieId
 * Remove a movie from favorites.
 */
const removeFavorite = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { movieId } = req.params;

    const result = await Favorite.findOneAndDelete({ userEmail, movieId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Favorite not found.' });
    }

    res.json({ success: true, message: 'Movie removed from favorites.' });
  } catch (err) {
    console.error('[removeFavorite]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/favorites
 * Get all favorites for the logged-in user, populated with full movie details.
 */
const getUserFavorites = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const favorites = await Favorite.find({ userEmail });

    // Fetch full movie documents for each favorite
    const movieIds = favorites.map((f) => f.movieId);
    const movies = await Movie.find({ _id: { $in: movieIds }, isActive: true });

    res.json({ success: true, count: movies.length, movies });
  } catch (err) {
    console.error('[getUserFavorites]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addFavorite, removeFavorite, getUserFavorites };
