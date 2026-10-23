/**
 * MovieShowsPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Showtime Selector
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding, faClock, faCalendarAlt, faTicketAlt, faFilm,
  faTimesCircle, faCheckCircle, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

dayjs.extend(customParseFormat);

const MovieShowsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie]               = useState(null);
  const [shows, setShows]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Build 7-day array
  const days = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day'));

  /* ---- Check if a showtime has already ended/passed ---- */
  const isShowPast = (show) => {
    const sDate = show.showDate || show.date;
    const sTime = show.showTime || show.time;
    if (!sDate || !sTime) return false;

    try {
      // Parse "YYYY-MM-DD hh:mm A" (e.g. "2026-10-23 10:00 AM" or "2026-10-23 01:30 PM")
      const parsed = dayjs(`${sDate} ${sTime}`, 'YYYY-MM-DD hh:mm A');
      if (parsed.isValid()) {
        return parsed.isBefore(dayjs());
      }
      const fallback = dayjs(`${sDate} ${sTime}`);
      return fallback.isValid() ? fallback.isBefore(dayjs()) : false;
    } catch {
      return false;
    }
  };

  /* ---- Load data ---- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [movieRes, showsRes] = await Promise.allSettled([
          api.get(`/movie/${movieId}`),
          api.get(`/shows/movie/${movieId}`)
        ]);
        if (movieRes.status === 'fulfilled') {
          const d = movieRes.value.data;
          setMovie(d.movie || d.data || d);
        }
        if (showsRes.status === 'fulfilled') {
          const d = showsRes.value.data;
          setShows(Array.isArray(d) ? d : (d.shows || d.data || []));
        }
      } catch {
        toast.error('Failed to load shows');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [movieId]);

  /* ---- Filter shows by selected date ---- */
  const filteredShows = shows.filter(show => {
    const showDate = dayjs(show.showDate || show.date || show.showTime).format('YYYY-MM-DD');
    return showDate === selectedDate;
  });

  /* ---- Group by theatre ---- */
  const byTheatre = filteredShows.reduce((acc, show) => {
    const theatreId = show.theatreId?._id || show.theatreId || 'unknown';
    const theatreName = show.theatreId?.theatreName || show.theatreName || 'Theatre';
    const theatreLocation = show.theatreId?.location || show.location || '';
    if (!acc[theatreId]) {
      acc[theatreId] = { name: theatreName, location: theatreLocation, shows: [] };
    }
    acc[theatreId].shows.push(show);
    return acc;
  }, {});

  const theatreEntries = Object.entries(byTheatre);

  /* ---- Time display ---- */
  const formatTime = (show) => {
    const t = show.showTime || show.time;
    if (!t) return 'N/A';
    if (typeof t === 'string' && t.includes('T')) return dayjs(t).format('hh:mm A');
    return t;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {/* ---- Header Banner ---- */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(59, 10, 107, 0.45) 0%, rgba(5, 5, 5, 0.8) 100%)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.18)',
          padding: '2.5rem 0 2rem'
        }}>
          <div className="container">
            {movie && (
              <>
                <p style={{ color: '#00E5FF', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  <FontAwesomeIcon icon={faTicketAlt} style={{ marginRight: '0.45rem' }} />
                  Select Showtime & Cinema
                </p>
                <h1 style={{
                  fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.6rem', color: '#fff',
                  letterSpacing: '-0.02em'
                }}>
                  {movie.movieName}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#C4B5FD', fontSize: '0.9rem', alignItems: 'center' }}>
                  {movie.language && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF' }} />
                      {movie.language}
                    </span>
                  )}
                  {movie.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FontAwesomeIcon icon={faClock} style={{ color: '#00E5FF' }} />
                      {movie.duration} min
                    </span>
                  )}
                  {movie.certification && <span className="badge-cert">{movie.certification}</span>}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="container" style={{ padding: '2.5rem 1rem' }}>
          {/* ---- Date Selector ---- */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h5 style={{
              marginBottom: '1rem', color: '#00E5FF', fontSize: '0.88rem',
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              Select Date
            </h5>
            <div className="date-scroll-row">
              {days.map(day => (
                <button
                  key={day.format('YYYY-MM-DD')}
                  onClick={() => setSelectedDate(day.format('YYYY-MM-DD'))}
                  className={`date-chip ${selectedDate === day.format('YYYY-MM-DD') ? 'active' : ''}`}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    {day.format('ddd')}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, lineHeight: 1.1, margin: '2px 0' }}>
                    {day.format('D')}
                  </div>
                  <div style={{ fontSize: '0.72rem' }}>
                    {day.format('MMM')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ---- Loading ---- */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="film-reel" style={{ margin: '0 auto' }} />
            </div>
          )}

          {/* ---- Shows by Theatre ---- */}
          {!loading && theatreEntries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {theatreEntries.map(([theatreId, { name, location, shows: theatreShows }]) => (
                <div key={theatreId} style={{
                  background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.75) 0%, rgba(8, 3, 18, 0.9) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 229, 255, 0.18)',
                  borderRadius: '18px', padding: '1.75rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(59, 10, 107, 0.3)'
                }}>
                  {/* Theatre Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', marginBottom: '1.4rem' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(59, 10, 107, 0.8), rgba(0, 229, 255, 0.2))',
                      border: '1px solid rgba(0, 229, 255, 0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#00E5FF', flexShrink: 0, fontSize: '1.1rem'
                    }}>
                      <FontAwesomeIcon icon={faBuilding} />
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '1.15rem' }}>{name}</h5>
                      {location && <p style={{ margin: 0, color: '#C4B5FD', fontSize: '0.88rem', marginTop: '2px' }}>{location}</p>}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                    {theatreShows.map(show => {
                      const isPast = isShowPast(show);
                      const availableSeats = show.availableSeats ?? show.totalSeats ?? '–';
                      return (
                        <button
                          key={show._id}
                          disabled={isPast}
                          onClick={() => !isPast && navigate(`/seatslug/${show._id}`)}
                          title={isPast ? 'This screening has already concluded' : 'Select seats for this show'}
                          style={{
                            background: isPast ? 'rgba(18, 6, 28, 0.45)' : 'rgba(12, 4, 22, 0.75)',
                            backdropFilter: 'blur(10px)',
                            border: isPast ? '1px solid rgba(157, 78, 221, 0.15)' : '1px solid rgba(0, 229, 255, 0.25)',
                            borderRadius: '12px', padding: '0.85rem 1.4rem',
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            transition: 'all 0.25s ease',
                            textAlign: 'left', minWidth: '135px',
                            opacity: isPast ? 0.45 : 1,
                            position: 'relative'
                          }}
                          onMouseEnter={e => {
                            if (!isPast) {
                              e.currentTarget.style.borderColor = '#00E5FF';
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(59,10,107,0.35))';
                              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 229, 255, 0.4)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isPast) {
                              e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.25)';
                              e.currentTarget.style.background = 'rgba(12, 4, 22, 0.75)';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <div style={{ color: isPast ? '#8E7BB0' : '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                            <FontAwesomeIcon icon={faClock} style={{ color: isPast ? '#8E7BB0' : '#00E5FF', marginRight: '0.45rem', fontSize: '0.85rem' }} />
                            {formatTime(show)}
                          </div>
                          {isPast ? (
                            <div style={{ color: '#EF4444', fontSize: '0.74rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '0.7rem' }} />
                              Show Ended
                            </div>
                          ) : (
                            <>
                              <div style={{ color: '#C4B5FD', fontSize: '0.78rem' }}>
                                {availableSeats} seats
                              </div>
                              {(show.price || show.ticketPrice) && (
                                <div style={{ color: '#00E5FF', fontSize: '0.82rem', fontWeight: 800, marginTop: '0.25rem' }}>
                                  ₹{show.price || show.ticketPrice}
                                </div>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- No Shows ---- */}
          {!loading && theatreEntries.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '4.5rem 2rem',
              background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.6) 0%, rgba(10, 4, 20, 0.8) 100%)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px', border: '1px solid rgba(0, 229, 255, 0.18)'
            }}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '2.5rem', color: '#00E5FF', opacity: 0.6, marginBottom: '1rem', display: 'block' }} />
              <h4 style={{ color: '#FFFFFF', fontWeight: 800 }}>No Shows Available</h4>
              <p style={{ color: '#C4B5FD', maxWidth: '420px', margin: '0 auto' }}>
                No shows are scheduled for {dayjs(selectedDate).format('dddd, DD MMMM')}. Please pick another date above.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MovieShowsPage;
