const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getCuratedSections,
  getMovieById,
  searchGlobalMovies,
  addMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const fetchAdmin = require('../middlewares/fetchAdmin');

// GET /api/movies?genre=&language=&search=&section=
router.get('/', getAllMovies);

// GET /api/movies/curated-sections (Top 10, Now Playing, Top Rated, Upcoming)
router.get('/curated-sections', getCuratedSections);

// GET /api/movies/search-global?q= (Search any movie globally on TMDB)
router.get('/search-global', searchGlobalMovies);

// GET /api/movies/:id
router.get('/:id', getMovieById);

// POST /api/movies  (admin only)
router.post('/', fetchAdmin, addMovie);

// PUT /api/movies/:id  (admin only)
router.put('/:id', fetchAdmin, updateMovie);

// DELETE /api/movies/:id  (admin only — soft delete)
router.delete('/:id', fetchAdmin, deleteMovie);

module.exports = router;
