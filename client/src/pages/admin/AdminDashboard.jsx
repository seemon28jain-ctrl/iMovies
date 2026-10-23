/**
 * AdminDashboard.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Platform Overview & Revenue Analytics
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faBuilding, faCalendarAlt, faTicketAlt,
  faMoneyBillWave, faUsers, faChartLine, faSyncAlt,
  faReceipt, faUndo
} from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../../components/AdminSidebar';
import Loader from '../../components/Loader';
import api from '../../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, revRes, bookingsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/revenue'),
        api.get('/bookings'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats);
      }
      if (revRes.status === 'fulfilled') {
        setRevenueData(revRes.value.data.analytics || []);
      }
      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data.bookings || [];
        setRecentBookings(all.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const maxRevenue = Math.max(...(revenueData.map((d) => d.revenue) || [1]), 1000);

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem', paddingBottom: '1.25rem',
          borderBottom: '1px solid rgba(0, 229, 255, 0.18)'
        }}>
          <div>
            <h2 className="text-white fw-bold mb-1">Admin Command Center</h2>
            <p style={{ color: '#C4B5FD', margin: 0, fontSize: '0.88rem' }}>
              Platform telemetry, realtime booking analytics, and revenue metrics
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="btn-outline-cyan btn-sm d-flex align-items-center gap-2"
            style={{ borderRadius: '10px' }}
          >
            <FontAwesomeIcon icon={faSyncAlt} /> Refresh
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="row g-3 mb-4">
              {[
                { icon: faFilm, label: 'Movies', value: stats?.totalMovies ?? 0, color: '#00E5FF', to: '/managecatalog?tab=movies' },
                { icon: faBuilding, label: 'Theatres', value: stats?.totalTheatres ?? 0, color: '#C4B5FD', to: '/managecatalog?tab=theatres' },
                { icon: faCalendarAlt, label: 'Shows', value: stats?.totalShows ?? 0, color: '#FFB800', to: '/managecatalog?tab=shows' },
                { icon: faTicketAlt, label: 'Bookings', value: stats?.totalBookings ?? 0, color: '#00E5FF', to: '/adminbookings' },
                { icon: faUsers, label: 'Users', value: stats?.totalUsers ?? 0, color: '#C4B5FD', to: null },
                { icon: faMoneyBillWave, label: 'Revenue', value: `₹${stats?.totalRevenue ?? 0}`, color: '#00E5FF', isRevenue: true, to: '/admintransactions' },
              ].map((item, idx) => (
                <div key={idx} className="col-sm-6 col-xl-2">
                  <div
                    onClick={() => item.to && navigate(item.to)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.72) 0%, rgba(10, 4, 20, 0.88) 100%)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(0, 229, 255, 0.18)',
                      borderRadius: '18px', padding: '1.25rem',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                      cursor: item.to ? 'pointer' : 'default',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (item.to) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.to) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.18)';
                      }
                    }}
                  >
                    <div style={{ color: '#8E7BB0', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span><FontAwesomeIcon icon={item.icon} className="me-1" style={{ color: item.color }} /> {item.label}</span>
                      {item.to && <span style={{ fontSize: '0.7rem', color: '#00E5FF', opacity: 0.8 }}>View &rarr;</span>}
                    </div>
                    <div style={{
                      fontSize: item.isRevenue ? '1.5rem' : '1.85rem',
                      fontWeight: 900,
                      color: item.isRevenue ? '#00E5FF' : '#FFFFFF',
                      textShadow: item.isRevenue ? '0 0 12px rgba(0, 229, 255, 0.5)' : 'none'
                    }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Analytics Chart */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.78) 0%, rgba(8, 3, 18, 0.92) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 25px rgba(59, 10, 107, 0.3)',
              marginBottom: '2rem'
            }}>
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-white">
                <FontAwesomeIcon icon={faChartLine} style={{ color: '#00E5FF' }} />
                Revenue Analytics (Last 30 Days)
              </h5>

              {revenueData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8E7BB0', fontSize: '0.9rem' }}>
                  No revenue history recorded yet. Completed ticket bookings will reflect here.
                </div>
              ) : (
                <div className="d-flex align-items-end gap-3 pt-3 overflow-auto" style={{ height: 230 }}>
                  {revenueData.map((d, index) => {
                    const heightPercent = Math.max(12, Math.round((d.revenue / maxRevenue) * 100));
                    return (
                      <div
                        key={index}
                        className="d-flex flex-column align-items-center flex-grow-1"
                        style={{ minWidth: 42 }}
                      >
                        <span style={{ fontSize: '0.72rem', color: '#00E5FF', fontWeight: 800, marginBottom: '4px' }}>
                          ₹{d.revenue}
                        </span>
                        <div
                          style={{
                            height: `${heightPercent}%`,
                            width: '30px',
                            background: 'linear-gradient(180deg, #00E5FF 0%, #3B0A6B 100%)',
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 0.4s ease',
                            boxShadow: '0 0 12px rgba(0, 229, 255, 0.4)'
                          }}
                          title={`Date: ${d.date}\nRevenue: ₹${d.revenue}\nBookings: ${d.bookings}`}
                        />
                        <span style={{ color: '#8E7BB0', fontSize: '0.68rem', marginTop: '6px', fontFamily: 'monospace' }}>
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Bookings Table */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.78) 0%, rgba(8, 3, 18, 0.92) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-white mb-0">Recent Platform Reservations</h5>
                <button
                  onClick={() => navigate('/admintransactions')}
                  className="btn-outline-cyan btn-sm d-flex align-items-center gap-1"
                  style={{ borderRadius: '8px', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                >
                  <FontAwesomeIcon icon={faReceipt} /> All Transactions & Refunds
                </button>
              </div>

              {recentBookings.length === 0 ? (
                <p style={{ color: '#8E7BB0', margin: 0, fontSize: '0.9rem' }}>No reservations placed yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0" style={{ color: '#FFFFFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0, 229, 255, 0.2)', color: '#00E5FF', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <th>Booking ID</th>
                        <th>User Email</th>
                        <th>Theatre</th>
                        <th>Show Date</th>
                        <th>Seats</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b) => (
                        <tr key={b.bookingId} style={{ borderBottom: '1px solid rgba(0, 229, 255, 0.08)', fontSize: '0.9rem' }}>
                          <td className="font-monospace small" style={{ color: '#00E5FF', fontWeight: 700 }}>{b.bookingId.slice(0, 8)}...</td>
                          <td style={{ color: '#C4B5FD' }}>{b.userEmail}</td>
                          <td>{b.theatreName}</td>
                          <td style={{ color: '#8E7BB0' }}>{b.showDate}</td>
                          <td>
                            <span style={{
                              background: 'rgba(59, 10, 107, 0.6)',
                              border: '1px solid rgba(157, 78, 221, 0.4)',
                              color: '#E9D5FF',
                              borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.78rem'
                            }}>
                              {b.selectedSeats?.join(', ')}
                            </span>
                          </td>
                          <td style={{ color: '#00E5FF', fontWeight: 800 }}>₹{b.totalAmount}</td>
                          <td>
                            <span className={b.paymentStatus === 'Completed' ? 'status-confirmed' : 'status-pending'} style={{ fontSize: '0.75rem' }}>
                              {b.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
