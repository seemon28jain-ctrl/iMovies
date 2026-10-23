/**
 * AdminSidebar.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Navigation Sidebar for Admin Portal
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faBuilding, faCalendarAlt, faTicketAlt,
  faUserPlus, faChartBar, faSignOutAlt, faArrowLeft,
  faMoneyBillWave, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/admin',             icon: faChartBar,       label: 'Dashboard' },
  { to: '/managecatalog',     icon: faLayerGroup,     label: 'Manage Catalog' },
  { to: '/addmovie',          icon: faFilm,           label: 'Add Movie' },
  { to: '/addtheatre',        icon: faBuilding,       label: 'Add Theatre' },
  { to: '/addshow',           icon: faCalendarAlt,    label: 'Add Show' },
  { to: '/adminbookings',     icon: faTicketAlt,      label: 'Bookings' },
  { to: '/admintransactions', icon: faMoneyBillWave,  label: 'Transactions & Refunds' },
  { to: '/addadmin',          icon: faUserPlus,       label: 'Add Admin' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('imovies-admin-token');
    localStorage.removeItem('imovies-token');
    localStorage.removeItem('imovies-username');
    localStorage.removeItem('imovies-email');
    navigate('/login');
  };

  return (
    <>
      <style>{`
        .admin-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
          background: rgba(10, 4, 20, 0.92);
          backdrop-filter: blur(20px);
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 1.5rem 1.25rem 1.25rem;
          border-bottom: 1px solid rgba(0, 229, 255, 0.18);
          font-size: 1.15rem;
          font-weight: 900;
          color: #fff;
          text-decoration: none;
        }
        .sidebar-logo:hover { text-decoration: none; }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 1rem 0.65rem;
          flex: 1;
          gap: 0.25rem;
        }
        .sidebar-footer {
          padding: 0.85rem 0.65rem 1.25rem;
          border-top: 1px solid rgba(0, 229, 255, 0.15);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .sidebar-back-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          color: #C4B5FD;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border: 1px solid transparent;
          background: none;
          width: 100%;
          transition: all 0.2s ease;
        }
        .sidebar-back-btn:hover {
          background: rgba(59, 10, 107, 0.4);
          color: #00E5FF;
          border-color: rgba(0, 229, 255, 0.2);
        }
        .sidebar-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          color: #00E5FF;
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.25);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
          text-align: left;
        }
        .sidebar-logout-btn:hover {
          background: #00E5FF;
          color: #050505;
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
        }
        .sidebar-section-label {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #00E5FF;
          padding: 0.5rem 0.85rem 0.35rem;
          margin-top: 0.25rem;
        }
      `}</style>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-inner">
          {/* Logo */}
          <NavLink to="/admin" className="sidebar-logo">
            <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.6))' }} />
            <span>
              <span style={{ color: '#00E5FF' }}>i</span>
              <span>Movies Admin</span>
            </span>
          </NavLink>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <p className="sidebar-section-label">Management</p>
            {navItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <FontAwesomeIcon icon={icon} style={{ width: '16px', color: '#00E5FF' }} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-top border-secondary border-opacity-10 d-flex justify-content-center">
            <ThemeToggle showLabel={true} />
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-back-btn" onClick={() => navigate('/home')}>
              <FontAwesomeIcon icon={faArrowLeft} style={{ width: '16px' }} />
              Back to Site
            </button>
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} style={{ width: '16px' }} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
