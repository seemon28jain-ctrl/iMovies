/**
 * ForgotPasswordPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Password Reset Request
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPaperPlane, faFilm, faCheckCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });

      if (res.data.success) {
        setSubmitted(true);
        toast.success(res.data.message || 'Password reset instructions generated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#050505',
        backgroundImage: `
          radial-gradient(circle at 30% 30%, rgba(59, 10, 107, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 70% 70%, rgba(0, 229, 255, 0.2) 0%, transparent 55%),
          #050505
        `,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: 460, width: '100%',
          background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.8) 0%, rgba(10, 4, 20, 0.94) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(59, 10, 107, 0.45)',
          padding: '2.5rem'
        }}
      >
        <div className="text-center mb-4">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.65rem',
              fontSize: '1.8rem', fontWeight: 900, color: '#fff'
            }}>
              <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.6))' }} />
              <span>
                <span style={{ color: '#00E5FF' }}>i</span>
                <span style={{
                  background: 'linear-gradient(135deg, #FFFFFF, #C4B5FD)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Movies</span>
              </span>
            </div>
          </Link>
          <h4 className="fw-bold mt-3 text-white">Reset Password</h4>
          <p style={{ color: '#C4B5FD', fontSize: '0.88rem' }}>
            Enter your registered email and we'll help you reset your account credentials.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-3">
            <FontAwesomeIcon icon={faCheckCircle} size="3x" style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.6))', marginBottom: '1rem' }} />
            <h5 className="fw-bold text-white mb-2">Instructions Sent</h5>
            <p style={{ color: '#C4B5FD', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              If an account is associated with <strong>{email}</strong>, password reset instructions have been generated.
            </p>
            <Link to="/login" className="btn-primary-cyan w-100 py-2" style={{ borderRadius: '12px' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                <FontAwesomeIcon icon={faEnvelope} className="me-1" style={{ color: '#00E5FF' }} /> Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'rgba(10, 4, 18, 0.85)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '0.8rem 1rem',
                  width: '100%',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#00E5FF';
                  e.target.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.35)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(0, 229, 255, 0.25)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-cyan w-100 py-2 fw-semibold"
              style={{ borderRadius: '12px' }}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {!submitted && (
          <div className="text-center mt-4">
            <Link to="/login" style={{ color: '#8E7BB0', fontSize: '0.88rem', textDecoration: 'none' }}>
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
