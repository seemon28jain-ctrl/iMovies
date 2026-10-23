/**
 * AddMoviePage.jsx - Admin Movie Registration & Global TMDB Importer
 * Features:
 *  - 1-Click Global TMDB Search & Import for ANY movie worldwide
 *  - Complete manual custom movie creation for independent/local titles
 *  - Real-time poster preview
 *  - Dynamic cast members list
 *  - Immediate catalog availability for shows and user homepage
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faPlus, faTrash, faCheckCircle, faSearch,
  faBolt, faImage, faClock, faGlobe, faStar, faCalendarAlt,
  faLayerGroup, faVideo, faTimes
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';

const POPULAR_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller'
];

const POPULAR_LANGUAGES = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Spanish', 'French', 'Korean', 'Japanese'
];

const AddMoviePage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Custom genre input state
  const [customGenre, setCustomGenre] = useState('');

  // Form State
  const [form, setForm] = useState({
    movieName: '',
    description: '',
    genres: ['Action'],
    releaseDate: new Date().toISOString().split('T')[0],
    language: 'English',
    duration: '135 min',
    certification: 'U/A',
    posterUrl: '',
    trailerUrl: '',
    avgRating: 4.5,
    tmdbId: null,
  });

  const [cast, setCast] = useState([
    { name: '', role: '' }
  ]);

  // Handle global search for ANY movie worldwide
  const handleGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.info('Please enter a movie title to search globally.');
      return;
    }

    try {
      setSearching(true);
      setHasSearched(true);
      const res = await api.get(`/movie/search-global?q=${encodeURIComponent(searchQuery.trim())}`);
      const found = res.data.movies || [];
      setSearchResults(found);
      if (found.length === 0) {
        toast.info('No global titles found. You can enter movie details manually below.');
      }
    } catch (err) {
      console.error('Global search failed', err);
      toast.error('Search failed. Please enter details manually below.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Auto-fill form from selected global search result
  const handleSelectGlobalMovie = (m) => {
    const formattedRelease = m.releaseDate
      ? new Date(m.releaseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const formattedCast = Array.isArray(m.cast) && m.cast.length > 0
      ? m.cast.slice(0, 5).map((c) => ({
          name: typeof c === 'string' ? c : (c.name || ''),
          role: typeof c === 'string' ? 'Lead' : (c.role || 'Actor')
        }))
      : [{ name: '', role: '' }];

    setForm({
      movieName: m.movieName || '',
      description: m.description || '',
      genres: Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : ['Action'],
      releaseDate: formattedRelease,
      language: m.language || 'English',
      duration: m.duration || '120 min',
      certification: m.certification || 'U/A',
      posterUrl: m.posterUrl || '',
      trailerUrl: m.trailerUrl || '',
      avgRating: m.avgRating || 4.5,
      tmdbId: m.tmdbId || null,
    });

    setCast(formattedCast);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
    toast.success(`Imported details for "${m.movieName}"! Review and save below.`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGenre = (genre) => {
    setForm((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  };

  const handleAddCustomGenre = () => {
    if (!customGenre.trim()) return;
    const g = customGenre.trim();
    if (!form.genres.includes(g)) {
      setForm((prev) => ({ ...prev, genres: [...prev.genres, g] }));
    }
    setCustomGenre('');
  };

  const handleCastChange = (index, field, value) => {
    setCast((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addCastMember = () => {
    setCast((prev) => [...prev, { name: '', role: '' }]);
  };

  const removeCastMember = (index) => {
    setCast((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.movieName || form.movieName.trim().length < 2) {
      toast.error('Movie title is required (minimum 2 characters).');
      return;
    }
    if (!form.description || form.description.trim().length < 10) {
      toast.error('Synopsis / description must be at least 10 characters long.');
      return;
    }
    if (form.genres.length === 0) {
      toast.error('Please select or add at least one genre.');
      return;
    }

    const filteredCast = cast.filter((c) => c.name && c.name.trim() !== '');

    try {
      setSubmitting(true);
      const res = await api.post('/movie', {
        ...form,
        cast: filteredCast,
      });

      if (res.data.success) {
        toast.success(`Movie "${form.movieName}" registered successfully!`);
        // Navigate directly to schedule shows or catalog
        navigate('/addshow');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add movie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
          <div>
            <h2 className="text-white fw-bold mb-1">
              <FontAwesomeIcon icon={faFilm} className="text-danger me-2" />
              Add Any Movie to Catalog
            </h2>
            <p className="text-secondary small mb-0">
              Search any title globally for 1-click import, or enter custom independent movie details
            </p>
          </div>
        </div>

        {/* Global Movie Search & 1-Click Import Bar */}
        <div
          className="card border-0 mb-4 p-4 rounded-4"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 10, 107, 0.45) 0%, rgba(10, 4, 20, 0.9) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge bg-info text-dark font-monospace fw-bold">
              <FontAwesomeIcon icon={faBolt} className="me-1" /> FAST IMPORT
            </span>
            <h5 className="text-white fw-bold mb-0">Search Any Movie Worldwide</h5>
          </div>
          <p className="text-secondary small mb-3">
            Search from millions of titles (e.g. <em>Inception, Oppenheimer, Avatar, Pushpa, Dune, Interstellar</em>) to auto-fill posters, cast, synopsis, and runtime instantly.
          </p>

          <form onSubmit={handleGlobalSearch} className="input-group">
            <span className="input-group-text bg-black text-secondary border-secondary border-opacity-50">
              <FontAwesomeIcon icon={faSearch} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type any movie title to search globally..."
              className="form-control bg-black text-white border-secondary border-opacity-50"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="btn btn-cyan fw-bold px-4"
            >
              {searching ? 'Searching...' : 'Search Movies'}
            </button>
          </form>

          {/* Search Results Dropdown Cards */}
          {searchResults.length > 0 && (
            <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-info fw-bold">
                  Found {searchResults.length} Global Movies (Click any to auto-fill form):
                </span>
                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  className="btn btn-sm btn-link text-secondary text-decoration-none"
                >
                  <FontAwesomeIcon icon={faTimes} className="me-1" /> Dismiss
                </button>
              </div>

              <div className="row g-3" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {searchResults.map((m) => (
                  <div key={m.tmdbId} className="col-md-6 col-lg-4">
                    <div
                      onClick={() => handleSelectGlobalMovie(m)}
                      className="p-2 rounded-3 d-flex gap-3 align-items-center h-100"
                      style={{
                        background: 'rgba(25, 9, 45, 0.7)',
                        border: '1px solid rgba(0, 229, 255, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00E5FF';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.2)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {m.posterUrl ? (
                        <img
                          src={m.posterUrl}
                          alt=""
                          style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div
                          className="bg-black text-secondary d-flex align-items-center justify-content-center rounded"
                          style={{ width: '45px', height: '65px', fontSize: '0.7rem' }}
                        >
                          No Poster
                        </div>
                      )}
                      <div className="overflow-hidden flex-grow-1">
                        <div className="text-white fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>
                          {m.movieName}
                        </div>
                        <div className="small text-secondary">
                          {m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'N/A'} • {m.language || 'English'}
                        </div>
                        <span className="badge bg-warning bg-opacity-20 text-warning font-monospace small" style={{ fontSize: '0.7rem' }}>
                          ★ {m.avgRating ? Number(m.avgRating).toFixed(1) : '4.5'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-cyan rounded-pill px-2"
                        style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Movie Creation Form */}
        <div className="row justify-content-center">
          <div className="col-lg-11">
            <form onSubmit={handleSubmit} className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow p-4">
              <div className="row g-4">
                {/* Left Column: Form Fields */}
                <div className="col-lg-8">
                  {/* General Info */}
                  <h5 className="text-danger fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                    1. General Information
                  </h5>

                  <div className="row g-3 mb-4">
                    <div className="col-md-8">
                      <label className="form-label small text-secondary">Movie Title *</label>
                      <input
                        type="text"
                        name="movieName"
                        value={form.movieName}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        placeholder="e.g. Inception"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small text-secondary">Certification</label>
                      <select
                        name="certification"
                        value={form.certification}
                        onChange={handleInputChange}
                        className="form-select bg-black text-white border-secondary border-opacity-50"
                      >
                        <option value="U">U (Universal)</option>
                        <option value="U/A">U/A (Parental Guidance)</option>
                        <option value="A">A (Adults Only)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small text-secondary">Synopsis / Description *</label>
                      <textarea
                        name="description"
                        rows="3"
                        value={form.description}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        placeholder="Enter brief synopsis of the film..."
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small text-secondary">Release Date *</label>
                      <input
                        type="date"
                        name="releaseDate"
                        value={form.releaseDate}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small text-secondary">Primary Language *</label>
                      <input
                        type="text"
                        name="language"
                        value={form.language}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        placeholder="e.g. English, Hindi"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small text-secondary">Duration *</label>
                      <input
                        type="text"
                        name="duration"
                        value={form.duration}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        placeholder="e.g. 148 min"
                        required
                      />
                    </div>
                  </div>

                  {/* Genres Selection & Custom Genre Input */}
                  <h5 className="text-danger fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                    2. Genres & Categories *
                  </h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {POPULAR_GENRES.map((g) => {
                      const selected = form.genres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenre(g)}
                          className={`btn btn-sm ${
                            selected ? 'btn-danger' : 'btn-outline-secondary text-white'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Genre Input */}
                  <div className="input-group mb-4" style={{ maxWidth: '380px' }}>
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder="Add custom genre (e.g. Anime, Noir)..."
                      className="form-control form-control-sm bg-black text-white border-secondary border-opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomGenre}
                      className="btn btn-sm btn-outline-info"
                    >
                      + Add Genre
                    </button>
                  </div>

                  {/* Media Links */}
                  <h5 className="text-danger fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                    3. Poster & Trailer Links
                  </h5>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label small text-secondary">Poster Image URL</label>
                      <input
                        type="url"
                        name="posterUrl"
                        value={form.posterUrl}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        placeholder="https://image.tmdb.org/t/p/w500/... or any image link"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small text-secondary">Trailer URL (Optional)</label>
                      <input
                        type="url"
                        name="trailerUrl"
                        value={form.trailerUrl}
                        onChange={handleInputChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  </div>

                  {/* Cast Members */}
                  <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                    <h5 className="text-danger fw-bold mb-0">4. Key Cast Members</h5>
                    <button
                      type="button"
                      onClick={addCastMember}
                      className="btn btn-outline-info btn-sm"
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Cast
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-4">
                    {cast.map((c, index) => (
                      <div key={index} className="row g-2 align-items-center">
                        <div className="col-5">
                          <input
                            type="text"
                            placeholder="Actor / Actress Name"
                            value={c.name}
                            onChange={(e) => handleCastChange(index, 'name', e.target.value)}
                            className="form-control form-control-sm bg-black text-white border-secondary border-opacity-50"
                          />
                        </div>
                        <div className="col-5">
                          <input
                            type="text"
                            placeholder="Character Role"
                            value={c.role}
                            onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                            className="form-control form-control-sm bg-black text-white border-secondary border-opacity-50"
                          />
                        </div>
                        <div className="col-2 text-end">
                          {cast.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCastMember(index)}
                              className="btn btn-outline-danger btn-sm"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Live Poster & Catalog Card Preview */}
                <div className="col-lg-4">
                  <div
                    className="p-3 rounded-4 sticky-top"
                    style={{
                      top: '1rem',
                      background: 'rgba(15, 6, 28, 0.85)',
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                    }}
                  >
                    <h6 className="text-info fw-bold mb-3 d-flex align-items-center gap-2">
                      <FontAwesomeIcon icon={faImage} /> Live Poster Preview
                    </h6>

                    <div
                      className="rounded-3 overflow-hidden d-flex align-items-center justify-content-center mb-3 bg-black"
                      style={{
                        height: '320px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {form.posterUrl ? (
                        <img
                          src={form.posterUrl}
                          alt={form.movieName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center text-secondary p-3">
                          <FontAwesomeIcon icon={faFilm} className="fa-3x mb-2 opacity-50" />
                          <p className="small mb-0">Enter a Poster Image URL or use Global Search to see preview</p>
                        </div>
                      )}
                    </div>

                    <div className="fw-bold text-white fs-5 text-truncate mb-1">
                      {form.movieName || 'Movie Title'}
                    </div>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {form.genres.map((g, i) => (
                        <span key={i} className="badge bg-secondary bg-opacity-25 text-info font-monospace small">
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="small text-secondary font-monospace">
                      {form.language} • {form.duration} • {form.certification}
                    </div>

                    <div className="alert alert-info bg-info bg-opacity-10 border-info border-opacity-25 small mt-3 mb-0">
                      💡 <strong>Next Step:</strong> Once published, this movie immediately appears on the user homepage and you can schedule shows for it at any theatre!
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA Buttons */}
              <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top border-secondary border-opacity-25">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn btn-outline-secondary text-white px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-danger px-4 fw-semibold text-white d-flex align-items-center gap-2"
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {submitting ? 'Registering Movie...' : 'Save & Publish Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMoviePage;
