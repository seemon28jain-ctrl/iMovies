/**
 * Header.jsx - Main navigation header with Jet Black, Royal Amethyst & Electric Cyan Glassmorphism
 */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faBars, faTimes, faTicketAlt,
  faHeart, faUser, faSignOutAlt, faUserShield,
  faHome, faMapMarkerAlt, faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from './ThemeToggle';

const CITIES = [
  'Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad',
  'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Chandigarh', 'Jaipur', 'New York', 'London'
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem('imovies-location') || 'Mumbai');
  const [showCityModal, setShowCityModal] = useState(false);
  const navigate = useNavigate();

  // Listen to external city changes
  useEffect(() => {
    const handleCityChange = (e) => {
      if (e.detail) setCity(e.detail);
    };
    window.addEventListener('imovies-city-changed', handleCityChange);
    return () => window.removeEventListener('imovies-city-changed', handleCityChange);
  }, []);

  const selectCity = (c) => {
    setCity(c);
    localStorage.setItem('imovies-location', c);
    setShowCityModal(false);
    window.dispatchEvent(new CustomEvent('imovies-city-changed', { detail: c }));
  };

  // Retrieve stored user details
  const username = localStorage.getItem('imovies-username') || 'User';
  const hasAdminToken = !!localStorage.getItem('imovies-admin-token');

  const handleLogout = () => {
    localStorage.removeItem('imovies-token');
    localStorage.removeItem('imovies-admin-token');
    localStorage.removeItem('imovies-username');
    localStorage.removeItem('imovies-email');
    navigate('/landing');
  };

  const navLinkClass = ({ isActive }) =>
    `header-nav-link ${isActive ? 'header-nav-link--active' : ''}`;

  return (
    <>
      <style>{`
        .header {
          background: rgba(5, 5, 5, 0.78);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(0, 229, 255, 0.18);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 10, 107, 0.35);
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 0 1.75rem;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .header-logo:hover { text-decoration: none; }
        .btn-location {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 1rem;
          background: rgba(59, 10, 107, 0.35);
          border: 1px solid rgba(0, 229, 255, 0.28);
          border-radius: 20px;
          color: #C4B5FD;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          margin-left: 1rem;
        }
        .btn-location:hover {
          background: rgba(0, 229, 255, 0.18);
          border-color: #00E5FF;
          color: #00E5FF;
          box-shadow: 0 0 14px rgba(0, 229, 255, 0.4);
        }
        body.light-theme .btn-location {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(59, 10, 107, 0.2);
          color: #3B0A6B;
          box-shadow: 0 2px 8px rgba(59, 10, 107, 0.08);
        }
        body.light-theme .btn-location:hover {
          background: rgba(0, 141, 163, 0.1);
          border-color: #008DA3;
          color: #008DA3;
        }
        .header-logo-icon {
          color: #00E5FF;
          font-size: 1.6rem;
          filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.65));
        }
        .header-logo-text {
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .header-logo-text .brand-i {
          color: #00E5FF;
          text-shadow: 0 0 12px rgba(0, 229, 255, 0.7);
        }
        .header-logo-text .brand-movies {
          background: linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 50%, #9D4EDD 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-nav {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin: 0 1.25rem;
        }
        .header-nav-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.55rem 1.25rem;
          border-radius: 14px;
          color: #C4B5FD;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }
        .header-nav-link:hover {
          color: #00E5FF;
          background: rgba(59, 10, 107, 0.35);
          border-color: rgba(0, 229, 255, 0.25);
          text-decoration: none;
        }
        .header-nav-link--active {
          color: #00E5FF;
          background: rgba(0, 229, 255, 0.12);
          border-color: rgba(0, 229, 255, 0.45);
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.3);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .btn-logout {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(0, 229, 255, 0.3);
          color: #00E5FF;
          background: rgba(0, 229, 255, 0.06);
          backdrop-filter: blur(8px);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-logout:hover {
          background: #00E5FF;
          color: #050505;
          border-color: #00E5FF;
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
        }
        .btn-admin-portal {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(157, 78, 221, 0.4);
          color: #C4B5FD;
          background: rgba(59, 10, 107, 0.35);
          backdrop-filter: blur(8px);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
        }
        .btn-admin-portal:hover {
          background: rgba(157, 78, 221, 0.25);
          border-color: #00E5FF;
          color: #00E5FF;
        }
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(157, 78, 221, 0.5);
          color: #E2D9F3;
          background: linear-gradient(135deg, rgba(59, 10, 107, 0.6), rgba(107, 23, 184, 0.4));
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 0 12px rgba(59, 10, 107, 0.4);
        }
        .btn-admin-portal:hover {
          background: linear-gradient(135deg, #00E5FF, #3B0A6B);
          color: #050505;
          border-color: #00E5FF;
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
          text-decoration: none;
        }
        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #00E5FF;
          font-size: 1.4rem;
          cursor: pointer;
          padding: 0.4rem;
        }
        .mobile-menu {
          display: none !important;
        }
        @media (max-width: 768px) {
          .hamburger-btn { display: flex; align-items: center; }
          .header-nav { display: none !important; }
          .mobile-menu {
            display: flex !important;
            position: fixed;
            top: 68px;
            left: 0;
            right: 0;
            background: rgba(10, 4, 20, 0.96);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 229, 255, 0.2);
            padding: 1.25rem;
            flex-direction: column;
            gap: 0.5rem;
            z-index: 999;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.8);
          }
          .mobile-nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.85rem 1.25rem;
            border-radius: 12px;
            color: #C4B5FD;
            text-decoration: none;
            font-weight: 700;
            transition: all 0.2s ease;
          }
          .mobile-nav-link:hover, .mobile-nav-link.active-mobile {
            color: #00E5FF;
            background: rgba(59, 10, 107, 0.35);
            text-decoration: none;
          }
          .mobile-divider { border: none; border-top: 1px solid rgba(0, 229, 255, 0.15); margin: 0.5rem 0; }
        }
      `}</style>

      <header className="header">
        {/* Logo & City Selector */}
        <div className="d-flex align-items-center">
          <NavLink to="/home" className="header-logo">
            <FontAwesomeIcon icon={faFilm} className="header-logo-icon" />
            <span className="header-logo-text">
              <span className="brand-i">i</span>
              <span className="brand-movies">Movies</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => setShowCityModal(true)}
            className="btn-location d-none d-sm-inline-flex"
            title="Select Cinema Location"
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#00E5FF' }} />
            <span>{city}</span>
            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.68rem', opacity: 0.8 }} />
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="header-nav">
          <NavLink to="/home" className={navLinkClass}>
            <FontAwesomeIcon icon={faHome} />
            Home
          </NavLink>
          <NavLink to="/bookings" className={navLinkClass}>
            <FontAwesomeIcon icon={faTicketAlt} />
            My Bookings
          </NavLink>
          <NavLink to="/favoriteshows" className={navLinkClass}>
            <FontAwesomeIcon icon={faHeart} />
            Watchlist
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            <FontAwesomeIcon icon={faUser} />
            Profile
          </NavLink>
        </nav>

        {/* Right Side */}
        <div className="header-right">
          {hasAdminToken && (
            <NavLink to="/admin" className="btn-admin-portal">
              <FontAwesomeIcon icon={faUserShield} />
              <span className="d-none d-lg-inline">Admin</span>
            </NavLink>
          )}
          <ThemeToggle showLabel={false} />
          <button className="btn-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="d-none d-sm-inline">Logout</span>
          </button>
          <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)}>
            <FontAwesomeIcon icon={mobileOpen ? faTimes : faBars} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Only rendered when mobileOpen is true) */}
      {mobileOpen && (
        <div className="mobile-menu">
          <NavLink to="/home" className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}>
            <FontAwesomeIcon icon={faHome} /> Home
          </NavLink>
          <NavLink to="/bookings" className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}>
            <FontAwesomeIcon icon={faTicketAlt} /> My Bookings
          </NavLink>
          <NavLink to="/favoriteshows" className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}>
            <FontAwesomeIcon icon={faHeart} /> Watchlist
          </NavLink>
          <NavLink to="/profile" className="mobile-nav-link"
            onClick={() => setMobileOpen(false)}>
            <FontAwesomeIcon icon={faUser} /> Profile
          </NavLink>
          {hasAdminToken && (
            <NavLink to="/admin" className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}>
              <FontAwesomeIcon icon={faUserShield} /> Admin Portal
            </NavLink>
          )}
          <hr className="mobile-divider" />
          <button className="mobile-nav-link btn-logout w-100" onClick={handleLogout}
            style={{ border: 'none', background: 'none' }}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => { setShowCityModal(true); setMobileOpen(false); }}
              className="btn-location w-100 justify-content-center m-0"
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#00E5FF' }} />
              <span>Location: {city}</span>
            </button>
          </div>
        </div>
      )}

      {/* City Picker Modal */}
      {showCityModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setShowCityModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.95) 0%, rgba(10, 4, 20, 0.98) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(0, 229, 255, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: '#fff' }}>
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#00E5FF' }} />
                Select Your Cinema City
              </h5>
              <button
                type="button"
                className="btn btn-sm text-secondary"
                onClick={() => setShowCityModal(false)}
                style={{ fontSize: '1.2rem', padding: '0 0.5rem', border: 'none', background: 'none' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <p style={{ color: '#C4B5FD', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Choose your city to discover local cinema halls, live shows, and regional screenings.
            </p>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {CITIES.map((c) => {
                const isSelected = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectCity(c)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #00E5FF, #3B0A6B)' : 'rgba(59, 10, 107, 0.3)',
                      color: isSelected ? '#050505' : '#C4B5FD',
                      border: `1px solid ${isSelected ? '#00E5FF' : 'rgba(0, 229, 255, 0.2)'}`,
                      borderRadius: '12px',
                      padding: '0.55rem 1.15rem',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {c}
                    {isSelected && <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.75rem' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
