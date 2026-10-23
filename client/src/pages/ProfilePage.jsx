/**
 * ProfilePage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic User Profile and Activity Overview
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle, faEnvelope, faTicketAlt, faHeart,
  faMoneyBillWave, faSignOutAlt, faCalendarAlt, faClock,
  faBuilding, faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const username = localStorage.getItem('imovies-username') || 'Movie Fan';
  const email = localStorage.getItem('imovies-email') || 'user@example.com';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, favsRes] = await Promise.allSettled([
          api.get('/bookings/user'),
          api.get('/favorites'),
        ]);

        if (bookingsRes.status === 'fulfilled') {
          setBookings(bookingsRes.value.data.bookings || []);
        }
        if (favsRes.status === 'fulfilled') {
          setFavoritesCount(favsRes.value.data.count || favsRes.value.data.movies?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'Completed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const handleLogout = () => {
    localStorage.removeItem('imovies-token');
    localStorage.removeItem('imovies-username');
    localStorage.removeItem('imovies-email');
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="container my-5 flex-grow-1">
        {loading ? (
          <Loader />
        ) : (
          <div className="row g-4">
            {/* User Profile Glass Card */}
            <div className="col-lg-4">
              <div style={{
                background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.78) 0%, rgba(8, 3, 18, 0.92) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 229, 255, 0.22)',
                borderRadius: '24px',
                padding: '2.5rem 1.75rem',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 25px rgba(59, 10, 107, 0.35)'
              }}>
                <div
                  style={{
                    width: 96, height: 96, fontSize: '2.2rem', fontWeight: 900,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00E5FF, #3B0A6B)',
                    border: '3px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 0 25px rgba(0, 229, 255, 0.6)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem'
                  }}
                >
                  {getInitials(username)}
                </div>

                <h3 className="fw-bold mb-1 text-white">{username}</h3>
                <p style={{ color: '#C4B5FD', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" style={{ color: '#00E5FF' }} />
                  {email}
                </p>

                <div style={{
                  background: 'rgba(59, 10, 107, 0.5)',
                  border: '1px solid rgba(0, 229, 255, 0.35)',
                  color: '#00E5FF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: '30px',
                  padding: '0.45rem 1.25rem',
                  display: 'inline-block',
                  marginBottom: '1.75rem'
                }}>
                  iMovies VIP Member
                </div>

                <hr style={{ borderColor: 'rgba(0, 229, 255, 0.15)', margin: '0 0 1.5rem' }} />

                <button
                  onClick={handleLogout}
                  className="btn-outline-cyan w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '12px' }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} /> Log Out
                </button>
              </div>
            </div>

            {/* Statistics and Recent Activity */}
            <div className="col-lg-8">
              {/* Stat Cards */}
              <div className="row g-3 mb-4">
                <div className="col-sm-4">
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.7) 0%, rgba(10, 4, 20, 0.85) 100%)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(0, 229, 255, 0.18)',
                    borderRadius: '18px', padding: '1.25rem', textAlign: 'center'
                  }}>
                    <div style={{ color: '#C4B5FD', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <FontAwesomeIcon icon={faTicketAlt} className="me-1" style={{ color: '#00E5FF' }} /> Bookings
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{bookings.length}</div>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.7) 0%, rgba(10, 4, 20, 0.85) 100%)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(0, 229, 255, 0.18)',
                    borderRadius: '18px', padding: '1.25rem', textAlign: 'center'
                  }}>
                    <div style={{ color: '#C4B5FD', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" style={{ color: '#00E5FF' }} /> Total Spent
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00E5FF', textShadow: '0 0 10px rgba(0, 229, 255, 0.4)' }}>
                      ₹{totalSpent}
                    </div>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.7) 0%, rgba(10, 4, 20, 0.85) 100%)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(0, 229, 255, 0.18)',
                    borderRadius: '18px', padding: '1.25rem', textAlign: 'center'
                  }}>
                    <div style={{ color: '#C4B5FD', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      <FontAwesomeIcon icon={faHeart} className="me-1" style={{ color: '#00E5FF' }} /> Watchlist
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{favoritesCount}</div>
                  </div>
                </div>
              </div>

              {/* Activity Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.75) 0%, rgba(8, 3, 18, 0.9) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 229, 255, 0.18)',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '1.25rem', paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(0, 229, 255, 0.15)'
                }}>
                  <h5 className="fw-bold mb-0 text-white">Recent Activity</h5>
                  <Link to="/bookings" style={{ color: '#00E5FF', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                    View All →
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <p style={{ color: '#8E7BB0', fontSize: '0.88rem', margin: 0, padding: '2rem 0', textAlign: 'center' }}>
                    No recent booking activity found.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {bookings.slice(0, 4).map((b) => (
                      <div
                        key={b.bookingId}
                        style={{
                          background: 'rgba(5, 5, 5, 0.65)',
                          border: '1px solid rgba(0, 229, 255, 0.12)',
                          borderRadius: '14px',
                          padding: '1rem 1.25rem',
                          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div className="fw-bold text-white mb-1">
                            <FontAwesomeIcon icon={faBuilding} className="me-2" style={{ color: '#00E5FF' }} />
                            {b.theatreName}
                          </div>
                          <div className="small d-flex gap-3" style={{ color: '#C4B5FD' }}>
                            <span><FontAwesomeIcon icon={faCalendarAlt} className="me-1" style={{ color: '#00E5FF' }} /> {b.showDate}</span>
                            <span><FontAwesomeIcon icon={faClock} className="me-1" style={{ color: '#00E5FF' }} /> {b.showTime}</span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className={b.paymentStatus === 'Completed' ? 'status-confirmed' : 'status-pending'} style={{ fontSize: '0.72rem' }}>
                            {b.paymentStatus}
                          </span>
                          <div style={{ color: '#00E5FF', fontWeight: 800, marginTop: '0.25rem' }}>₹{b.totalAmount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
