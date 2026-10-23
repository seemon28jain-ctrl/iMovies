const Review = require('../models/reviewModel');

/**
 * POST /api/reviews
 * Submit or update a review (upsert — one review per user per movie).
 * Body: { movieId, rating, reviewText }
 */
const addReview = async (req, res) => {
  try {
    const { movieId, rating, reviewText } = req.body;
    const { email: userEmail, username } = req.user;

    if (!movieId || !rating || !reviewText) {
      return res
        .status(400)
        .json({ success: false, message: 'movieId, rating and reviewText are required.' });
    }

    // Upsert — update if exists, insert if not
    const review = await Review.findOneAndUpdate(
      { userEmail, movieId },
      { userEmail, movieId, username, rating, reviewText },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully.', review });
  } catch (err) {
    console.error('[addReview]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/reviews/movie/:movieId
 * Get all reviews for a specific movie, newest first.
 */
const getMovieReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({
      createdAt: -1,
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.json({ success: true, count: reviews.length, avgRating: Number(avgRating), reviews });
  } catch (err) {
    console.error('[getMovieReviews]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/reviews/:movieId
 * Delete the logged-in user's review for a movie.
 */
const deleteReview = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { movieId } = req.params;

    const result = await Review.findOneAndDelete({ userEmail, movieId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (err) {
    console.error('[deleteReview]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { addReview, getMovieReviews, deleteReview };
