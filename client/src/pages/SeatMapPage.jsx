/**
 * SeatMapPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Interactive Seat Map
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faBuilding, faCalendarAlt, faClock, faLock,
  faTimesCircle, faArrowLeft,
  faInfoCircle, faShieldAlt, faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../utils/api';

const SeatMapPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const userEmail = localStorage.getItem('imovies-email') || '';
  const userName = localStorage.getItem('imovies-username') || 'Customer';

  // 1. Initial Data Fetch & Socket.io Connection
  useEffect(() => {
    let isMounted = true;

    const fetchShowDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/shows/${showId}`);
        if (!isMounted) return;

        const showData = res.data.show;
        setShow(showData);
        setTickets(showData.tickets || {});

        // Fetch Movie Details
        if (showData.movieId) {
          try {
            const movieRes = await api.get(`/movie/${showData.movieId}`);
            if (isMounted) setMovie(movieRes.data.movie);
          } catch (e) {
            console.error('Failed to load movie details', e);
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load show details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchShowDetails();

    // Socket.io initialization
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-show', { showId });
    });

    socket.on('seat-status-update', (data) => {
      if (data.showId === showId && data.tickets) {
        setTickets(data.tickets);
      }
    });

    socket.on('seats-locked', ({ showId: sId, selectedSeats: lockedByOther, userEmail: locker }) => {
      if (sId === showId && locker !== userEmail) {
        setTickets((prev) => {
          const updated = { ...prev };
          lockedByOther.forEach((id) => {
            if (updated[id]) {
              updated[id] = { ...updated[id], status: 'locked', lockExpiry: Date.now() + 10 * 60 * 1000 };
            }
          });
          return updated;
        });
      }
    });

    socket.on('seats-released', ({ showId: sId, selectedSeats: released }) => {
      if (sId === showId) {
        setTickets((prev) => {
          const updated = { ...prev };
          released.forEach((id) => {
            if (updated[id] && updated[id].status !== 'booked') {
              updated[id] = { ...updated[id], status: 'available', lockExpiry: null };
            }
          });
          return updated;
        });
      }
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.emit('leave-show', { showId });
        socketRef.current.disconnect();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showId, userEmail]);

  // 2. Lock Countdown Timer
  useEffect(() => {
    if (lockTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setLockTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsLocked(false);
            setSelectedSeats([]);
            toast.warn('Seat lock expired! Seats have been released.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockTimeLeft]);

  // Group seats by tier
  const { balconySeats, middleSeats, lowerSeats } = useMemo(() => {
    const balcony = [];
    const middle = [];
    const lower = [];

    const now = Date.now();

    Object.keys(tickets).forEach((seatId) => {
      const seat = tickets[seatId];
      const isExpired = seat.status === 'locked' && seat.lockExpiry && seat.lockExpiry < now;
      const normalizedSeat = {
        ...seat,
        status: isExpired ? 'available' : seat.status,
      };

      if (seat.type === 'balcony') balcony.push(normalizedSeat);
      else if (seat.type === 'middle') middle.push(normalizedSeat);
      else lower.push(normalizedSeat);
    });

    const sortFn = (a, b) => a.seatId.localeCompare(b.seatId, undefined, { numeric: true });
    return {
      balconySeats: balcony.sort(sortFn),
      middleSeats: middle.sort(sortFn),
      lowerSeats: lower.sort(sortFn),
    };
  }, [tickets]);

  // Check if showtime has already concluded
  const isShowEnded = useMemo(() => {
    if (!show || !show.showDate || !show.showTime) return false;
    try {
      const parts = show.showTime.trim().split(' ');
      const timeParts = parts[0].split(':').map(Number);
      let hours = timeParts[0];
      const minutes = timeParts[1] || 0;
      const modifier = (parts[1] || '').toUpperCase();
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const [year, month, day] = show.showDate.split('-').map(Number);
      const showDateTime = new Date(year, month - 1, day, hours, minutes);
      return showDateTime.getTime() < Date.now() - 5 * 60 * 1000;
    } catch {
      return false;
    }
  }, [show]);

  // Handle seat click
  const toggleSeatSelection = (seatId) => {
    if (isShowEnded) {
      toast.error('This screening has already concluded. Booking is closed.');
      return;
    }

    if (isLocked) {
      toast.info('Seats are locked for checkout. Proceed to pay or cancel.');
      return;
    }

    const seat = tickets[seatId];
    if (!seat) return;

    if (seat.status === 'booked') {
      toast.error('This seat is already booked.');
      return;
    }

    const isLockedByOther = seat.status === 'locked' && seat.lockExpiry > Date.now() && seat.bookedBy !== userEmail;
    if (isLockedByOther) {
      toast.warning('This seat is currently held by another user.');
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        toast.warning('Maximum 8 seats per booking allowed.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Calculate Total
  const totalAmount = useMemo(() => {
    return selectedSeats.reduce((sum, seatId) => {
      const seat = tickets[seatId];
      return sum + (seat?.price || 0);
    }, 0);
  }, [selectedSeats, tickets]);

  // Release seats when payment fails or user dismisses Razorpay checkout
  const handleReleaseSeats = async () => {
    if (!selectedSeats || !selectedSeats.length) {
      setIsLocked(false);
      setLockTimeLeft(null);
      return;
    }

    try {
      await api.post('/bookings/release', {
        showId,
        selectedSeats,
      });
      if (socketRef.current) {
        socketRef.current.emit('release-seats', {
          showId,
          selectedSeats,
        });
      }
    } catch (err) {
      console.warn('Seat release notice:', err.message);
    } finally {
      setIsLocked(false);
      setLockTimeLeft(null);
      setSelectedSeats([]);
      setBookingInProgress(false);
    }
  };

  // Step 4 & 5: Verify Payment with HMAC SHA256 on Backend
  const handleVerifyPayment = async (verificationPayload) => {
    try {
      setBookingInProgress(true);
      const res = await api.post('/payment/verify', verificationPayload);

      if (res.data.success) {
        toast.success('🎉 Booking Confirmed! Payment verified successfully.');
        if (timerRef.current) clearInterval(timerRef.current);
        navigate('/bookings');
      } else {
        toast.error(res.data.message || 'Payment signature verification failed.');
        await handleReleaseSeats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed.');
      await handleReleaseSeats();
    } finally {
      setBookingInProgress(false);
    }
  };

  // Integrated Seat Locking & Razorpay Payment Flow
  const handleRazorpayPayment = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat to proceed.');
      return;
    }

    if (isShowEnded) {
      toast.error('This screening has already concluded. Booking is closed.');
      return;
    }

    try {
      setBookingInProgress(true);

      // 1. Automatically lock the selected seats upon clicking the payment button
      const lockRes = await api.post('/bookings/lock', {
        showId,
        selectedSeats,
      });

      if (!lockRes.data.success) {
        toast.error(lockRes.data.message || 'Failed to lock seats.');
        setBookingInProgress(false);
        return;
      }

      setIsLocked(true);
      setLockTimeLeft(10 * 60);
      if (socketRef.current) {
        socketRef.current.emit('lock-seats', {
          showId,
          selectedSeats,
          userEmail,
        });
      }

      // 2. Order creation happens EXCLUSIVELY on backend server (Node.js/Express)
      const orderRes = await api.post('/payment/create-order', {
        showId,
        selectedSeats,
        totalAmount,
      });

      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Failed to initialize payment order.');
        await handleReleaseSeats();
        return;
      }

      const { orderId, amount, currency, bookingId, keyId } = orderRes.data;

      // 3. Open standard Razorpay Checkout Modal (checkout.js) using ONLY the public Key ID
      if (typeof window.Razorpay === 'function') {
        const options = {
          key: keyId || 'rzp_test_TqwiKGkkhA5s8N',
          amount: amount, // in paise
          currency: currency || 'INR',
          name: 'iMovies Cinemas',
          description: `Ticket Booking: ${movie?.movieName || 'Movie'} (${selectedSeats.join(', ')})`,
          image: 'https://cdn-icons-png.flaticon.com/512/2809/2809590.png',
          order_id: orderId,
          handler: async function (response) {
            // Step 4: ONLY when Razorpay confirms the status, confirm the booking!
            await handleVerifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });
          },
          prefill: {
            name: userName,
            email: userEmail,
            contact: '9876543210',
          },
          notes: {
            bookingId,
            showId,
            seats: selectedSeats.join(', '),
          },
          theme: {
            color: '#00E5FF',
          },
          modal: {
            ondismiss: async function () {
              // Payment cancelled or popup closed: release locked seats!
              await handleReleaseSeats();
              toast.warn('Payment window closed. Your locked seats have been released.');
            },
          },
        };

        try {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', async function (resp) {
            toast.error(resp.error?.description || 'Payment authorization failed.');
            await handleReleaseSeats();
          });
          rzp.open();
        } catch (rzpOpenErr) {
          console.warn('Razorpay open error:', rzpOpenErr.message);
          toast.error('Unable to open Razorpay payment popup.');
          await handleReleaseSeats();
        }
      } else {
        toast.error('Razorpay payment script is loading. Please try again.');
        await handleReleaseSeats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initialization error.');
      await handleReleaseSeats();
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main className="container my-4 flex-grow-1">
        {/* Top Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.75) 0%, rgba(10, 4, 20, 0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '20px',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 25px rgba(59, 10, 107, 0.35)',
          marginBottom: '2rem'
        }} className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline-cyan btn-sm mb-2"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem', borderRadius: '8px' }}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back to Shows
            </button>
            <h2 className="text-white fw-bold mb-1 d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF' }} />
              {movie?.movieName || 'Movie Seat Booking'}
            </h2>
            <div className="d-flex flex-wrap gap-3 small" style={{ color: '#C4B5FD', marginTop: '0.35rem' }}>
              <span><FontAwesomeIcon icon={faBuilding} className="me-1" style={{ color: '#00E5FF' }} /> {show?.theatreName}</span>
              <span><FontAwesomeIcon icon={faCalendarAlt} className="me-1" style={{ color: '#00E5FF' }} /> {show?.showDate}</span>
              <span><FontAwesomeIcon icon={faClock} className="me-1" style={{ color: '#00E5FF' }} /> {show?.showTime}</span>
            </div>
          </div>

          {/* Seat Status Legend */}
          <div style={{
            background: 'rgba(8, 3, 16, 0.85)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            backdropFilter: 'blur(12px)',
            borderRadius: '14px',
            padding: '0.65rem 1.25rem'
          }} className="d-flex flex-wrap gap-3 align-items-center">
            <div className="d-flex align-items-center gap-2 small">
              <div style={{
                width: 18, height: 18,
                background: 'rgba(59, 10, 107, 0.45)',
                border: '1px solid rgba(157, 78, 221, 0.5)',
                borderRadius: 4
              }} />
              <span style={{ color: '#C4B5FD' }}>Available</span>
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <div style={{
                width: 18, height: 18,
                background: '#00E5FF',
                border: '1px solid #FFFFFF',
                borderRadius: 4,
                boxShadow: '0 0 8px #00E5FF'
              }} />
              <span style={{ color: '#FFFFFF', fontWeight: 700 }}>Selected</span>
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <div style={{
                width: 18, height: 18,
                background: '#FFB800',
                border: '1px solid #FFE082',
                borderRadius: 4,
                boxShadow: '0 0 8px #FFB800'
              }} />
              <span style={{ color: '#FFB800' }}>Locked</span>
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <div style={{
                width: 18, height: 18,
                background: 'rgba(45, 10, 35, 0.75)',
                border: '1px solid rgba(107, 23, 184, 0.4)',
                borderRadius: 4
              }} />
              <span style={{ color: '#8E7BB0' }}>Booked</span>
            </div>
          </div>
        </div>

        {/* Past Show Warning Banner */}
        {isShowEnded && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(59, 10, 107, 0.6) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #EF4444',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            color: '#FCA5A5',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(239, 68, 68, 0.3)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faTimesCircle} style={{ fontSize: '1.3rem', color: '#EF4444' }} />
              <div>
                <strong style={{ color: '#fff' }}>This screening has already concluded!</strong>
                <div style={{ fontSize: '0.85rem' }}>Showtime {show?.showTime} on {show?.showDate} has passed. Ticket reservations are closed.</div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/movieshows/${show?.movieId}`)}
              className="btn btn-outline-cyan btn-sm"
              style={{ borderRadius: '10px', whiteSpace: 'nowrap' }}
            >
              Pick Upcoming Screening
            </button>
          </div>
        )}

        {/* Lock Timer Alert Banner */}
        {isLocked && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2) 0%, rgba(59, 10, 107, 0.5) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 184, 0, 0.5)',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255, 184, 0, 0.3)'
          }} className="d-flex justify-content-between align-items-center mb-4">
            <div style={{ color: '#FFFFFF' }}>
              <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#FFB800' }} />
              <strong style={{ color: '#FFB800' }}>Seats are temporarily held for you!</strong> Complete payment within:
            </div>
            <div style={{
              fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace',
              color: '#00E5FF', textShadow: '0 0 10px rgba(0, 229, 255, 0.7)'
            }}>
              {Math.floor(lockTimeLeft / 60)}:
              {(lockTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Seat Map Area */}
          <div className="col-lg-8">
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 8, 36, 0.75) 0%, rgba(8, 3, 18, 0.92) 100%)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '24px',
              padding: '2.5rem 1.5rem',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 30px rgba(59, 10, 107, 0.4)',
              textAlign: 'center'
            }}>
              {/* Balcony Tier (Furthest from screen / Back rows) */}
              {balconySeats.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                    <span style={{
                      background: 'rgba(59, 10, 107, 0.55)',
                      border: '1px solid #9D4EDD',
                      color: '#E9D5FF',
                      borderRadius: '30px',
                      padding: '0.3rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)'
                    }}>
                      BALCONY — ₹{balconySeats[0]?.price}
                    </span>
                    <small style={{ color: '#8E7BB0', fontWeight: 600 }}>{balconySeats.length} seats</small>
                  </div>
                  <div style={{
                    background: 'rgba(5, 5, 5, 0.6)',
                    border: '1px solid rgba(0, 229, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }} className="d-flex flex-wrap justify-content-center gap-2">
                    {balconySeats.map((seat) => renderSeat(seat))}
                  </div>
                </div>
              )}

              {/* Middle Tier */}
              {middleSeats.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                    <span style={{
                      background: 'rgba(0, 229, 255, 0.15)',
                      border: '1px solid #00E5FF',
                      color: '#00E5FF',
                      borderRadius: '30px',
                      padding: '0.3rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)'
                    }}>
                      MIDDLE — ₹{middleSeats[0]?.price}
                    </span>
                    <small style={{ color: '#8E7BB0', fontWeight: 600 }}>{middleSeats.length} seats</small>
                  </div>
                  <div style={{
                    background: 'rgba(5, 5, 5, 0.6)',
                    border: '1px solid rgba(0, 229, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }} className="d-flex flex-wrap justify-content-center gap-2">
                    {middleSeats.map((seat) => renderSeat(seat))}
                  </div>
                </div>
              )}

              {/* Lower Tier (Nearest to screen / Front rows) */}
              {lowerSeats.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                    <span style={{
                      background: 'rgba(35, 12, 60, 0.6)',
                      border: '1px solid rgba(196, 181, 253, 0.4)',
                      color: '#C4B5FD',
                      borderRadius: '30px',
                      padding: '0.3rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(8px)'
                    }}>
                      LOWER — ₹{lowerSeats[0]?.price}
                    </span>
                    <small style={{ color: '#8E7BB0', fontWeight: 600 }}>{lowerSeats.length} seats</small>
                  </div>
                  <div style={{
                    background: 'rgba(5, 5, 5, 0.6)',
                    border: '1px solid rgba(0, 229, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }} className="d-flex flex-wrap justify-content-center gap-2">
                    {lowerSeats.map((seat) => renderSeat(seat))}
                  </div>
                </div>
              )}

              {/* Cinema Screen Visual - Placed correctly at the bottom facing the seats */}
              <div className="mt-5 pt-3 position-relative">
                <div className="cinema-screen-glow" />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  marginTop: '1rem',
                }}>
                  <span style={{
                    color: '#00E5FF',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    textShadow: '0 0 12px rgba(0, 229, 255, 0.65)'
                  }}>
                    ▲ All Eyes This Way — Cinema Screen ▲
                  </span>
                </div>
                {/* Luminous projection ambient cone */}
                <div style={{
                  height: '35px',
                  background: 'linear-gradient(0deg, rgba(0, 229, 255, 0.18) 0%, transparent 100%)',
                  borderRadius: '50% 50% 0 0',
                  margin: '0.5rem auto 0',
                  maxWidth: '75%',
                  filter: 'blur(6px)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="col-lg-4">
            <div style={{
              background: 'linear-gradient(135deg, rgba(22, 9, 42, 0.8) 0%, rgba(8, 3, 18, 0.94) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 229, 255, 0.22)',
              borderRadius: '24px',
              padding: '1.75rem',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 30px rgba(59, 10, 107, 0.4)',
              position: 'sticky',
              top: '5rem'
            }}>
              <h4 style={{
                color: '#fff',
                fontWeight: 900,
                borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
                paddingBottom: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00E5FF' }} />
                Booking Summary
              </h4>

              <div className="mb-3">
                <span style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600 }}>Selected Seats:</span>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map((id) => (
                      <span
                        key={id}
                        style={{
                          background: '#00E5FF',
                          color: '#050505',
                          fontWeight: 800,
                          borderRadius: '8px',
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.82rem',
                          boxShadow: '0 0 10px rgba(0, 229, 255, 0.6)'
                        }}
                      >
                        {id}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#8E7BB0', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Click seats above to select
                    </span>
                  )}
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="mb-3">
                  <span style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600 }}>Breakdown:</span>
                  <div className="mt-2 small">
                    {selectedSeats.map((id) => {
                      const s = tickets[id];
                      return (
                        <div
                          key={id}
                          className="d-flex justify-content-between py-1"
                          style={{ borderBottom: '1px solid rgba(0, 229, 255, 0.08)', color: '#C4B5FD' }}
                        >
                          <span>Seat {id} ({s?.type?.toUpperCase()})</span>
                          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>₹{s?.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr style={{ borderColor: 'rgba(0, 229, 255, 0.18)', margin: '1.25rem 0' }} />

              <div className="d-flex justify-content-between align-items-center fs-5 fw-bold mb-4">
                <span style={{ color: '#FFFFFF' }}>Total Amount</span>
                <span style={{
                  color: '#00E5FF',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  textShadow: '0 0 15px rgba(0, 229, 255, 0.5)'
                }}>
                  ₹{totalAmount}
                </span>
              </div>

              {/* Integrated Payment & Seat Lock Action */}
              <div className="d-flex flex-column gap-2">
                <button
                  onClick={handleRazorpayPayment}
                  disabled={selectedSeats.length === 0 || bookingInProgress || isShowEnded}
                  className="btn-primary-cyan w-100 py-3 fw-bold d-flex justify-content-center align-items-center gap-2"
                  style={{ borderRadius: '14px', fontSize: '1.02rem' }}
                >
                  <FontAwesomeIcon icon={faCreditCard} />
                  {bookingInProgress
                    ? 'Processing Payment...'
                    : isShowEnded
                    ? 'Screening Concluded'
                    : selectedSeats.length === 0
                    ? 'Select Seats to Proceed'
                    : `Pay ₹${totalAmount} with Razorpay`}
                </button>

                {selectedSeats.length > 0 && !bookingInProgress && (
                  <button
                    onClick={handleReleaseSeats}
                    className="btn-outline-cyan w-100 py-2 mt-1"
                    style={{ borderRadius: '10px', fontSize: '0.86rem' }}
                  >
                    Clear Selected Seats
                  </button>
                )}
              </div>

              {/* Razorpay Trust Badges */}
              <div style={{
                background: 'rgba(5, 5, 5, 0.55)',
                border: '1px solid rgba(0, 229, 255, 0.12)',
                borderRadius: '12px',
                padding: '0.75rem',
                marginTop: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#C4B5FD', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  <FontAwesomeIcon icon={faShieldAlt} className="me-1" style={{ color: '#00E5FF' }} />
                  Secured by Razorpay Payment Gateway
                </div>
                <div className="d-flex justify-content-center gap-2" style={{ color: '#8E7BB0', fontSize: '0.72rem' }}>
                  <span>UPI</span> • <span>Cards</span> • <span>NetBanking</span> • <span>Wallets</span>
                </div>
              </div>

              <div style={{ color: '#8E7BB0', fontSize: '0.78rem', textAlign: 'center', marginTop: '1rem' }}>
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" style={{ color: '#00E5FF' }} />
                Seats are locked automatically upon checkout and released if payment is cancelled or fails.
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );

  // Helper renderer for individual seat
  function renderSeat(seat) {
    const isSelected = selectedSeats.includes(seat.seatId);
    const isBooked = seat.status === 'booked';
    const isLockedOther = seat.status === 'locked' && seat.bookedBy !== userEmail;

    let bg = 'rgba(59, 10, 107, 0.45)';
    let border = '1px solid rgba(157, 78, 221, 0.45)';
    let color = '#E2D9F3';
    let cursor = 'pointer';
    let shadow = 'none';
    let title = `${seat.seatId} - ₹${seat.price} (${seat.type})`;

    if (isShowEnded) {
      bg = 'rgba(25, 25, 35, 0.5)';
      border = '1px solid rgba(255, 255, 255, 0.08)';
      color = 'rgba(255, 255, 255, 0.2)';
      cursor = 'not-allowed';
      title = `${seat.seatId} - Screening Concluded`;
    } else if (isBooked) {
      bg = 'rgba(45, 10, 35, 0.75)';
      border = '1px solid rgba(107, 23, 184, 0.3)';
      color = 'rgba(255, 255, 255, 0.3)';
      cursor = 'not-allowed';
      title = `${seat.seatId} - Already Booked`;
    } else if (isLockedOther) {
      bg = '#FFB800';
      border = '1px solid #FFE082';
      color = '#050505';
      cursor = 'not-allowed';
      shadow = '0 0 10px rgba(255, 184, 0, 0.6)';
      title = `${seat.seatId} - Locked by another user`;
    } else if (isSelected) {
      bg = '#00E5FF';
      border = '2px solid #FFFFFF';
      color = '#050505';
      shadow = '0 0 16px #00E5FF';
      title = `${seat.seatId} - Selected (₹${seat.price})`;
    }

    return (
      <button
        key={seat.seatId}
        type="button"
        title={title}
        disabled={isBooked || isLockedOther || isShowEnded}
        onClick={() => toggleSeatSelection(seat.seatId)}
        style={{
          width: '38px',
          height: '38px',
          background: bg,
          border: border,
          borderRadius: '8px',
          color: color,
          fontSize: '0.78rem',
          fontWeight: isSelected ? '800' : '600',
          cursor,
          transition: 'transform 0.15s ease, background 0.2s, box-shadow 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: shadow,
        }}
        onMouseEnter={(e) => {
          if (!isBooked && !isLockedOther && !isSelected && !isShowEnded) {
            e.currentTarget.style.transform = 'scale(1.2)';
            e.currentTarget.style.background = 'rgba(0, 229, 255, 0.3)';
            e.currentTarget.style.borderColor = '#00E5FF';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 229, 255, 0.7)';
            e.currentTarget.style.color = '#FFFFFF';
          }
        }}
        onMouseLeave={(e) => {
          if (!isBooked && !isLockedOther && !isSelected && !isShowEnded) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = bg;
            e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.45)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.color = color;
          }
        }}
      >
        {seat.seatId}
      </button>
    );
  }
};

export default SeatMapPage;
