const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getUserFavorites,
} = require('../controllers/favoriteController');
const fetchUser = require('../middlewares/fetchUser');

// POST /api/favorites  (add movie to watchlist)
router.post('/', fetchUser, addFavorite);

// DELETE /api/favorites/:movieId  (remove from watchlist)
router.delete('/:movieId', fetchUser, removeFavorite);

// GET /api/favorites  (get user's watchlist with full movie details)
router.get('/', fetchUser, getUserFavorites);

module.exports = router;
