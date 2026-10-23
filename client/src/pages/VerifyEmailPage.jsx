/**
 * VerifyEmailPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Account Verification Window with 6-Digit OTP & Direct Link Support
 */
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faSpinner, faFilm, faKey,
  faEnvelope, faPaperPlane, faArrowLeft, faShieldAlt, faRedo
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  // Mode: 'token' (auto verification via email link) or 'otp' (interactive OTP entry window)
  const [mode, setMode] = useState(tokenParam ? 'token' : 'otp');
  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState(tokenParam ? 'loading' : 'idle'); // 'loading' | 'success' | 'error' | 'idle'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  // Auto-verify if ?token=... is present in the URL
  useEffect(() => {
    if (tokenParam) {
      setMode('token');
      setStatus('loading');

      const verifyToken = async () => {
        try {
          const res = await api.get(`/auth/verify-email?token=${tokenParam}`);
          if (res.data.success) {
            setStatus('success');
            setMessage(res.data.message || 'Email verified successfully!');
            if (res.data.token) {
              localStorage.setItem('imovies-token', res.data.token);
              if (res.data.user) {
                localStorage.setItem('imovies-username', res.data.user.username);
                localStorage.setItem('imovies-email', res.data.user.email);
              }
            }
          } else {
            setStatus('error');
            setMessage(res.data.message || 'Failed to verify email.');
          }
        } catch (err) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Invalid or expired verification token.');
        }
      };

      verifyToken();
    }
  }, [tokenParam]);

  // Handle countdown timer for Resend OTP button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric input
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1); // Take last char if multiple typed
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation (Backspace, Left, Right)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 6-digit OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);

    // Focus last filled box
    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits of your verification OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });

      if (res.data.success) {
        setStatus('success');
        setMessage(res.data.message || 'Account activated successfully!');
        toast.success('🎉 Account verified! Welcome to iMovies.');

        if (res.data.token) {
          localStorage.setItem('imovies-token', res.data.token);
          if (res.data.user) {
            localStorage.setItem('imovies-username', res.data.user.username);
            localStorage.setItem('imovies-email', res.data.user.email);
          }
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Request new OTP & verification email
  const handleResendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter your account email to resend OTP.');
      return;
    }
    if (resendCooldown > 0) return;

    try {
      setResending(true);
      const res = await api.post('/auth/resend-verification', {
        email: email.trim().toLowerCase(),
      });

      if (res.data.success) {
        toast.success(res.data.message || 'A fresh 6-digit OTP has been sent to your email.');
        setResendCooldown(60); // 60s cooldown
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#050505',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(59, 10, 107, 0.65) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(0, 229, 255, 0.22) 0%, transparent 55%),
          #050505
        `,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 500,
          width: '100%',
          background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.85) 0%, rgba(10, 4, 20, 0.95) 100%)',
          backdropFilter: 'blur(24px) saturate(190%)',
          border: '1px solid rgba(0, 229, 255, 0.28)',
          borderRadius: '26px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.85), 0 0 35px rgba(59, 10, 107, 0.45)',
          padding: '2.5rem 2.25rem',
          textAlign: 'center',
        }}
      >
        {/* Brand Logo */}
        <div className="mb-4">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.65rem',
              fontSize: '1.9rem', fontWeight: 900, color: '#fff'
            }}>
              <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.6))' }} />
              <span>
                <span style={{ color: '#00E5FF' }}>i</span>
                <span style={{
                  background: 'linear-gradient(135deg, #FFFFFF, #C4B5FD)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Movies</span>
              </span>
            </div>
          </Link>
        </div>

        {/* ── State 1: Verification in Progress (Token from link) ── */}
        {status === 'loading' && (
          <div className="py-4">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" style={{ color: '#00E5FF' }} className="mb-3" />
            <h4 className="fw-bold text-white mb-2">Validating Account Link</h4>
            <p style={{ color: '#C4B5FD', fontSize: '0.92rem' }}>Please wait a moment while we verify your credentials...</p>
          </div>
        )}

        {/* ── State 2: Verification Successful ── */}
        {status === 'success' && (
          <div className="py-3">
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.15)', border: '2px solid #00E5FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem auto', boxShadow: '0 0 25px rgba(0, 229, 255, 0.5)'
            }}>
              <FontAwesomeIcon icon={faCheckCircle} size="3x" style={{ color: '#00E5FF' }} />
            </div>
            <h3 className="fw-bold text-white mb-2">Account Verified! 🎉</h3>
            <p style={{ color: '#C4B5FD', fontSize: '0.92rem', marginBottom: '2rem' }}>
              {message || 'Your email address has been verified successfully. You can now book tickets and enjoy cinema blockbusters!'}
            </p>
            <div className="d-flex flex-column gap-2">
              <button
                onClick={() => navigate('/home')}
                className="btn-primary-cyan w-100 py-3 fw-bold"
                style={{ borderRadius: '14px', fontSize: '1rem' }}
              >
                Go to Movies Dashboard
              </button>
              <Link
                to="/login"
                className="btn-outline-cyan w-100 py-2"
                style={{ borderRadius: '12px', fontSize: '0.9rem', textDecoration: 'none' }}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ── State 3: Link Verification Error (Fallback to OTP Window) ── */}
        {status === 'error' && (
          <div className="py-3">
            <FontAwesomeIcon icon={faTimesCircle} size="3x" style={{ color: '#F87171', marginBottom: '1rem' }} />
            <h4 className="fw-bold text-white mb-2">Activation Link Expired</h4>
            <p style={{ color: '#FCA5A5', fontSize: '0.88rem', marginBottom: '1.75rem' }}>{message}</p>
            <button
              onClick={() => { setStatus('idle'); setMode('otp'); }}
              className="btn-primary-cyan w-100 py-2 mb-2"
              style={{ borderRadius: '12px' }}
            >
              Enter 6-Digit OTP Instead
            </button>
            <Link to="/login" className="btn-outline-cyan w-100 py-2" style={{ borderRadius: '12px', textDecoration: 'none' }}>
              Back to Sign In
            </Link>
          </div>
        )}

        {/* ── State 4: Interactive OTP Verification Window ── */}
        {status === 'idle' && (
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: '20px', padding: '0.35rem 0.9rem', color: '#00E5FF',
              fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '1rem'
            }}>
              <FontAwesomeIcon icon={faShieldAlt} />
              TWO-FACTOR EMAIL OTP
            </div>

            <h3 className="fw-bold text-white mb-1">Verify Your Account</h3>
            <p style={{ color: '#C4B5FD', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Enter the 6-digit OTP code sent to your email to complete registration.
            </p>

            <form onSubmit={handleVerifyOtp}>
              {/* Email Address Input */}
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ color: '#C4B5FD', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Registered Email
                </label>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF', fontSize: '0.88rem' }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      width: '100%',
                      background: 'rgba(10, 4, 18, 0.85)',
                      border: '1px solid rgba(0, 229, 255, 0.25)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 6-Digit OTP Box Grid */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ color: '#C4B5FD', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.65rem', textAlign: 'left' }}>
                  One-Time Password (OTP)
                </label>

                <div
                  onPaste={handlePaste}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      style={{
                        width: '52px',
                        height: '58px',
                        background: digit ? 'rgba(0, 229, 255, 0.12)' : 'rgba(10, 4, 18, 0.85)',
                        border: digit ? '2px solid #00E5FF' : '1px solid rgba(157, 78, 221, 0.35)',
                        borderRadius: '14px',
                        color: '#00E5FF',
                        fontSize: '1.6rem',
                        fontWeight: 900,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: digit ? '0 0 14px rgba(0, 229, 255, 0.45)' : 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#00E5FF';
                        e.target.style.boxShadow = '0 0 16px rgba(0, 229, 255, 0.55)';
                        e.target.select();
                      }}
                      onBlur={(e) => {
                        if (!digit) {
                          e.target.style.borderColor = 'rgba(157, 78, 221, 0.35)';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                  ))}
                </div>
                <div style={{ color: '#8E7BB0', fontSize: '0.75rem', marginTop: '0.6rem', textAlign: 'left' }}>
                  💡 Tip: You can paste all 6 digits directly from your verification email.
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="btn-primary-cyan w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
                style={{
                  borderRadius: '14px',
                  fontSize: '1rem',
                  opacity: otpDigits.join('').length === 6 ? 1 : 0.6,
                }}
              >
                {loading ? (
                  <span className="film-reel" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} /> Verify OTP & Activate
                  </>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ color: '#8E7BB0', fontSize: '0.82rem' }}>
                  Didn't receive the email?
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || resendCooldown > 0}
                  className="btn btn-link p-0"
                  style={{
                    color: resendCooldown > 0 ? '#8E7BB0' : '#00E5FF',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  <FontAwesomeIcon icon={faRedo} className={`me-1 ${resending ? 'fa-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-2">
              <Link to="/login" style={{ color: '#C4B5FD', fontSize: '0.84rem', textDecoration: 'none' }}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
