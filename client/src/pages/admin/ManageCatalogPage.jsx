/**
 * ManageCatalogPage.jsx - Unified Admin Catalog Management Center
 * View and delete Movies, Theatres, and Shows with real-time search,
 * responsive data tables, confirmation modals, and toast alerts.
 */
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faBuilding, faCalendarAlt, faTrash, faSearch,
  faPlus, faExclamationTriangle, faSyncAlt, faClock,
  faMapMarkerAlt, faTag, faCouch, faTicketAlt, faStar
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import Loader from '../../components/Loader';
import api from '../../utils/api';

const ManageCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab: 'movies' | 'theatres' | 'shows'
  const activeTab = searchParams.get('tab') || 'movies';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Datasets
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);

  // Deletion modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'movie' | 'theatre' | 'show'
    item: null,
    isDeleting: false,
  });

  const setTab = (tab) => {
    setSearchParams({ tab });
    setSearchQuery('');
  };

  // Fetch all catalog data
  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [moviesRes, theatresRes, showsRes] = await Promise.allSettled([
        api.get('/movie?all=true'),
        api.get('/theatre'),
        api.get('/shows'),
      ]);

      if (moviesRes.status === 'fulfilled' && moviesRes.value.data.success) {
        setMovies(moviesRes.value.data.movies || []);
      }
      if (theatresRes.status === 'fulfilled' && theatresRes.value.data.success) {
        setTheatres(theatresRes.value.data.theatres || []);
      }
      if (showsRes.status === 'fulfilled' && showsRes.value.data.success) {
        setShows(showsRes.value.data.shows || []);
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
      toast.error('Failed to fetch catalog records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered views
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    const q = searchQuery.toLowerCase();
    return movies.filter(
      (m) =>
        m.movieName?.toLowerCase().includes(q) ||
        m.language?.toLowerCase().includes(q) ||
        (Array.isArray(m.genres) && m.genres.some((g) => g.toLowerCase().includes(q)))
    );
  }, [movies, searchQuery]);

  const filteredTheatres = useMemo(() => {
    if (!searchQuery.trim()) return theatres;
    const q = searchQuery.toLowerCase();
    return theatres.filter(
      (t) =>
        t.theatreName?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.theatreId?.toLowerCase().includes(q)
    );
  }, [theatres, searchQuery]);

  const filteredShows = useMemo(() => {
    if (!searchQuery.trim()) return shows;
    const q = searchQuery.toLowerCase();
    return shows.filter(
      (s) =>
        s.movieName?.toLowerCase().includes(q) ||
        s.theatreName?.toLowerCase().includes(q) ||
        s.showDate?.includes(q) ||
        s.showTime?.toLowerCase().includes(q)
    );
  }, [shows, searchQuery]);

  // Open confirmation modal
  const promptDelete = (type, item) => {
    setDeleteModal({
      isOpen: true,
      type,
      item,
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.isDeleting) return;
    setDeleteModal({ isOpen: false, type: null, item: null, isDeleting: false });
  };

  // Perform deletion
  const confirmDelete = async () => {
    const { type, item } = deleteModal;
    if (!item) return;

    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

      if (type === 'movie') {
        const id = item._id || item.tmdbId;
        const res = await api.delete(`/movie/${id}`);
        if (res.data.success) {
          toast.success(res.data.message || 'Movie deleted successfully.');
          setMovies((prev) => prev.filter((m) => m._id !== item._id && m.tmdbId !== item.tmdbId));
          // Clean up shows of this movie in local state
          setShows((prev) => prev.filter((s) => s.movieId !== item._id?.toString() && s.movieId !== String(item.tmdbId)));
        }
      } else if (type === 'theatre') {
        const id = item._id || item.theatreId;
        const res = await api.delete(`/theatre/${id}`);
        if (res.data.success) {
          toast.success(res.data.message || 'Theatre deleted successfully.');
          setTheatres((prev) => prev.filter((t) => t._id !== item._id && t.theatreId !== item.theatreId));
          // Clean up shows of this theatre in local state
          setShows((prev) => prev.filter((s) => s.theatreId !== item.theatreId));
        }
      } else if (type === 'show') {
        const id = item._id || item.showId;
        const res = await api.delete(`/shows/${id}`);
        if (res.data.success) {
          toast.success('Show deleted successfully.');
          setShows((prev) => prev.filter((s) => s._id !== item._id && s.showId !== item.showId));
        }
      }

      closeDeleteModal();
    } catch (err) {
      console.error('Delete error', err);
      toast.error(err.response?.data?.message || 'Failed to delete record.');
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        {/* Page Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25 gap-3">
          <div>
            <h2 className="text-white fw-bold mb-1">
              <FontAwesomeIcon icon={faFilm} className="text-info me-2" />
              Manage Catalog
            </h2>
            <p className="text-secondary small mb-0">
              View, search, and delete movies, theatre venues, and scheduled screenings
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="btn btn-outline-cyan btn-sm d-flex align-items-center gap-2"
              style={{ borderRadius: '10px' }}
            >
              <FontAwesomeIcon icon={faSyncAlt} spin={refreshing} />
              Refresh
            </button>
            {activeTab === 'movies' && (
              <Link to="/addmovie" className="btn btn-cyan btn-sm fw-bold d-flex align-items-center gap-2" style={{ borderRadius: '10px' }}>
                <FontAwesomeIcon icon={faPlus} /> Add Movie
              </Link>
            )}
            {activeTab === 'theatres' && (
              <Link to="/addtheatre" className="btn btn-cyan btn-sm fw-bold d-flex align-items-center gap-2" style={{ borderRadius: '10px' }}>
                <FontAwesomeIcon icon={faPlus} /> Add Theatre
              </Link>
            )}
            {activeTab === 'shows' && (
              <Link to="/addshow" className="btn btn-cyan btn-sm fw-bold d-flex align-items-center gap-2" style={{ borderRadius: '10px' }}>
                <FontAwesomeIcon icon={faPlus} /> Schedule Show
              </Link>
            )}
          </div>
        </div>

        {/* Top Control Bar: Tabs + Search */}
        <div className="row g-3 mb-4 align-items-center">
          {/* Tab Pills */}
          <div className="col-lg-7">
            <div className="d-flex gap-2 p-1 rounded-3" style={{ background: 'rgba(25, 9, 45, 0.7)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <button
                type="button"
                onClick={() => setTab('movies')}
                className={`btn flex-grow-1 py-2 rounded-2 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'movies' ? 'btn-cyan text-dark' : 'text-white btn-link text-decoration-none'
                }`}
                style={{ fontSize: '0.9rem' }}
              >
                <FontAwesomeIcon icon={faFilm} />
                <span>Movies</span>
                <span className="badge bg-black bg-opacity-40 text-info font-monospace ms-1">
                  {movies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab('theatres')}
                className={`btn flex-grow-1 py-2 rounded-2 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'theatres' ? 'btn-cyan text-dark' : 'text-white btn-link text-decoration-none'
                }`}
                style={{ fontSize: '0.9rem' }}
              >
                <FontAwesomeIcon icon={faBuilding} />
                <span>Theatres</span>
                <span className="badge bg-black bg-opacity-40 text-info font-monospace ms-1">
                  {theatres.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab('shows')}
                className={`btn flex-grow-1 py-2 rounded-2 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'shows' ? 'btn-cyan text-dark' : 'text-white btn-link text-decoration-none'
                }`}
                style={{ fontSize: '0.9rem' }}
              >
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>Shows</span>
                <span className="badge bg-black bg-opacity-40 text-info font-monospace ms-1">
                  {shows.length}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-black text-secondary border-secondary border-opacity-50">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'movies'
                    ? 'Search movies by title, genre, language...'
                    : activeTab === 'theatres'
                    ? 'Search theatres by name or city...'
                    : 'Search shows by movie, theatre, date, time...'
                }
                className="form-control bg-black text-white border-secondary border-opacity-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn btn-outline-secondary text-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        {loading ? (
          <Loader />
        ) : (
          <div>
            {/* ══════════════════════════════════════════════════════════════
                TAB 1: MOVIES LIST & DELETION
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'movies' && (
              <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow overflow-hidden">
                <div className="card-header bg-transparent border-secondary border-opacity-25 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-white d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faFilm} className="text-danger" />
                    All Registered Movies ({filteredMovies.length})
                  </h5>
                  <span className="small text-secondary">
                    Deleting a movie automatically removes its future screenings
                  </span>
                </div>

                {filteredMovies.length === 0 ? (
                  <div className="text-center py-5 text-secondary">
                    <FontAwesomeIcon icon={faFilm} className="fa-3x mb-3 text-secondary opacity-50" />
                    <h6>No movies found matching "{searchQuery}"</h6>
                    <p className="small">Try clearing search or register a new movie.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead className="table-dark text-secondary border-secondary border-opacity-25 small text-uppercase">
                        <tr>
                          <th style={{ width: '80px' }}>Poster</th>
                          <th>Movie Details</th>
                          <th>Genres</th>
                          <th>Language & Cert</th>
                          <th>Duration</th>
                          <th>Rating</th>
                          <th className="text-end" style={{ width: '130px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMovies.map((movie) => (
                          <tr key={movie._id || movie.tmdbId} className="border-secondary border-opacity-10">
                            <td>
                              {movie.posterUrl ? (
                                <img
                                  src={movie.posterUrl}
                                  alt={movie.movieName}
                                  style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-black text-secondary rounded"
                                  style={{ width: '50px', height: '70px', fontSize: '0.75rem' }}
                                >
                                  No Poster
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="fw-bold text-white fs-6">{movie.movieName}</div>
                              <div className="small text-secondary font-monospace">
                                Released: {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {(movie.genres || []).map((genre, idx) => (
                                  <span key={idx} className="badge bg-secondary bg-opacity-25 text-info font-monospace small">
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="fw-semibold text-white">{movie.language || 'English'}</div>
                              <span className="badge bg-danger bg-opacity-25 text-danger font-monospace small">
                                {movie.certification || 'U/A'}
                              </span>
                            </td>
                            <td className="text-secondary small font-monospace">
                              <FontAwesomeIcon icon={faClock} className="me-1" />
                              {movie.duration || '2h 15m'}
                            </td>
                            <td>
                              <span className="text-warning fw-bold">
                                <FontAwesomeIcon icon={faStar} className="me-1" />
                                {movie.avgRating ? Number(movie.avgRating).toFixed(1) : '8.5'}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                onClick={() => promptDelete('movie', movie)}
                                className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                title="Delete this movie and its shows"
                              >
                                <FontAwesomeIcon icon={faTrash} className="me-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2: THEATRES LIST & DELETION
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'theatres' && (
              <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow overflow-hidden">
                <div className="card-header bg-transparent border-secondary border-opacity-25 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-white d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faBuilding} className="text-info" />
                    All Registered Theatres ({filteredTheatres.length})
                  </h5>
                  <span className="small text-secondary">
                    Locations and custom seating layouts
                  </span>
                </div>

                {filteredTheatres.length === 0 ? (
                  <div className="text-center py-5 text-secondary">
                    <FontAwesomeIcon icon={faBuilding} className="fa-3x mb-3 text-secondary opacity-50" />
                    <h6>No theatres found matching "{searchQuery}"</h6>
                    <p className="small">Add a new cinema location using the Add Theatre button.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead className="table-dark text-secondary border-secondary border-opacity-25 small text-uppercase">
                        <tr>
                          <th>Theatre Name</th>
                          <th>Location / City</th>
                          <th>Pricing Tiers</th>
                          <th>Total Capacity</th>
                          <th>Theatre ID</th>
                          <th className="text-end" style={{ width: '130px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTheatres.map((theatre) => {
                          const balconyCount = theatre.balconySeats ? Object.keys(theatre.balconySeats).length : 0;
                          const middleCount = theatre.middleSeats ? Object.keys(theatre.middleSeats).length : 0;
                          const lowerCount = theatre.lowerSeats ? Object.keys(theatre.lowerSeats).length : 0;
                          const totalCapacity = balconyCount + middleCount + lowerCount;

                          return (
                            <tr key={theatre._id || theatre.theatreId} className="border-secondary border-opacity-10">
                              <td>
                                <div className="fw-bold text-white fs-6">
                                  <FontAwesomeIcon icon={faBuilding} className="text-info me-2" />
                                  {theatre.theatreName}
                                </div>
                              </td>
                              <td>
                                <span className="text-secondary small">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-1" />
                                  {theatre.location}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-2 flex-wrap">
                                  <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25">
                                    Balcony: ₹{theatre.balconySeatPrice}
                                  </span>
                                  <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-25">
                                    Middle: ₹{theatre.middleSeatPrice}
                                  </span>
                                  <span className="badge bg-secondary bg-opacity-20 text-light border border-secondary border-opacity-25">
                                    Lower: ₹{theatre.lowerSeatPrice}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-purple bg-opacity-25 text-white font-monospace">
                                  <FontAwesomeIcon icon={faCouch} className="me-1 text-info" />
                                  {totalCapacity > 0 ? `${totalCapacity} Seats` : 'Standard Layout'}
                                </span>
                              </td>
                              <td>
                                <span className="text-secondary font-monospace small">
                                  {theatre.theatreId}
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  onClick={() => promptDelete('theatre', theatre)}
                                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                  title="Delete this theatre and all its screenings"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="me-1" /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 3: SHOWS LIST & DELETION
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'shows' && (
              <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow overflow-hidden">
                <div className="card-header bg-transparent border-secondary border-opacity-25 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-white d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-warning" />
                    Scheduled Shows ({filteredShows.length})
                  </h5>
                  <span className="small text-secondary">
                    Screenings scheduled across active theatre locations
                  </span>
                </div>

                {filteredShows.length === 0 ? (
                  <div className="text-center py-5 text-secondary">
                    <FontAwesomeIcon icon={faCalendarAlt} className="fa-3x mb-3 text-secondary opacity-50" />
                    <h6>No shows found matching "{searchQuery}"</h6>
                    <p className="small">Schedule a new show using the Schedule Show button.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead className="table-dark text-secondary border-secondary border-opacity-25 small text-uppercase">
                        <tr>
                          <th>Movie</th>
                          <th>Theatre Location</th>
                          <th>Date</th>
                          <th>Show Time</th>
                          <th>Seat Occupancy</th>
                          <th>Show ID</th>
                          <th className="text-end" style={{ width: '130px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShows.map((show) => {
                          const total = show.totalSeats || (show.tickets ? Object.keys(show.tickets).length : 60);
                          const booked = show.bookedSeats || (show.tickets ? Object.values(show.tickets).filter((t) => t.status === 'booked').length : 0);
                          const occupancyPercent = total > 0 ? Math.round((booked / total) * 100) : 0;

                          return (
                            <tr key={show._id || show.showId} className="border-secondary border-opacity-10">
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  {show.posterUrl && (
                                    <img
                                      src={show.posterUrl}
                                      alt=""
                                      style={{ width: '32px', height: '46px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                  )}
                                  <div>
                                    <div className="fw-bold text-white">{show.movieName}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="text-white fw-semibold">
                                  <FontAwesomeIcon icon={faBuilding} className="text-info me-1" />
                                  {show.theatreName}
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-secondary bg-opacity-25 text-light font-monospace">
                                  {show.showDate}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25 font-monospace fw-bold">
                                  <FontAwesomeIcon icon={faClock} className="me-1" />
                                  {show.showTime}
                                </span>
                              </td>
                              <td>
                                <div style={{ minWidth: '120px' }}>
                                  <div className="d-flex justify-content-between small text-secondary mb-1 font-monospace">
                                    <span>{booked} / {total} booked</span>
                                    <span>{occupancyPercent}%</span>
                                  </div>
                                  <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                                    <div
                                      className="progress-bar bg-info"
                                      role="progressbar"
                                      style={{ width: `${occupancyPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-secondary font-monospace small">
                                  {show.showId ? `${show.showId.slice(0, 8)}...` : 'N/A'}
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  onClick={() => promptDelete('show', show)}
                                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                  title="Delete this screening"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="me-1" /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            DELETION CONFIRMATION MODAL
        ══════════════════════════════════════════════════════════════ */}
        {deleteModal.isOpen && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.98) 0%, rgba(10, 4, 20, 0.99) 100%)',
                  border: '1px solid rgba(220, 53, 69, 0.4)',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(220, 53, 69, 0.3)',
                }}
              >
                <div className="modal-header border-secondary border-opacity-25 pb-2">
                  <h5 className="modal-title d-flex align-items-center gap-2 text-danger fw-bold">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    Confirm Permanent Deletion
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    disabled={deleteModal.isDeleting}
                    onClick={closeDeleteModal}
                  />
                </div>

                <div className="modal-body py-4">
                  {deleteModal.type === 'movie' && (
                    <div>
                      <p className="mb-2">
                        Are you sure you want to permanently delete the movie:
                      </p>
                      <div className="p-3 rounded-3 bg-black border border-danger border-opacity-25 mb-3 text-white fw-bold fs-5">
                        {deleteModal.item?.movieName}
                      </div>
                      <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 small mb-0">
                        <strong>Warning:</strong> This will also remove any future scheduled shows for this title from all theatres.
                      </div>
                    </div>
                  )}

                  {deleteModal.type === 'theatre' && (
                    <div>
                      <p className="mb-2">
                        Are you sure you want to delete this theatre:
                      </p>
                      <div className="p-3 rounded-3 bg-black border border-danger border-opacity-25 mb-3">
                        <div className="text-white fw-bold fs-5">{deleteModal.item?.theatreName}</div>
                        <div className="text-secondary small">{deleteModal.item?.location}</div>
                      </div>
                      <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 small mb-0">
                        <strong>Warning:</strong> Deleting this venue will cancel and delete all screenings scheduled at this cinema.
                      </div>
                    </div>
                  )}

                  {deleteModal.type === 'show' && (
                    <div>
                      <p className="mb-2">
                        Are you sure you want to delete this screening:
                      </p>
                      <div className="p-3 rounded-3 bg-black border border-danger border-opacity-25 mb-3">
                        <div className="text-white fw-bold">{deleteModal.item?.movieName}</div>
                        <div className="text-info small">{deleteModal.item?.theatreName}</div>
                        <div className="text-warning small font-monospace mt-1">
                          {deleteModal.item?.showDate} at {deleteModal.item?.showTime}
                        </div>
                      </div>
                      <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 small mb-0">
                        This action will remove the show and release all associated seating inventory.
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-secondary border-opacity-25 pt-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-white"
                    disabled={deleteModal.isDeleting}
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger fw-bold px-4"
                    disabled={deleteModal.isDeleting}
                    onClick={confirmDelete}
                  >
                    {deleteModal.isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Yes, Delete Permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCatalogPage;
