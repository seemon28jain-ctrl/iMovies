const mongoose = require('mongoose');
const Movie = require('../models/movieModel');
const Show = require('../models/showModel');
const tmdbService = require('../services/tmdbService');
const { ensureShowsForMovie } = require('../utils/showHelper');

/**
 * GET /api/movies (or /api/movie)
 * Fetches real-time market movies dynamically from TMDB.
 * Supports ?search=, ?genre=, and ?language= query params.
 * Automatically synchronises live TMDB titles into MongoDB.
 */
const getAllMovies = async (req, res) => {
  try {
    const { genre, language, search, section, dbOnly, all } = req.query;

    // Filter criteria for local DB
    const localFilter = { isActive: true };
    if (search && search.trim()) localFilter.movieName = new RegExp(search.trim(), 'i');
    if (genre && genre !== 'All') localFilter.genres = { $in: [new RegExp(genre, 'i')] };
    if (language && language !== 'All') localFilter.language = new RegExp(language, 'i');

    const localMovies = await Movie.find(localFilter).sort({ createdAt: -1, releaseDate: -1 });

    // Direct database fetch for admin management or local queries
    if (dbOnly === 'true' || all === 'true') {
      return res.json({
        success: true,
        source: 'database',
        count: localMovies.length,
        movies: localMovies,
      });
    }

    let tmdbResult = null;
    try {
      if (search && search.trim()) {
        tmdbResult = await tmdbService.searchMovies(search.trim());
      } else if (section === 'top10' || section === 'trending') {
        tmdbResult = await tmdbService.getTrendingMovies();
      } else if (section === 'top_rated') {
        tmdbResult = await tmdbService.getTopRatedMovies();
      } else if (section === 'upcoming') {
        tmdbResult = await tmdbService.getUpcomingMovies();
      } else if (section === 'popular') {
        tmdbResult = await tmdbService.getPopularMovies();
      } else {
        tmdbResult = await tmdbService.getNowPlayingMovies();
      }
    } catch (tmdbErr) {
      console.warn('[getAllMovies] Live TMDB fetch failed, using local database:', tmdbErr.message);
    }

    let movies = [...localMovies];

    if (tmdbResult && Array.isArray(tmdbResult.movies) && tmdbResult.movies.length > 0) {
      // Upsert / sync TMDB movies into MongoDB so they get official ObjectIds for bookings & reviews
      const syncedMovies = await syncMoviesToDb(tmdbResult.movies);

      // Avoid duplicating movies already in local database
      const localIds = new Set(localMovies.map((m) => m._id.toString()));
      const localTmdbIds = new Set(localMovies.filter((m) => m.tmdbId).map((m) => String(m.tmdbId)));

      const filteredSynced = syncedMovies.filter((m) => {
        if (!m || !m.isActive) return false;
        if (localIds.has(m._id?.toString())) return false;
        if (m.tmdbId && localTmdbIds.has(String(m.tmdbId))) return false;
        if (genre && genre !== 'All') {
          const lowerGenre = genre.toLowerCase();
          if (!Array.isArray(m.genres) || !m.genres.some((g) => g.toLowerCase().includes(lowerGenre))) {
            return false;
          }
        }
        if (language && language !== 'All') {
          const lowerLang = language.toLowerCase();
          if (!m.language || !m.language.toLowerCase().includes(lowerLang)) {
            return false;
          }
        }
        return true;
      });

      // Local database movies (including newly added ones) ALWAYS come first!
      movies = [...localMovies, ...filteredSynced];
    }

    res.json({
      success: true,
      source: 'merged_catalog',
      count: movies.length,
      movies,
    });
  } catch (err) {
    console.error('[getAllMovies]', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching movies.' });
  }
};

/**
 * Helper to sync a list of formatted TMDB movies into MongoDB
 */
const syncMoviesToDb = async (movieList = []) => {
  if (!Array.isArray(movieList) || movieList.length === 0) return [];
  return Promise.all(
    movieList.map(async (m) => {
      try {
        const doc = await Movie.findOneAndUpdate(
          { tmdbId: m.tmdbId },
          {
            $set: {
              movieName: m.movieName,
              description: m.description,
              genres: m.genres,
              releaseDate: m.releaseDate,
              language: m.language,
              duration: m.duration,
              certification: m.certification,
              posterUrl: m.posterUrl,
              avgRating: m.avgRating,
              isActive: true,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return doc;
      } catch (e) {
        return m;
      }
    })
  );
};

/**
 * GET /api/movies/curated-sections
 * Returns grouped movie lists: Top 10, Now Playing, Top Rated, and Upcoming.
 * Prepend all local database movies so newly added movies are directly visible on the user home page.
 */
const getCuratedSections = async (req, res) => {
  try {
    const [trendingRes, nowPlayingRes, topRatedRes, upcomingRes] = await Promise.allSettled([
      tmdbService.getTrendingMovies('day'),
      tmdbService.getNowPlayingMovies(),
      tmdbService.getTopRatedMovies(),
      tmdbService.getUpcomingMovies(),
    ]);

    const top10Raw = trendingRes.status === 'fulfilled' ? trendingRes.value.movies.slice(0, 10) : [];
    const nowPlayingRaw = nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value.movies : [];
    const topRatedRaw = topRatedRes.status === 'fulfilled' ? topRatedRes.value.movies.slice(0, 12) : [];
    const upcomingRaw = upcomingRes.status === 'fulfilled' ? upcomingRes.value.movies.slice(0, 12) : [];

    const [top10, nowPlaying, topRated, upcoming] = await Promise.all([
      syncMoviesToDb(top10Raw),
      syncMoviesToDb(nowPlayingRaw),
      syncMoviesToDb(topRatedRaw),
      syncMoviesToDb(upcomingRaw),
    ]);

    // Fetch all active local database movies (newest created at top)
    const localMovies = await Movie.find({ isActive: true }).sort({ createdAt: -1 });

    const localIds = new Set(localMovies.map((m) => m._id.toString()));
    const localTmdbIds = new Set(localMovies.filter((m) => m.tmdbId).map((m) => String(m.tmdbId)));

    // Prepend local movies into Now Playing so newly added movies appear FIRST on user home page!
    const distinctNowPlaying = nowPlaying.filter(
      (m) => !localIds.has(m._id?.toString()) && (!m.tmdbId || !localTmdbIds.has(String(m.tmdbId)))
    );
    const combinedNowPlaying = [...localMovies, ...distinctNowPlaying];

    // Include local movies in top 10 section
    const distinctTop10 = top10.filter(
      (m) => !localIds.has(m._id?.toString()) && (!m.tmdbId || !localTmdbIds.has(String(m.tmdbId)))
    );
    const combinedTop10 = [...localMovies.slice(0, 3), ...distinctTop10].slice(0, 10);

    res.json({
      success: true,
      sections: {
        nowPlaying: combinedNowPlaying,
        top10: combinedTop10,
        topRated: topRated.length > 0 ? topRated : localMovies.slice(0, 12),
        upcoming: upcoming.length > 0 ? upcoming : localMovies.slice(0, 12),
        newlyAdded: localMovies.slice(0, 10),
      },
    });
  } catch (err) {
    console.error('[getCuratedSections]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch curated movie sections.' });
  }
};

/**
 * GET /api/movies/search-global?q=...
 * Search ANY movie worldwide across TMDB database so admin can 1-click import.
 */
const searchGlobalMovies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, count: 0, movies: [] });
    }
    const result = await tmdbService.searchMovies(q.trim());
    res.json({ success: true, count: result.movies.length, movies: result.movies });
  } catch (err) {
    console.error('[searchGlobalMovies]', err.message);
    res.status(500).json({ success: false, message: 'Global movie search failed.' });
  }
};

/**
 * GET /api/movies/:id (or /api/movie/:id)
 * Fetches a single movie by its MongoDB _id or TMDB ID.
 * Enriches details dynamically via TMDB API when available.
 */
const getMovieById = async (req, res) => {
  try {
    const id = req.params.id;
    let movie = null;

    // Check if ID is a valid MongoDB ObjectId
    if (mongoose.isValidObjectId(id)) {
      movie = await Movie.findById(id);
    }

    // Check if ID is a TMDB numeric ID
    if (!movie && !isNaN(Number(id))) {
      movie = await Movie.findOne({ tmdbId: Number(id) });
    }

    // If not found in DB or missing rich cast/trailer, fetch directly from TMDB
    if (!movie || (!movie.cast?.length && movie.tmdbId)) {
      const tmdbIdToQuery = movie?.tmdbId || (!isNaN(Number(id)) ? Number(id) : null);
      if (tmdbIdToQuery) {
        try {
          const tmdbDetails = await tmdbService.getMovieDetails(tmdbIdToQuery);
          if (tmdbDetails) {
            movie = await Movie.findOneAndUpdate(
              { tmdbId: tmdbIdToQuery },
              {
                $set: {
                  movieName: tmdbDetails.movieName,
                  description: tmdbDetails.description,
                  genres: tmdbDetails.genres,
                  releaseDate: tmdbDetails.releaseDate,
                  language: tmdbDetails.language,
                  duration: tmdbDetails.duration,
                  certification: tmdbDetails.certification,
                  posterUrl: tmdbDetails.posterUrl,
                  trailerUrl: tmdbDetails.trailerUrl,
                  cast: tmdbDetails.cast,
                  avgRating: tmdbDetails.avgRating,
                  isActive: true,
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        } catch (tmdbErr) {
          console.warn('[getMovieById] Failed to fetch TMDB details:', tmdbErr.message);
        }
      }
    }

    if (!movie || !movie.isActive) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    res.json({ success: true, movie });
  } catch (err) {
    console.error('[getMovieById]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/movies
 * Admin only — create or register any movie (manual or TMDB imported).
 */
const addMovie = async (req, res) => {
  try {
    const {
      movieName,
      description,
      genres,
      releaseDate,
      language,
      duration,
      certification,
      posterUrl,
      trailerUrl,
      cast,
      tmdbId,
      avgRating,
    } = req.body;

    if (!movieName || !description) {
      return res
        .status(400)
        .json({ success: false, message: 'Movie name and description are required.' });
    }

    const movieGenres = Array.isArray(genres) && genres.length > 0 ? genres : ['Drama'];
    const movieRelease = releaseDate ? new Date(releaseDate) : new Date();
    const movieDuration = duration
      ? String(duration).includes('min') ? String(duration) : `${duration} min`
      : '120 min';

    // Check if movie already exists by tmdbId or name to update or re-activate
    let movie = null;
    if (tmdbId) {
      movie = await Movie.findOne({ tmdbId });
    }
    if (!movie) {
      movie = await Movie.findOne({ movieName: new RegExp(`^${movieName.trim()}$`, 'i') });
    }

    if (movie) {
      movie.movieName = movieName.trim();
      movie.description = description.trim();
      movie.genres = movieGenres;
      movie.releaseDate = movieRelease;
      movie.language = language || movie.language || 'English';
      movie.duration = movieDuration;
      movie.certification = certification || movie.certification || 'U/A';
      if (posterUrl) movie.posterUrl = posterUrl;
      if (trailerUrl) movie.trailerUrl = trailerUrl;
      if (cast && cast.length) movie.cast = cast;
      if (avgRating) movie.avgRating = avgRating;
      movie.isActive = true;
      await movie.save();
      // Ensure shows are scheduled across theatres for this movie
      ensureShowsForMovie(movie).catch(err => console.warn('[addMovie] ensureShows error:', err.message));

      return res.status(200).json({
        success: true,
        message: `Movie "${movie.movieName}" saved to catalog.`,
        movie,
      });
    }

    movie = new Movie({
      movieName: movieName.trim(),
      description: description.trim(),
      genres: movieGenres,
      releaseDate: movieRelease,
      language: language || 'English',
      duration: movieDuration,
      certification: certification || 'U/A',
      posterUrl: posterUrl || '',
      trailerUrl: trailerUrl || '',
      cast: Array.isArray(cast) ? cast : [],
      avgRating: avgRating || 4.5,
      tmdbId: tmdbId || undefined,
      isActive: true,
    });

    await movie.save();
    // Auto-schedule shows across theatres for the newly added movie
    ensureShowsForMovie(movie).catch(err => console.warn('[addMovie] ensureShows error:', err.message));
    res.status(201).json({
      success: true,
      message: `Movie "${movie.movieName}" added successfully.`,
      movie,
    });
  } catch (err) {
    console.error('[addMovie]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

/**
 * PUT /api/movies/:id
 * Admin only — update an existing movie.
 */
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    res.json({ success: true, message: 'Movie updated successfully.', movie });
  } catch (err) {
    console.error('[updateMovie]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/movies/:id
 * Admin only — permanently delete a movie and its scheduled shows.
 */
const deleteMovie = async (req, res) => {
  try {
    const id = req.params.id;
    let movie = null;
    if (mongoose.isValidObjectId(id)) {
      movie = await Movie.findByIdAndDelete(id);
    } else if (!isNaN(Number(id))) {
      movie = await Movie.findOneAndDelete({ tmdbId: Number(id) });
    } else {
      movie = await Movie.findByIdAndDelete(id);
    }

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    // Clean up all scheduled shows associated with this movie
    await Show.deleteMany({
      $or: [
        { movieId: movie._id.toString() },
        ...(movie.tmdbId ? [{ movieId: String(movie.tmdbId) }] : []),
      ],
    });

    res.json({
      success: true,
      message: `Movie "${movie.movieName}" and its shows deleted successfully.`,
    });
  } catch (err) {
    console.error('[deleteMovie]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllMovies,
  getCuratedSections,
  getMovieById,
  searchGlobalMovies,
  addMovie,
  updateMovie,
  deleteMovie,
};
