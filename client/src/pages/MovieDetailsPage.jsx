/**
 * MovieDetailsPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Movie Detail View
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar, faHeart, faCalendarAlt, faClock,
  faLanguage, faFilm, faTicketAlt, faUser,
  faEdit, faTrash, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import dayjs from 'dayjs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

/* ---- Star Rating Input ---- */
const StarInput = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '0.4rem' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.6rem', color: n <= value ? '#FFB800' : 'rgba(107, 23, 184, 0.4)',
          transition: 'transform 0.15s, color 0.15s',
          filter: n <= value ? 'drop-shadow(0 0 4px rgba(255, 184, 0, 0.6))' : 'none'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ★
      </button>
    ))}
  </div>
);

/* ---- Review Glass Card ---- */
const ReviewCard = ({ review, onDelete, currentUserId }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.65) 0%, rgba(10, 4, 20, 0.8) 100%)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px', padding: '1.25rem 1.5rem',
    border: '1px solid rgba(0, 229, 255, 0.15)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    marginBottom: '1rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #00E5FF, #3B0A6B)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', fontWeight: 800, color: '#fff',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)'
        }}>
          {(review.username || review.userId?.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
            {review.username || review.userId?.username || 'Anonymous'}
          </span>
          <p style={{ color: '#8E7BB0', fontSize: '0.75rem', margin: 0 }}>
            {dayjs(review.createdAt).format('DD MMM YYYY')}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(n => (
            <span key={n} style={{ color: n <= review.rating ? '#FFB800' : '#4A3A66', fontSize: '0.9rem' }}>★</span>
          ))}
        </div>
        {currentUserId === (review.userId?._id || review.userId) && (
          <button
            onClick={() => onDelete(review._id)}
            style={{
              background: 'none', border: 'none', color: '#F87171',
              cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem'
            }}
            title="Delete review"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>
    </div>
    {review.reviewText && (
      <p style={{ color: '#C4B5FD', fontSize: '0.92rem', margin: 0, lineHeight: 1.65 }}>
        {review.reviewText}
      </p>
    )}
  </div>
);

const MovieDetailsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie]           = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 0, review: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const userId = localStorage.getItem('imovies-userid');

  /* ---- Load movie & reviews ---- */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [movieRes, reviewRes, favRes] = await Promise.allSettled([
        api.get(`/movie/${movieId}`),
        api.get(`/review/movie/${movieId}`),
        api.get('/favorite')
      ]);
      if (movieRes.status === 'fulfilled') {
        const d = movieRes.value.data;
        setMovie(d.movie || d.data || d);
      }
      if (reviewRes.status === 'fulfilled') {
        const d = reviewRes.value.data;
        setReviews(Array.isArray(d) ? d : (d.reviews || d.data || []));
      }
      if (favRes.status === 'fulfilled') {
        const d = favRes.value.data;
        const favs = Array.isArray(d) ? d : (d.favorites || d.data || []);
        setIsFavorite(favs.some(f => (f._id || f.movieId) === movieId));
      }
    } catch {
      toast.error('Failed to load movie details.');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ---- Watchlist Toggle ---- */
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/favorite/${movieId}`);
        toast.success('Removed from watchlist');
      } else {
        await api.post('/favorite', { movieId });
        toast.success('Added to watchlist!');
      }
      setIsFavorite(f => !f);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  /* ---- Submit Review ---- */
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) { toast.warning('Please select a star rating'); return; }
    setReviewLoading(true);
    try {
      await api.post('/review', { movieId, rating: reviewForm.rating, reviewText: reviewForm.review });
      toast.success('Review submitted!');
      setReviewForm({ rating: 0, review: '' });
      setShowReviewForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  /* ---- Delete Review ---- */
  const handleReviewDelete = async (reviewId) => {
    try {
      await api.delete(`/review/${movieId}`);
      toast.success('Review deleted');
      setReviews(r => r.filter(x => x._id !== reviewId));
    } catch {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <div className="film-reel" style={{ width: '56px', height: '56px' }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4rem' }}>
          <FontAwesomeIcon icon={faFilm} style={{ fontSize: '3rem', color: '#00E5FF', marginBottom: '1rem', opacity: 0.6 }} />
          <h3 style={{ color: '#C4B5FD' }}>Movie Not Found</h3>
        </div>
        <Footer />
      </div>
    );
  }

  const genres = Array.isArray(movie.genres)
    ? movie.genres
    : (typeof movie.genres === 'string' ? movie.genres.split(',') : []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (movie.avgRating || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {/* ---- HERO BACKDROP ---- */}
        <div style={{
          background: movie.posterUrl
            ? `linear-gradient(to right, #050505 45%, rgba(59, 10, 107, 0.75)), url(${movie.posterUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, rgba(59, 10, 107, 0.6), #050505)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
          padding: '3.5rem 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className="row g-4 align-items-start">
              {/* Poster */}
              <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.movieName}
                    style={{
                      width: '100%', maxWidth: '240px',
                      borderRadius: '18px',
                      border: '2px solid rgba(0, 229, 255, 0.35)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 25px rgba(0, 229, 255, 0.3)',
                      display: 'inline-block'
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '100%', maxWidth: '240px', paddingTop: '140%',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #1C0A34, #050505)',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3.5rem', color: '#00E5FF'
                  }}>
                    <FontAwesomeIcon icon={faFilm} />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="col-12 col-md-8 col-lg-9">
                {/* Title */}
                <h1 style={{
                  fontSize: 'clamp(1.8rem, 4.5vw, 2.9rem)',
                  fontWeight: 900, marginBottom: '0.85rem', color: '#fff',
                  letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                }}>
                  {movie.movieName}
                </h1>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                  {genres.map((g, i) => <span key={i} className="badge-genre">{typeof g === 'string' ? g.trim() : g}</span>)}
                  {movie.language && (
                    <span className="badge-lang">
                      <FontAwesomeIcon icon={faLanguage} style={{ marginRight: '0.35rem' }} />{movie.language}
                    </span>
                  )}
                  {movie.certification && <span className="badge-cert">{movie.certification}</span>}
                </div>

                {/* Info pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem', color: '#C4B5FD', fontSize: '0.95rem' }}>
                  {movie.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FontAwesomeIcon icon={faClock} style={{ color: '#00E5FF' }} />
                      {movie.duration} min
                    </span>
                  )}
                  {movie.releaseDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#00E5FF' }} />
                      {dayjs(movie.releaseDate).format('DD MMM YYYY')}
                    </span>
                  )}
                  {avgRating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FFB800', fontWeight: 800 }}>
                      <FontAwesomeIcon icon={faStar} />
                      {avgRating} / 5 ({reviews.length} reviews)
                    </span>
                  )}
                </div>

                {/* Description */}
                {movie.description && (
                  <p style={{ color: '#C4B5FD', lineHeight: 1.8, marginBottom: '1.75rem', maxWidth: '750px', fontSize: '0.98rem' }}>
                    {movie.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <button
                    onClick={() => navigate(`/movieshows/${movieId}`)}
                    className="btn-primary-cyan"
                    style={{ fontSize: '1.05rem', padding: '0.85rem 2.4rem', borderRadius: '12px' }}
                  >
                    <FontAwesomeIcon icon={faTicketAlt} /> Book Tickets
                  </button>
                  <button
                    onClick={toggleFavorite}
                    style={{
                      background: isFavorite ? 'rgba(0, 229, 255, 0.18)' : 'rgba(25, 9, 45, 0.7)',
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${isFavorite ? '#00E5FF' : 'rgba(0, 229, 255, 0.3)'}`,
                      borderRadius: '12px', color: isFavorite ? '#00E5FF' : '#C4B5FD',
                      padding: '0.85rem 1.8rem', cursor: 'pointer', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '0.55rem', transition: 'all 0.25s ease'
                    }}
                  >
                    <FontAwesomeIcon icon={isFavorite ? faHeart : faHeartOutline} />
                    {isFavorite ? 'In Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- REVIEWS SECTION ---- */}
        <div className="container" style={{ padding: '3rem 1rem' }}>
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FontAwesomeIcon icon={faStar} style={{ color: '#FFB800' }} />
                  User Reviews ({reviews.length})
                </h3>
                <button
                  onClick={() => setShowReviewForm(s => !s)}
                  className={showReviewForm ? 'btn-outline-cyan' : 'btn-primary-amethyst'}
                  style={{ fontSize: '0.88rem', padding: '0.55rem 1.25rem', borderRadius: '10px' }}
                >
                  <FontAwesomeIcon icon={showReviewForm ? faTimes : faEdit} />
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} style={{
                  background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.75) 0%, rgba(10, 4, 20, 0.9) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 229, 255, 0.22)',
                  borderRadius: '18px', padding: '1.75rem', marginBottom: '2rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
                }}>
                  <h6 style={{ color: '#C4B5FD', fontWeight: 700, marginBottom: '0.85rem' }}>Your Rating</h6>
                  <StarInput value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                  <textarea
                    placeholder="Share your thoughts about this movie..."
                    value={reviewForm.review}
                    onChange={e => setReviewForm(f => ({ ...f, review: e.target.value }))}
                    rows={3}
                    style={{
                      background: 'rgba(8, 3, 16, 0.85)',
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                      borderRadius: '10px', color: '#fff', padding: '0.85rem 1rem',
                      width: '100%', fontSize: '0.92rem', outline: 'none',
                      resize: 'vertical', marginTop: '1rem'
                    }}
                    onFocus={e => e.target.style.borderColor = '#00E5FF'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0, 229, 255, 0.2)'}
                  />
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="btn-primary-cyan"
                    style={{ marginTop: '1rem', fontSize: '0.92rem', borderRadius: '10px' }}
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3.5rem 2rem',
                  background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.5) 0%, rgba(10, 4, 20, 0.75) 100%)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px', border: '1px solid rgba(0, 229, 255, 0.15)', color: '#8E7BB0'
                }}>
                  <FontAwesomeIcon icon={faStar} style={{ fontSize: '2.5rem', color: '#00E5FF', opacity: 0.5, marginBottom: '0.85rem', display: 'block' }} />
                  No reviews yet. Be the first to share your thoughts!
                </div>
              ) : (
                reviews.map(r => (
                  <ReviewCard key={r._id} review={r} onDelete={handleReviewDelete} currentUserId={userId} />
                ))
              )}
            </div>

            {/* Side Info */}
            <div className="col-12 col-lg-4">
              <div style={{
                background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.75) 0%, rgba(10, 4, 20, 0.9) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: '18px', padding: '1.75rem',
                position: 'sticky', top: '90px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
              }}>
                <h6 style={{
                  color: '#00E5FF', fontSize: '0.82rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.25rem'
                }}>
                  Screening Summary
                </h6>
                {[
                  { label: 'Language', value: movie.language },
                  { label: 'Duration', value: movie.duration ? `${movie.duration} min` : null },
                  { label: 'Certification', value: movie.certification },
                  { label: 'Release', value: movie.releaseDate ? dayjs(movie.releaseDate).format('DD MMM YYYY') : null },
                  { label: 'Avg Rating', value: avgRating ? `⭐ ${avgRating}/5` : 'No ratings yet' }
                ].filter(item => item.value).map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0',
                    borderBottom: '1px solid rgba(0, 229, 255, 0.08)'
                  }}>
                    <span style={{ color: '#8E7BB0', fontSize: '0.88rem' }}>{label}</span>
                    <span style={{ color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}

                <button
                  onClick={() => navigate(`/movieshows/${movieId}`)}
                  className="btn-primary-cyan w-100"
                  style={{ justifyContent: 'center', marginTop: '1.5rem', padding: '0.85rem', borderRadius: '12px' }}
                >
                  <FontAwesomeIcon icon={faTicketAlt} /> Book Showtime
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MovieDetailsPage;
