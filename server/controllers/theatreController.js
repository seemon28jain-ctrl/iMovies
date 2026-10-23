const mongoose = require('mongoose');
const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');
const { scheduleShowsForNewTheatre } = require('../utils/showHelper');

/**
 * GET /api/theatres
 * Fetch all theatres (active).
 */
const getAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find({ isActive: true }).sort({ theatreName: 1 });
    res.json({ success: true, count: theatres.length, theatres });
  } catch (err) {
    console.error('[getAllTheatres]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/theatres/:id
 * Fetch a single theatre by MongoDB _id.
 */
const getTheatreById = async (req, res) => {
  try {
    const id = req.params.id;
    let theatre = null;
    if (mongoose.isValidObjectId(id)) {
      theatre = await Theatre.findOne({ $or: [{ _id: id }, { theatreId: id }] });
    } else {
      theatre = await Theatre.findOne({ theatreId: id });
    }
    if (!theatre || !theatre.isActive) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }
    res.json({ success: true, theatre });
  } catch (err) {
    console.error('[getTheatreById]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/theatres
 * Admin only — add a new theatre with seat configuration.
 */
const addTheatre = async (req, res) => {
  try {
    let {
      theatreName,
      theatreId,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
    } = req.body;

    if (
      !theatreName ||
      !location ||
      balconySeatPrice === undefined ||
      middleSeatPrice === undefined ||
      lowerSeatPrice === undefined ||
      !balconySeats ||
      !middleSeats ||
      !lowerSeats
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'All theatre fields and seating layouts are required.' });
    }

    // Auto-generate theatreId if not provided
    if (!theatreId || !theatreId.trim()) {
      const baseSlug = theatreName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'theatre';
      theatreId = `${baseSlug}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
    } else {
      theatreId = theatreId.trim();
      const existing = await Theatre.findOne({ theatreId });
      if (existing) {
        theatreId = `${theatreId}-${Math.floor(Math.random() * 900 + 100)}`;
      }
    }

    const theatre = new Theatre({
      theatreName,
      theatreId,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
    });

    await theatre.save();
    // Auto-schedule shows in the newly created theatre across active movies
    scheduleShowsForNewTheatre(theatre).catch(err => console.warn('[addTheatre] scheduleShows error:', err.message));
    res.status(201).json({ success: true, message: 'Theatre added successfully.', theatre });
  } catch (err) {
    console.error('[addTheatre]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PUT /api/theatres/:id
 * Admin only — update theatre details.
 */
const updateTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    res.json({ success: true, message: 'Theatre updated successfully.', theatre });
  } catch (err) {
    console.error('[updateTheatre]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/theatres/:id
 * Admin only — permanently delete theatre and clear associated shows.
 */
const deleteTheatre = async (req, res) => {
  try {
    const id = req.params.id;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { theatreId: id };
    const theatre = await Theatre.findOneAndDelete(query);

    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    // Clean up any shows scheduled for this theatre
    await Show.deleteMany({ theatreId: theatre.theatreId });

    res.json({
      success: true,
      message: `Theatre "${theatre.theatreName}" and its scheduled shows were deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteTheatre]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre,
};
