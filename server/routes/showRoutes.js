const express = require('express');
const router = express.Router();
const {
  getAllShows,
  getShowsByMovie,
  getShowById,
  addShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const fetchAdmin = require('../middlewares/fetchAdmin');

// GET /api/shows?movieId=
router.get('/', getAllShows);

// GET /api/shows/movie/:movieId  — MUST come before /:id to avoid param collision
router.get('/movie/:movieId', getShowsByMovie);

// GET /api/shows/:id
router.get('/:id', getShowById);

// POST /api/shows  (admin only)
router.post('/', fetchAdmin, addShow);

// PUT /api/shows/:id  (admin only)
router.put('/:id', fetchAdmin, updateShow);

// DELETE /api/shows/:id  (admin only)
router.delete('/:id', fetchAdmin, deleteShow);

module.exports = router;
