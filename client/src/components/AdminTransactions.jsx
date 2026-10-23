/**
 * AdminTransactions.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Comprehensive Transactions & Razorpay Refund Management Panel
 */
import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faSearch, faFilter, faSyncAlt,
  faUndo, faCheckCircle, faTimesCircle, faClock,
  faShieldAlt, faExclamationTriangle, faReceipt,
  faTicketAlt, faCreditCard, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Loader from './Loader';
import api from '../utils/api';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Refund modal state
  const [selectedTx, setSelectedTx] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/transactions');
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch transaction records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (tx.bookingId && tx.bookingId.toLowerCase().includes(q)) ||
        (tx.razorpayPaymentId && tx.razorpayPaymentId.toLowerCase().includes(q)) ||
        (tx.razorpayOrderId && tx.razorpayOrderId.toLowerCase().includes(q)) ||
        (tx.userEmail && tx.userEmail.toLowerCase().includes(q)) ||
        (tx.movieName && tx.movieName.toLowerCase().includes(q)) ||
        (tx.theatreName && tx.theatreName.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || tx.paymentStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [transactions, search, statusFilter]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const total = transactions.length;
    const completed = transactions.filter((t) => t.paymentStatus === 'Completed');
    const refunded = transactions.filter((t) => t.paymentStatus === 'Refunded');
    const pending = transactions.filter((t) => t.paymentStatus === 'Pending');

    const totalRevenue = completed.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalRefundedAmount = refunded.reduce((sum, t) => sum + (t.refundAmount || t.totalAmount || 0), 0);

    return {
      total,
      completedCount: completed.length,
      refundedCount: refunded.length,
      pendingCount: pending.length,
      totalRevenue,
      totalRefundedAmount,
    };
  }, [transactions]);

  // Open refund confirmation modal
  const handleOpenRefundModal = (tx) => {
    setSelectedTx(tx);
    setShowRefundModal(true);
  };

  // Close modal
  const handleCloseRefundModal = () => {
    if (refunding) return;
    setSelectedTx(null);
    setShowRefundModal(false);
  };

  // Execute Razorpay refund
  const handleProcessRefund = async () => {
    if (!selectedTx) return;

    const identifier = selectedTx.razorpayPaymentId || selectedTx.bookingId;
    if (!identifier) {
      toast.error('No payment reference found to issue refund.');
      return;
    }

    try {
      setRefunding(true);
      const res = await api.post(`/admin/refund/${identifier}`);

      if (res.data.success) {
        toast.success(res.data.message || 'Refund successfully issued via Razorpay!');
        handleCloseRefundModal();
        await fetchTransactions();
      } else {
        toast.error(res.data.message || 'Refund request could not be processed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing refund via Razorpay.');
    } finally {
      setRefunding(false);
    }
  };

  // Status badge styling
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            color: '#10B981',
            borderRadius: '20px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
          }}>
            <FontAwesomeIcon icon={faCheckCircle} /> Completed
          </span>
        );
      case 'Refunded':
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            borderRadius: '20px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)'
          }}>
            <FontAwesomeIcon icon={faUndo} /> Refunded
          </span>
        );
      case 'Cancelled':
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            borderRadius: '20px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <FontAwesomeIcon icon={faTimesCircle} /> Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #F59E0B',
            color: '#F59E0B',
            borderRadius: '20px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <FontAwesomeIcon icon={faClock} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="w-100">
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid rgba(0, 229, 255, 0.18)'
      }}>
        <div>
          <h2 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: '#00E5FF' }} />
            Transactions & Refund Management
          </h2>
          <p style={{ color: '#C4B5FD', margin: 0, fontSize: '0.88rem' }}>
            Live Razorpay payment gateway audit trail, status tracking, and automated refund dispatcher
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="btn-outline-cyan btn-sm d-flex align-items-center gap-2"
          style={{ borderRadius: '10px', padding: '0.5rem 1rem' }}
        >
          <FontAwesomeIcon icon={faSyncAlt} spin={loading} /> Refresh Transactions
        </button>
      </div>

      {/* Aggregate Metric Tiles */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div style={{
            background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.72) 0%, rgba(10, 4, 20, 0.88) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 229, 255, 0.18)',
            borderRadius: '18px',
            padding: '1.25rem',
            boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
          }}>
            <div style={{ color: '#8E7BB0', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <FontAwesomeIcon icon={faReceipt} className="me-1" style={{ color: '#00E5FF' }} /> Total Transactions
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF' }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div style={{
            background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.72) 0%, rgba(10, 4, 20, 0.88) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '18px',
            padding: '1.25rem',
            boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
          }}>
            <div style={{ color: '#8E7BB0', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <FontAwesomeIcon icon={faCheckCircle} className="me-1" style={{ color: '#10B981' }} /> Settled Net Revenue
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10B981', textShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}>
              ₹{stats.totalRevenue}
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div style={{
            background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.72) 0%, rgba(10, 4, 20, 0.88) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '18px',
            padding: '1.25rem',
            boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
          }}>
            <div style={{ color: '#8E7BB0', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <FontAwesomeIcon icon={faUndo} className="me-1" style={{ color: '#EF4444' }} /> Total Refunded Volume
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#EF4444', textShadow: '0 0 12px rgba(239, 68, 68, 0.4)' }}>
              ₹{stats.totalRefundedAmount}
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div style={{
            background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.72) 0%, rgba(10, 4, 20, 0.88) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 229, 255, 0.18)',
            borderRadius: '18px',
            padding: '1.25rem',
            boxShadow: '0 8px 25px rgba(0,0,0,0.6)'
          }}>
            <div style={{ color: '#8E7BB0', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <FontAwesomeIcon icon={faClock} className="me-1" style={{ color: '#F59E0B' }} /> Pending Checkouts
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#F59E0B' }}>
              {stats.pendingCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 8, 36, 0.78) 0%, rgba(8, 3, 18, 0.92) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 229, 255, 0.18)',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
      }}>
        <div className="row g-3">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text" style={{
                background: 'rgba(5, 5, 5, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRight: 'none',
                color: '#00E5FF'
              }}>
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Payment ID, Order ID, Booking ID, User Email, or Movie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: 'rgba(5, 5, 5, 0.8)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  borderLeft: 'none',
                  color: '#FFFFFF'
                }}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text" style={{
                background: 'rgba(5, 5, 5, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRight: 'none',
                color: '#00E5FF'
              }}>
                <FontAwesomeIcon icon={faFilter} />
              </span>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'rgba(5, 5, 5, 0.8)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  borderLeft: 'none',
                  color: '#FFFFFF'
                }}
              >
                <option value="ALL">All Statuses ({transactions.length})</option>
                <option value="Completed">Completed ({stats.completedCount})</option>
                <option value="Refunded">Refunded ({stats.refundedCount})</option>
                <option value="Pending">Pending ({stats.pendingCount})</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transactions Data Table */}
      {loading ? (
        <Loader />
      ) : filteredTransactions.length === 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 8, 36, 0.6) 0%, rgba(8, 3, 18, 0.85) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <FontAwesomeIcon icon={faCreditCard} size="3x" style={{ color: '#8E7BB0', marginBottom: '1rem', opacity: 0.6 }} />
          <h5 className="text-white fw-bold">No Transaction Records Found</h5>
          <p style={{ color: '#8E7BB0', fontSize: '0.88rem', margin: 0 }}>
            {search || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or status filter.'
              : 'User payments and booking transactions will automatically record here.'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 8, 36, 0.78) 0%, rgba(8, 3, 18, 0.94) 100%)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 30px rgba(59, 10, 107, 0.4)'
        }}>
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ color: '#FFFFFF' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid rgba(0, 229, 255, 0.22)',
                  color: '#00E5FF',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  <th>Booking ID</th>
                  <th>Razorpay Payment ID</th>
                  <th>Customer Email</th>
                  <th>Movie & Theatre</th>
                  <th>Showtime</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isCompleted = tx.paymentStatus === 'Completed';
                  const isRefunded = tx.paymentStatus === 'Refunded';
                  const canRefund = isCompleted;

                  return (
                    <tr
                      key={tx._id || tx.bookingId}
                      style={{
                        borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
                        fontSize: '0.88rem'
                      }}
                    >
                      {/* Booking ID */}
                      <td>
                        <span className="font-monospace" style={{ color: '#00E5FF', fontWeight: 800 }}>
                          {tx.bookingId ? tx.bookingId.slice(0, 10) : 'N/A'}...
                        </span>
                        {tx.razorpayOrderId && (
                          <div style={{ color: '#8E7BB0', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                            Ord: {tx.razorpayOrderId.slice(0, 12)}...
                          </div>
                        )}
                      </td>

                      {/* Razorpay Payment ID */}
                      <td>
                        {tx.razorpayPaymentId ? (
                          <span
                            className="font-monospace"
                            style={{
                              background: 'rgba(59, 10, 107, 0.5)',
                              border: '1px solid rgba(0, 229, 255, 0.3)',
                              color: '#E9D5FF',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.78rem'
                            }}
                          >
                            {tx.razorpayPaymentId}
                          </span>
                        ) : (
                          <span style={{ color: '#8E7BB0', fontStyle: 'italic', fontSize: '0.78rem' }}>
                            Unpaid
                          </span>
                        )}

                        {isRefunded && tx.refundId && (
                          <div style={{ color: '#EF4444', fontSize: '0.72rem', fontFamily: 'monospace', marginTop: '3px' }}>
                            Ref: {tx.refundId}
                          </div>
                        )}
                      </td>

                      {/* Customer Email */}
                      <td>
                        <div style={{ color: '#C4B5FD', fontWeight: 600 }}>{tx.userEmail}</div>
                      </td>

                      {/* Movie & Theatre */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{tx.movieName || 'Movie Screening'}</div>
                        <div style={{ color: '#8E7BB0', fontSize: '0.78rem' }}>{tx.theatreName}</div>
                      </td>

                      {/* Showtime */}
                      <td style={{ color: '#C4B5FD', fontSize: '0.82rem' }}>
                        <div>{tx.showDate}</div>
                        <div style={{ color: '#8E7BB0', fontSize: '0.75rem' }}>{tx.showTime}</div>
                      </td>

                      {/* Seats */}
                      <td>
                        <span style={{
                          background: 'rgba(0, 229, 255, 0.12)',
                          border: '1px solid rgba(0, 229, 255, 0.4)',
                          color: '#00E5FF',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          {tx.selectedSeats?.join(', ') || 'N/A'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span style={{
                          color: isRefunded ? '#EF4444' : '#00E5FF',
                          fontWeight: 900,
                          fontSize: '0.95rem'
                        }}>
                          ₹{tx.totalAmount}
                        </span>
                        {isRefunded && tx.refundAmount && (
                          <div style={{ color: '#EF4444', fontSize: '0.7rem' }}>
                            -₹{tx.refundAmount} (Reversed)
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td style={{ color: '#8E7BB0', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                      </td>

                      {/* Status */}
                      <td>{renderStatusBadge(tx.paymentStatus)}</td>

                      {/* Action */}
                      <td className="text-end">
                        {canRefund ? (
                          <button
                            onClick={() => handleOpenRefundModal(tx)}
                            className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                            style={{
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              borderColor: 'rgba(239, 68, 68, 0.6)',
                              padding: '0.35rem 0.75rem'
                            }}
                            title="Issue online refund via Razorpay and cancel booking"
                          >
                            <FontAwesomeIcon icon={faUndo} /> Issue Refund / Cancel
                          </button>
                        ) : isRefunded ? (
                          <span style={{ color: '#EF4444', fontSize: '0.78rem', fontWeight: 600 }}>
                            <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Refund Processed
                          </span>
                        ) : (
                          <span style={{ color: '#8E7BB0', fontSize: '0.78rem', fontStyle: 'italic' }}>
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Razorpay Refund */}
      {showRefundModal && selectedTx && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(28, 10, 48, 0.95) 0%, rgba(12, 4, 24, 0.98) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '24px',
            maxWidth: '540px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.25)',
            color: '#FFFFFF'
          }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div>
                <h4 className="fw-bold mb-1 text-white">Confirm Razorpay Refund</h4>
                <p style={{ color: '#C4B5FD', fontSize: '0.82rem', margin: 0 }}>
                  This action connects to Razorpay payment servers to reverse the transaction.
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(5, 5, 5, 0.7)',
              border: '1px solid rgba(0, 229, 255, 0.15)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <div className="d-flex justify-content-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8E7BB0' }}>Booking ID:</span>
                <span className="font-monospace" style={{ color: '#00E5FF', fontWeight: 700 }}>
                  {selectedTx.bookingId}
                </span>
              </div>
              <div className="d-flex justify-content-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8E7BB0' }}>Razorpay Payment ID:</span>
                <span className="font-monospace" style={{ color: '#E9D5FF' }}>
                  {selectedTx.razorpayPaymentId || 'N/A'}
                </span>
              </div>
              <div className="d-flex justify-content-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8E7BB0' }}>Customer Email:</span>
                <span style={{ color: '#FFFFFF' }}>{selectedTx.userEmail}</span>
              </div>
              <div className="d-flex justify-content-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8E7BB0' }}>Movie & Show:</span>
                <span style={{ color: '#FFFFFF' }}>{selectedTx.movieName} ({selectedTx.showDate} {selectedTx.showTime})</span>
              </div>
              <div className="d-flex justify-content-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8E7BB0' }}>Seats to Free:</span>
                <span style={{ color: '#00E5FF', fontWeight: 800 }}>
                  {selectedTx.selectedSeats?.join(', ')}
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 mt-1">
                <span className="fw-bold text-white">Refund Amount:</span>
                <span style={{ color: '#EF4444', fontWeight: 900, fontSize: '1.2rem' }}>
                  ₹{selectedTx.totalAmount}
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              color: '#FCA5A5',
              fontSize: '0.8rem',
              marginBottom: '1.75rem'
            }}>
              <strong>Notice:</strong> The full amount will be refunded directly to the customer's original payment method via Razorpay. The booking status will be updated to <em>Refunded</em>, and the reserved seats will be instantly released back to available status across the system.
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={handleCloseRefundModal}
                disabled={refunding}
                className="btn btn-outline-secondary"
                style={{ borderRadius: '12px', color: '#C4B5FD', padding: '0.6rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={refunding}
                className="btn btn-danger fw-bold d-flex align-items-center gap-2"
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  border: 'none',
                  padding: '0.6rem 1.5rem',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)'
                }}
              >
                {refunding ? (
                  <>
                    <FontAwesomeIcon icon={faSyncAlt} spin /> Processing Refund...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUndo} /> Confirm & Issue Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;