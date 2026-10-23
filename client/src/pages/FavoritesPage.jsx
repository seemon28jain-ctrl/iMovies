/**
 * FavoritesPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Saved Movie Watchlist
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash, faFilm, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import api from '../utils/api';

const FavoritesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/favorites');
      setMovies(res.data.movies || res.data.favorites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (movieId) => {
    try {
      const res = await api.delete(`/favorites/${movieId}`);
      if (res.data.success) {
        toast.info('Removed from watchlist.');
        setMovies((prev) => prev.filter((m) => m._id !== movieId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove from watchlist.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="container my-5 flex-grow-1">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2.5rem', paddingBottom: '1.25rem',
          borderBottom: '1px solid rgba(0, 229, 255, 0.18)'
        }}>
          <div>
            <h2 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faHeart} style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.5))' }} />
              My Watchlist
            </h2>
            <p style={{ color: '#C4B5FD', margin: 0, fontSize: '0.9rem' }}>
              Your saved cinematic blockbusters ready for seat reservation
            </p>
          </div>
          <Link to="/home" className="btn-outline-cyan btn-sm" style={{ padding: '0.55rem 1.25rem', borderRadius: '10px' }}>
            Browse More Movies
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : movies.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.6) 0%, rgba(10, 4, 20, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px', border: '1px solid rgba(0, 229, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            <FontAwesomeIcon icon={faHeart} style={{ fontSize: '3.5rem', color: '#00E5FF', opacity: 0.5, marginBottom: '1.25rem' }} />
            <h4 className="text-white fw-bold mb-2">Your Watchlist is Empty</h4>
            <p style={{ color: '#C4B5FD', maxWidth: '420px', margin: '0 auto 1.75rem' }}>
              Save trending market movies here to track showtimes and reserve tickets swiftly.
            </p>
            <Link to="/home" className="btn-primary-cyan px-4 py-2" style={{ borderRadius: '12px' }}>
              Explore Trending Movies
            </Link>
          </div>
        ) : (
          <div className="row g-2 g-md-3">
            {movies.map((movie) => (
              <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2 position-relative">
                <MovieCard movie={movie} />
                <button
                  onClick={() => handleRemove(movie._id)}
                  style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                    width: 36, height: 36, borderRadius: '50%', padding: 0,
                    background: 'rgba(5, 5, 5, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#F87171',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#EF4444';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(5, 5, 5, 0.85)';
                    e.currentTarget.style.color = '#F87171';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Remove from watchlist"
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.85rem' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;
