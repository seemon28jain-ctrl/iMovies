/**
 * tmdbService.js - Integration service for The Movie Database (TMDB) API
 * Fetches real-time market movies, search results, and movie details using Axios.
 */
const axios = require('axios');
const https = require('https');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const DEFAULT_API_KEY = '83d2ad5d08d9e712bab2c12f5e58eb30';

// Fallback genre dictionary for instant lookup
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Create Axios client with TLS 1.2 agent and curl User-Agent for 100% TMDB CloudFront stability
const client = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000,
  headers: {
    'User-Agent': 'curl/7.68.0',
    'Accept': 'application/json',
  },
  httpsAgent: new https.Agent({
    minVersion: 'TLSv1.2',
    keepAlive: false,
  }),
});

// Automatic retry interceptor for resilient TLS handshakes under concurrent load
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || (config._retryCount || 0) >= 3) {
      return Promise.reject(error);
    }
    config._retryCount = (config._retryCount || 0) + 1;
    await new Promise((resolve) => setTimeout(resolve, 200 * config._retryCount));
    return client(config);
  }
);

const getApiKey = () => process.env.TMDB_API_KEY || DEFAULT_API_KEY;

/**
 * Format raw TMDB movie into standard iMovies schema
 */
const formatMovie = (m) => {
  // Map genre IDs to names
  let genres = [];
  if (Array.isArray(m.genres) && m.genres.length > 0) {
    genres = m.genres.map((g) => (typeof g === 'object' ? g.name : g));
  } else if (Array.isArray(m.genre_ids) && m.genre_ids.length > 0) {
    genres = m.genre_ids.map((id) => GENRE_MAP[id] || 'Drama').filter(Boolean);
  }
  if (!genres || genres.length === 0) {
    genres = ['Drama'];
  }

  // Format poster URL
  const posterUrl = m.poster_path
    ? `${TMDB_IMAGE_BASE}${m.poster_path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

  // Format cast
  const cast = [];
  if (m.credits && Array.isArray(m.credits.cast)) {
    m.credits.cast.slice(0, 6).forEach((c) => {
      cast.push({ name: c.name, role: c.character || 'Actor' });
    });
  }

  // Find YouTube trailer
  let trailerUrl = '';
  if (m.videos && Array.isArray(m.videos.results)) {
    const trailer = m.videos.results.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (trailer) {
      trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }

  // Language mapping
  const languageNames = {
    en: 'English',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    ja: 'Japanese',
    ko: 'Korean',
    te: 'Telugu',
    ta: 'Tamil',
    de: 'German',
    it: 'Italian',
  };
  const langKey = (m.original_language || 'en').toLowerCase();
  const language = languageNames[langKey] || langKey.toUpperCase();

  // Duration
  const duration = m.runtime ? `${m.runtime} min` : '120 min';

  // Rating (scaled to 5 stars)
  const avgRating = m.vote_average ? Number((m.vote_average / 2).toFixed(1)) : 4.0;

  // Release Date
  const releaseDate = m.release_date ? new Date(m.release_date) : new Date();

  return {
    tmdbId: m.id,
    movieName: m.title || m.original_title || 'Untitled Movie',
    description: m.overview && m.overview.trim().length >= 10
      ? m.overview.trim()
      : 'An exhilarating cinematic experience now showing in theatres worldwide.',
    genres,
    releaseDate,
    language,
    duration,
    certification: m.adult ? 'A' : 'U/A',
    posterUrl,
    trailerUrl,
    cast,
    avgRating,
    isActive: true,
  };
};

/**
 * Fetch Now Playing movies from TMDB
 */
const getNowPlayingMovies = async (page = 1) => {
  try {
    const res = await client.get('/movie/now_playing', {
      params: {
        api_key: getApiKey(),
        page,
      },
    });

    const movies = (res.data.results || []).map(formatMovie);
    return {
      success: true,
      count: movies.length,
      page: res.data.page,
      totalPages: res.data.total_pages,
      movies,
    };
  } catch (err) {
    console.error('[tmdbService:getNowPlayingMovies]', err.message);
    throw err;
  }
};

/**
 * Fetch Popular movies from TMDB
 */
const getPopularMovies = async (page = 1) => {
  try {
    const res = await client.get('/movie/popular', {
      params: {
        api_key: getApiKey(),
        page,
      },
    });

    const movies = (res.data.results || []).map(formatMovie);
    return {
      success: true,
      count: movies.length,
      page: res.data.page,
      totalPages: res.data.total_pages,
      movies,
    };
  } catch (err) {
    console.error('[tmdbService:getPopularMovies]', err.message);
    throw err;
  }
};

/**
 * Search movies by keyword on TMDB
 */
const searchMovies = async (query, page = 1) => {
  try {
    if (!query || !query.trim()) {
      return getNowPlayingMovies(page);
    }

    const res = await client.get('/search/movie', {
      params: {
        api_key: getApiKey(),
        query: query.trim(),
        page,
      },
    });

    const movies = (res.data.results || []).map(formatMovie);
    return {
      success: true,
      count: movies.length,
      page: res.data.page,
      totalPages: res.data.total_pages,
      movies,
    };
  } catch (err) {
    console.error('[tmdbService:searchMovies]', err.message);
    throw err;
  }
};

/**
 * Fetch Top Trending movies from TMDB (for Top 10 section)
 */
const getTrendingMovies = async (timeWindow = 'day') => {
  try {
    const res = await client.get(`/trending/movie/${timeWindow}`, {
      params: {
        api_key: getApiKey(),
      },
    });

    const movies = (res.data.results || []).map(formatMovie);
    return {
      success: true,
      count: movies.length,
      movies: movies.slice(0, 10), // Guaranteed Top 10
    };
  } catch (err) {
    console.error('[tmdbService:getTrendingMovies]', err.message);
    throw err;
  }
};

/**
 * Fetch Top Rated movies from TMDB
 */
const getTopRatedMovies = async (page = 1) => {
  try {
    const res = await client.get('/movie/top_rated', {
      params: {
        api_key: getApiKey(),
        page,
      },
    });

    const movies = (res.data.results || []).map(formatMovie);
    return {
      success: true,
      count: movies.length,
      movies,
    };
  } catch (err) {
    console.error('[tmdbService:getTopRatedMovies]', err.message);
    throw err;
  }
};

/**
 * Fetch Upcoming movies from TMDB
 */
const getUpcomingMovies = async (page = 1) => {
  try {
    const res = await client.get('/movie/upcoming', {
      params: {
        api_key: getApiKey(),
        page,
      },
    });

    const movies = (res.data.results || []).map(formatMovie);
    return {
      success: true,
      count: movies.length,
      movies,
    };
  } catch (err) {
    console.error('[tmdbService:getUpcomingMovies]', err.message);
    throw err;
  }
};

/**
 * Fetch comprehensive single movie details from TMDB
 */
const getMovieDetails = async (tmdbId) => {
  try {
    const res = await client.get(`/movie/${tmdbId}`, {
      params: {
        api_key: getApiKey(),
        append_to_response: 'credits,videos,release_dates',
      },
    });

    const formatted = formatMovie(res.data);
    return formatted;
  } catch (err) {
    console.error(`[tmdbService:getMovieDetails] for ID ${tmdbId}:`, err.message);
    throw err;
  }
};

module.exports = {
  getNowPlayingMovies,
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  formatMovie,
};
