const express = require('express');
const router = express.Router();
const {
  getAllTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const fetchAdmin = require('../middlewares/fetchAdmin');

// GET /api/theatres
router.get('/', getAllTheatres);

// GET /api/theatres/:id
router.get('/:id', getTheatreById);

// POST /api/theatres  (admin only)
router.post('/', fetchAdmin, addTheatre);

// PUT /api/theatres/:id  (admin only)
router.put('/:id', fetchAdmin, updateTheatre);

// DELETE /api/theatres/:id  (admin only)
router.delete('/:id', fetchAdmin, deleteTheatre);

module.exports = router;
