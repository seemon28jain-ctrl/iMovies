const express = require('express');
const router = express.Router();
const {
  addReview,
  getMovieReviews,
  deleteReview,
} = require('../controllers/reviewController');
const fetchUser = require('../middlewares/fetchUser');

// POST /api/reviews  (submit / update review)
router.post('/', fetchUser, addReview);

// GET /api/reviews/movie/:movieId  (public — get reviews for a movie)
// IMPORTANT: must come before /:movieId delete to avoid Express param collision
router.get('/movie/:movieId', getMovieReviews);

// DELETE /api/reviews/:movieId  (delete own review)
router.delete('/:movieId', fetchUser, deleteReview);

module.exports = router;
