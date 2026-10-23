/**
 * ResetPasswordPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Password Reset Form
 */
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheckCircle, faFilm } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Missing password reset token.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Password reset successfully!');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
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
          <h4 className="fw-bold mt-3 text-white">Set New Password</h4>
          <p style={{ color: '#C4B5FD', fontSize: '0.88rem' }}>
            Create a secure password for your iMovies account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
              <FontAwesomeIcon icon={faLock} className="me-1" style={{ color: '#00E5FF' }} /> New Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              required
            />
          </div>

          <div className="mb-4">
            <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
              <FontAwesomeIcon icon={faLock} className="me-1" style={{ color: '#00E5FF' }} /> Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-cyan w-100 py-2 fw-semibold"
            style={{ borderRadius: '12px' }}
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" style={{ color: '#8E7BB0', fontSize: '0.88rem', textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
