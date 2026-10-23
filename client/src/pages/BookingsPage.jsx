/**
 * BookingsPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Digital Ticket History & Printable E-Pass
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt, faCalendarAlt, faClock, faBuilding,
  faPrint, faTimesCircle, faFilm, faCheckCircle,
  faExclamationTriangle, faQrcode, faReceipt
} from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/user');
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

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your seats.')) {
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

  const handlePrint = () => {
    window.print();
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
              <FontAwesomeIcon icon={faTicketAlt} style={{ color: '#00E5FF' }} />
              My Bookings
            </h2>
            <p style={{ color: '#C4B5FD', margin: 0, fontSize: '0.9rem' }}>
              View your ticket passes and download digital cinema credentials
            </p>
          </div>
          <Link to="/home" className="btn-outline-cyan btn-sm" style={{ padding: '0.55rem 1.25rem', borderRadius: '10px' }}>
            Book Another Movie
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : bookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.6) 0%, rgba(10, 4, 20, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px', border: '1px solid rgba(0, 229, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            <FontAwesomeIcon icon={faTicketAlt} style={{ fontSize: '3.5rem', color: '#00E5FF', opacity: 0.5, marginBottom: '1.25rem' }} />
            <h4 className="text-white fw-bold mb-2">No Bookings Found</h4>
            <p style={{ color: '#C4B5FD', maxWidth: '420px', margin: '0 auto 1.75rem' }}>
              You haven't reserved any movie tickets yet. Explore current releases and select your seats.
            </p>
            <Link to="/home" className="btn-primary-cyan px-4 py-2" style={{ borderRadius: '12px' }}>
              Browse Movies Now
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const isCompleted = b.paymentStatus === 'Completed';
              const isCancelled = b.paymentStatus === 'Cancelled';
              const isPending = b.paymentStatus === 'Pending';

              return (
                <div key={b.bookingId} className="col-lg-6">
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.78) 0%, rgba(8, 3, 18, 0.92) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(0, 229, 255, 0.18)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(59, 10, 107, 0.3)',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Header Strip */}
                    <div style={{
                      background: 'rgba(5, 5, 5, 0.65)',
                      borderBottom: '1px solid rgba(0, 229, 255, 0.12)',
                      padding: '0.85rem 1.5rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span className="font-monospace small" style={{ color: '#8E7BB0' }}>
                        REF: <span style={{ color: '#00E5FF', fontWeight: 700 }}>{b.bookingId.slice(0, 8)}...</span>
                      </span>
                      <span className={
                        isCompleted ? 'status-confirmed' : isCancelled ? 'status-cancelled' : 'status-pending'
                      }>
                        {b.paymentStatus}
                      </span>
                    </div>

                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF' }} />
                        {b.theatreName ? `${b.theatreName}` : 'Cinema Booking'}
                      </h4>

                      <div className="row g-2 mb-3 small" style={{ color: '#C4B5FD' }}>
                        <div className="col-6">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2" style={{ color: '#00E5FF' }} />
                          <span>{b.showDate}</span>
                        </div>
                        <div className="col-6">
                          <FontAwesomeIcon icon={faClock} className="me-2" style={{ color: '#00E5FF' }} />
                          <span>{b.showTime}</span>
                        </div>
                        <div className="col-12 mt-2">
                          <FontAwesomeIcon icon={faBuilding} className="me-2" style={{ color: '#00E5FF' }} />
                          <span>{b.theatreName}</span>
                        </div>
                      </div>

                      {/* Seats & Paid Area */}
                      <div style={{
                        background: 'rgba(5, 5, 5, 0.55)',
                        border: '1px solid rgba(0, 229, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ color: '#8E7BB0', fontSize: '0.85rem' }}>Seats:</span>
                          <span className="fw-bold text-white font-monospace">{b.selectedSeats?.join(', ')}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span style={{ color: '#8E7BB0', fontSize: '0.85rem' }}>Total Amount:</span>
                          <span style={{ color: '#00E5FF', fontSize: '1.25rem', fontWeight: 900 }}>₹{b.totalAmount}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                        {isCompleted && (
                          <button
                            onClick={() => setSelectedTicket(b)}
                            className="btn-outline-cyan btn-sm"
                            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', borderRadius: '10px' }}
                          >
                            <FontAwesomeIcon icon={faQrcode} className="me-2" />
                            Digital Pass
                          </button>
                        )}

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancel(b.bookingId)}
                            disabled={cancellingId === b.bookingId}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#F87171',
                              borderRadius: '10px',
                              padding: '0.45rem 1rem',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                            {cancellingId === b.bookingId ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Digital Ticket Modal */}
        {selectedTicket && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ background: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(16px)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div style={{
                background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.95) 0%, rgba(5, 5, 5, 0.98) 100%)',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                borderRadius: '24px',
                boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(0, 229, 255, 0.35)',
                overflow: 'hidden'
              }} className="modal-content text-white">
                <div style={{
                  background: 'rgba(5, 5, 5, 0.65)',
                  borderBottom: '1px solid rgba(0, 229, 255, 0.18)',
                  padding: '1.25rem 1.75rem'
                }} className="modal-header">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: '#00E5FF' }}>
                    <FontAwesomeIcon icon={faTicketAlt} />
                    iMovies Digital Pass
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedTicket(null)}
                  />
                </div>

                <div className="modal-body p-4 text-center print-area">
                  <div
                    style={{
                      border: '2px dashed rgba(0, 229, 255, 0.5)',
                      borderRadius: '20px',
                      padding: '24px',
                      background: 'rgba(10, 4, 20, 0.85)',
                      backdropFilter: 'blur(12px)'
                    }}
                  >
                    <h3 className="fw-bold text-white mb-1">{selectedTicket.theatreName}</h3>
                    <p style={{ color: '#00E5FF', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                      CINEMA ADMISSION PASS
                    </p>

                    <div style={{
                      background: 'rgba(5, 5, 5, 0.75)',
                      border: '1px solid rgba(0, 229, 255, 0.15)',
                      borderRadius: '14px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }} className="row g-2 text-start small">
                      <div className="col-6" style={{ color: '#8E7BB0' }}>Date:</div>
                      <div className="col-6 fw-bold text-white">{selectedTicket.showDate}</div>

                      <div className="col-6" style={{ color: '#8E7BB0' }}>Time:</div>
                      <div className="col-6 fw-bold text-white">{selectedTicket.showTime}</div>

                      <div className="col-6" style={{ color: '#8E7BB0' }}>Seats:</div>
                      <div className="col-6 fw-bold" style={{ color: '#00E5FF' }}>
                        {selectedTicket.selectedSeats?.join(', ')}
                      </div>

                      <div className="col-6" style={{ color: '#8E7BB0' }}>Total Paid:</div>
                      <div className="col-6 fw-bold text-white">₹{selectedTicket.totalAmount}</div>

                      <div className="col-6" style={{ color: '#8E7BB0' }}>Booking Ref:</div>
                      <div className="col-6 font-monospace" style={{ color: '#00E5FF', fontSize: '0.78rem' }}>
                        {selectedTicket.bookingId}
                      </div>
                    </div>

                    {/* QR Code Graphic */}
                    <div className="my-3 d-flex flex-column align-items-center">
                      <FontAwesomeIcon icon={faQrcode} size="4x" style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.6))' }} />
                      <span className="font-monospace small mt-2" style={{ color: '#C4B5FD', letterSpacing: '0.1em' }}>
                        SCAN AT ENTRANCE
                      </span>
                    </div>

                    <div style={{ color: '#8E7BB0', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                      Please arrive 15 minutes prior to showtime. Non-transferable ticket pass.
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(5, 5, 5, 0.65)',
                  borderTop: '1px solid rgba(0, 229, 255, 0.18)',
                  padding: '1rem 1.75rem',
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-white btn-sm"
                    onClick={() => setSelectedTicket(null)}
                    style={{ borderRadius: '10px' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-primary-cyan btn-sm px-4"
                    onClick={handlePrint}
                    style={{ borderRadius: '10px' }}
                  >
                    <FontAwesomeIcon icon={faPrint} className="me-2" />
                    Print Ticket Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BookingsPage;
