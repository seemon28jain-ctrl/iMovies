/**
 * Footer.jsx - Jet Black, Royal Amethyst & Electric Cyan Glassmorphic Footer
 */
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import {
  faTwitter, faFacebook, faInstagram, faYoutube
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <>
      <style>{`
        .footer {
          background: rgba(5, 5, 5, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-top: 1px solid rgba(0, 229, 255, 0.15);
          padding: 3rem 0 2rem;
          margin-top: auto;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(59, 10, 107, 0.25);
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 1.4rem;
          font-weight: 900;
          color: #fff;
          text-decoration: none;
          margin-bottom: 0.75rem;
        }
        .footer-brand:hover { text-decoration: none; }
        .footer-brand-icon {
          color: #00E5FF;
          font-size: 1.5rem;
          filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.5));
        }
        .footer-brand .brand-i {
          color: #00E5FF;
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
        }
        .footer-brand .brand-movies {
          background: linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 50%, #9D4EDD 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .footer-tagline {
          color: #C4B5FD;
          font-size: 0.88rem;
          margin-bottom: 1.5rem;
          max-width: 260px;
          line-height: 1.6;
        }
        .footer-social {
          display: flex;
          gap: 0.75rem;
        }
        .social-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(0, 229, 255, 0.2);
          background: rgba(25, 9, 45, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C4B5FD;
          text-decoration: none;
          font-size: 0.95rem;
          transition: all 0.25s ease;
        }
        .social-icon:hover {
          border-color: #00E5FF;
          color: #00E5FF;
          background: rgba(0, 229, 255, 0.15);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
          transform: translateY(-3px);
          text-decoration: none;
        }
        .footer-heading {
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #00E5FF;
          margin-bottom: 1.25rem;
          text-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
        }
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .footer-links a {
          color: #C4B5FD;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .footer-links a:hover {
          color: #00E5FF;
          text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
          transform: translateX(4px);
          display: inline-block;
        }
        .footer-bottom {
          border-top: 1px solid rgba(0, 229, 255, 0.12);
          margin-top: 2.5rem;
          padding-top: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .footer-copy {
          color: #8E7BB0;
          font-size: 0.82rem;
        }
      `}</style>

      <footer className="footer">
        <div className="container">
          <div className="row g-4">
            {/* Brand Column */}
            <div className="col-12 col-md-4">
              <Link to="/home" className="footer-brand">
                <FontAwesomeIcon icon={faFilm} className="footer-brand-icon" />
                <span>
                  <span className="brand-i">i</span>
                  <span className="brand-movies">Movies</span>
                </span>
              </Link>
              <p className="footer-tagline">
                Movie ticket booking made simple, stylish, and instantaneous. Powered by live cinema market feeds.
              </p>
              <div className="footer-social">
                <a href="#twitter" aria-label="Twitter" className="social-icon">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
                <a href="#facebook" aria-label="Facebook" className="social-icon">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
                <a href="#instagram" aria-label="Instagram" className="social-icon">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href="#youtube" aria-label="YouTube" className="social-icon">
                  <FontAwesomeIcon icon={faYoutube} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-6 col-md-2 offset-md-1">
              <h6 className="footer-heading">Navigation</h6>
              <ul className="footer-links">
                <li><Link to="/home">Now Playing</Link></li>
                <li><Link to="/bookings">My Bookings</Link></li>
                <li><Link to="/favoriteshows">Watchlist</Link></li>
                <li><Link to="/profile">My Profile</Link></li>
              </ul>
            </div>

            {/* Genres */}
            <div className="col-6 col-md-2">
              <h6 className="footer-heading">Top Genres</h6>
              <ul className="footer-links">
                <li><Link to="/home">Action & Sci-Fi</Link></li>
                <li><Link to="/home">Drama & Thriller</Link></li>
                <li><Link to="/home">Comedy & Romance</Link></li>
                <li><Link to="/home">Animation</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="col-12 col-md-3">
              <h6 className="footer-heading">About Experience</h6>
              <p style={{ color: '#C4B5FD', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Crafted with high-precision real-time seat locking, WebSocket telemetry, and TMDB live discovery.
              </p>
              <div style={{
                background: 'rgba(59, 10, 107, 0.45)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '12px',
                padding: '0.65rem 1rem',
                fontSize: '0.8rem',
                color: '#00E5FF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 8px #00E5FF' }}></span>
                All Systems Operational
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-copy">
              © {new Date().getFullYear()} iMovies Inc. All rights reserved. Built with Jet Black & Electric Cyan.
            </span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#privacy" style={{ color: '#8E7BB0', fontSize: '0.82rem' }}>Privacy Policy</a>
              <a href="#terms" style={{ color: '#8E7BB0', fontSize: '0.82rem' }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
