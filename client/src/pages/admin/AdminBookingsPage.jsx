/**
 * AdminBookingsPage.jsx - Admin page to view and moderate all platform reservations
 * Features:
 *  - Overview table of all bookings
 *  - Search by user email, bookingId, or theatre
 *  - Filter by status (Completed, Pending, Cancelled)
 *  - Moderation controls (e.g. cancel booking)
 */
import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt, faSearch, faFilter, faTimesCircle,
  faCheckCircle, faClock, faSyncAlt, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/AdminSidebar';
import Loader from '../../components/Loader';
import api from '../../utils/api';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await api.put(`/bookings/cancel/${bookingId}`);
      if (res.data.success) {
        toast.success('Booking cancelled successfully.');
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.bookingId.toLowerCase().includes(search.toLowerCase()) ||
        b.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        (b.theatreName && b.theatreName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || b.paymentStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  const totalRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.paymentStatus === 'Completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [bookings]);

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />

      <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: '100vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
          <div>
            <h2 className="text-white fw-bold mb-1">
              <FontAwesomeIcon icon={faTicketAlt} className="text-primary me-2" />
              Platform Bookings Management
            </h2>
            <p className="text-secondary small mb-0">Monitor, search, and moderate user reservations across all theatres</p>
          </div>
          <button
            onClick={fetchBookings}
            className="btn btn-outline-secondary btn-sm text-white d-flex align-items-center gap-2"
          >
            <FontAwesomeIcon icon={faSyncAlt} /> Refresh
          </button>
        </div>

        {/* Top Summary Stats */}
        <div className="row g-3 mb-4">
          <div className="col-sm-4">
            <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 p-3 shadow-sm">
              <div className="text-secondary small mb-1">Total Reservations</div>
              <div className="fs-3 fw-bold">{bookings.length}</div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 p-3 shadow-sm">
              <div className="text-secondary small mb-1">Completed Payments</div>
              <div className="fs-3 fw-bold text-success">
                {bookings.filter((b) => b.paymentStatus === 'Completed').length}
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 p-3 shadow-sm">
              <div className="text-secondary small mb-1">Total Platform Revenue</div>
              <div className="fs-3 fw-bold text-danger">₹{totalRevenue}</div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow-sm p-3 mb-4">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-black text-secondary border-secondary border-opacity-50">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  placeholder="Search by User Email, Booking ID, or Theatre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control bg-black text-white border-secondary border-opacity-50"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-black text-secondary border-secondary border-opacity-50">
                  <FontAwesomeIcon icon={faFilter} />
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select bg-black text-white border-secondary border-opacity-50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <Loader />
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-5 bg-dark rounded-4 border border-secondary border-opacity-25">
            <FontAwesomeIcon icon={faTicketAlt} size="3x" className="text-secondary opacity-50 mb-3" />
            <h5 className="text-white">No Bookings Found</h5>
            <p className="text-secondary small">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="card bg-dark text-white border-secondary border-opacity-25 rounded-4 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr className="border-secondary border-opacity-25 text-secondary small text-uppercase">
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Theatre</th>
                    <th>Show Date & Time</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.bookingId} className="border-secondary border-opacity-10">
                      <td className="font-monospace text-info small">{b.bookingId.slice(0, 10)}...</td>
                      <td className="small">{b.userEmail}</td>
                      <td>{b.theatreName}</td>
                      <td className="small">
                        <div>{b.showDate}</div>
                        <div className="text-secondary">{b.showTime}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{b.selectedSeats?.join(', ')}</span>
                      </td>
                      <td className="fw-bold text-success">₹{b.totalAmount}</td>
                      <td>
                        <span
                          className={`badge ${
                            b.paymentStatus === 'Completed'
                              ? 'bg-success'
                              : b.paymentStatus === 'Cancelled'
                              ? 'bg-danger'
                              : 'bg-warning text-dark'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="text-end">
                        {b.paymentStatus !== 'Cancelled' ? (
                          <button
                            onClick={() => handleCancelBooking(b.bookingId)}
                            disabled={cancellingId === b.bookingId}
                            className="btn btn-outline-danger btn-sm"
                            title="Cancel & Release Seats"
                          >
                            <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                            {cancellingId === b.bookingId ? 'Cancelling...' : 'Cancel'}
                          </button>
                        ) : (
                          <span className="text-secondary small fst-italic">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingsPage;
