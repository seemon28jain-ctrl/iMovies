/**
 * AddShowPage.jsx - Admin page to schedule movie screenings
 * Features:
 *  - Dynamic movie dropdown (GET /api/movie)
 *  - Dynamic theatre dropdown (GET /api/theatre)
 *  - Date and time selectors
 *  - Automatically maps seat tiers into real-time tickets schema
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt, faFilm, faBuilding, faClock,
  faCheckCircle, faPlus
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import Loader from '../../components/Loader';
import api from '../../utils/api';

const AddShowPage = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [movieFilter, setMovieFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    movieId: '',
    theatreId: '',
    showDate: new Date().toISOString().split('T')[0],
    showTime: '06:30 PM',
  });

  // Convert 24hr time (from <input type="time">) to 12hr "hh:mm AM/PM"
  const convert24To12 = (time24) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // Convert 12hr "hh:mm AM/PM" back to "HH:mm" for native picker
  const convert12To24 = (time12) => {
    if (!time12) return '18:30';
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return '18:30';
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = (match[3] || 'PM').toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours < 10 ? '0' + hours : hours}:${minutes}`;
  };

  const handleTimePickerChange = (e) => {
    const time24 = e.target.value;
    const formatted = convert24To12(time24);
    setForm((prev) => ({ ...prev, showTime: formatted }));
  };

  const presetTimes = [
    '09:30 AM', '10:00 AM', '11:15 AM', '01:30 PM', '03:45 PM',
    '04:45 PM', '06:30 PM', '07:30 PM', '09:15 PM', '10:15 PM', '11:00 PM'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [moviesRes, theatresRes] = await Promise.all([
          api.get('/movie?all=true'),
          api.get('/theatre'),
        ]);

        const rawMovies = moviesRes.data.movies || [];
        // Sort with newly created movies at the very top
        const fetchedMovies = [...rawMovies].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        const fetchedTheatres = theatresRes.data.theatres || [];

        setMovies(fetchedMovies);
        setTheatres(fetchedTheatres);

        if (fetchedMovies.length > 0) {
          setForm((prev) => ({ ...prev, movieId: fetchedMovies[0]._id }));
        }
        if (fetchedTheatres.length > 0) {
          setForm((prev) => ({ ...prev, theatreId: fetchedTheatres[0].theatreId }));
        }
      } catch (err) {
        toast.error('Failed to load movies or theatres.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.movieId) {
      toast.error('Please select a movie.');
      return;
    }
    if (!form.theatreId) {
      toast.error('Please select a theatre.');
      return;
    }
    if (!form.showDate) {
      toast.error('Please pick a show date.');
      return;
    }
    if (!form.showTime) {
      toast.error('Please specify a show time.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/shows', form);
      if (res.data.success) {
        toast.success('Show scheduled successfully!');
        navigate('/managecatalog?tab=shows');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create show.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
          <div>
            <h2 className="text-white fw-bold mb-1">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-warning me-2" />
              Schedule Show
            </h2>
            <p className="text-secondary small mb-0">Link a movie to a theatre location, date, and showtime</p>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <form onSubmit={handleSubmit} className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow p-4">
                <h5 className="text-warning fw-bold mb-3 border-bottom border-secondary border-opacity-10 pb-2">
                  Screening Schedule
                </h5>

                {/* Movie Selector with Search & Live Preview */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small text-secondary mb-0">
                      <FontAwesomeIcon icon={faFilm} className="me-1 text-danger" /> Select Movie *
                    </label>
                    <span className="small text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
                      {movies.length} titles available in catalog
                    </span>
                  </div>

                  {/* Quick filter input */}
                  <div className="input-group input-group-sm mb-2">
                    <span className="input-group-text bg-black text-secondary border-secondary border-opacity-50">
                      Filter Title:
                    </span>
                    <input
                      type="text"
                      value={movieFilter}
                      onChange={(e) => setMovieFilter(e.target.value)}
                      placeholder="Type to quickly narrow down movie list..."
                      className="form-control bg-black text-white border-secondary border-opacity-50"
                    />
                    {movieFilter && (
                      <button
                        type="button"
                        onClick={() => setMovieFilter('')}
                        className="btn btn-outline-secondary text-secondary"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {movies.length === 0 ? (
                    <div className="alert alert-warning py-2 small">
                      No movies registered yet. Please add a movie first.
                    </div>
                  ) : (
                    <select
                      name="movieId"
                      value={form.movieId}
                      onChange={handleInputChange}
                      className="form-select bg-black text-white border-secondary border-opacity-50"
                      required
                    >
                      {movies
                        .filter((m) =>
                          !movieFilter.trim() ||
                          m.movieName.toLowerCase().includes(movieFilter.toLowerCase())
                        )
                        .map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.movieName} ({m.language || 'English'} - {m.certification || 'U/A'}) {!m.tmdbId ? '✨ [Newly Added]' : ''}
                          </option>
                        ))}
                    </select>
                  )}

                  {/* Selected Movie Live Preview Pill Card */}
                  {(() => {
                    const selectedMovie = movies.find((m) => m._id === form.movieId);
                    if (!selectedMovie) return null;
                    return (
                      <div
                        className="d-flex align-items-center gap-3 p-2 mt-2 rounded-3"
                        style={{
                          background: 'rgba(25, 9, 45, 0.65)',
                          border: '1px solid rgba(0, 229, 255, 0.2)',
                        }}
                      >
                        {selectedMovie.posterUrl ? (
                          <img
                            src={selectedMovie.posterUrl}
                            alt=""
                            style={{ width: '38px', height: '54px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <div
                            className="bg-black text-secondary d-flex align-items-center justify-content-center rounded"
                            style={{ width: '38px', height: '54px', fontSize: '0.65rem' }}
                          >
                            No Poster
                          </div>
                        )}
                        <div>
                          <div className="text-white fw-bold" style={{ fontSize: '0.92rem' }}>
                            {selectedMovie.movieName}{' '}
                            {!selectedMovie.tmdbId && (
                              <span className="badge bg-info text-dark font-monospace small py-0 px-1">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="small text-secondary font-monospace" style={{ fontSize: '0.78rem' }}>
                            {selectedMovie.language || 'English'} • {selectedMovie.duration || '120 min'} • {selectedMovie.certification || 'U/A'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Theatre Selector */}
                <div className="mb-4">
                  <label className="form-label small text-secondary">
                    <FontAwesomeIcon icon={faBuilding} className="me-1 text-info" /> Select Theatre *
                  </label>
                  {theatres.length === 0 ? (
                    <div className="alert alert-warning py-2 small">
                      No theatres registered yet. Please add a theatre first.
                    </div>
                  ) : (
                    <select
                      name="theatreId"
                      value={form.theatreId}
                      onChange={handleInputChange}
                      className="form-select bg-black text-white border-secondary border-opacity-50"
                      required
                    >
                      {theatres.map((t) => (
                        <option key={t.theatreId} value={t.theatreId}>
                          {t.theatreName} - {t.location}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date and Time Row */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small text-secondary">Show Date *</label>
                    <input
                      type="date"
                      name="showDate"
                      value={form.showDate}
                      onChange={handleInputChange}
                      className="form-control bg-black text-white border-secondary border-opacity-50"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small text-secondary d-flex justify-content-between align-items-center">
                      <span><FontAwesomeIcon icon={faClock} className="me-1 text-warning" /> Show Time *</span>
                      <span className="badge bg-secondary bg-opacity-25 text-info font-monospace small">
                        {form.showTime || 'Select Time'}
                      </span>
                    </label>

                    {/* Dual Custom Time Controls: Clock Picker + Formatted Text Input */}
                    <div className="input-group mb-2">
                      <span className="input-group-text bg-black text-secondary border-secondary border-opacity-50">
                        <FontAwesomeIcon icon={faClock} />
                      </span>
                      <input
                        type="time"
                        value={convert12To24(form.showTime)}
                        onChange={handleTimePickerChange}
                        className="form-control bg-black text-white border-secondary border-opacity-50"
                        title="Pick exact time (hours & minutes)"
                        style={{ maxWidth: '140px' }}
                      />
                      <input
                        type="text"
                        name="showTime"
                        value={form.showTime}
                        onChange={handleInputChange}
                        placeholder="e.g. 03:45 PM"
                        className="form-control bg-black text-white border-secondary border-opacity-50 font-monospace text-center fw-bold"
                        required
                      />
                    </div>

                    {/* Quick Selection Presets */}
                    <div>
                      <div className="small text-secondary mb-1" style={{ fontSize: '0.72rem' }}>
                        Quick Presets (or type / pick any custom time above):
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {presetTimes.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, showTime: preset }))}
                            className={`btn btn-xs py-0 px-2 rounded-pill font-monospace ${
                              form.showTime === preset
                                ? 'btn-info text-dark fw-bold'
                                : 'btn-outline-secondary text-secondary'
                            }`}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="btn btn-outline-secondary text-white px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || movies.length === 0 || theatres.length === 0}
                    className="btn btn-warning px-4 fw-semibold text-dark"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    {submitting ? 'Scheduling...' : 'Confirm & Publish Show'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddShowPage;
