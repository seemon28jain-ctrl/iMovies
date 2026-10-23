/**
 * LoginPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Authentication
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faEnvelope, faLock, faEye, faEyeSlash,
  faUser, faUserShield, faSignInAlt
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  /* ---- Validation ---- */
  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setUnverifiedEmail('');
    try {
      const endpoint = activeTab === 'user'
        ? '/auth/login'
        : '/auth/admin/login';
      const { data } = await api.post(endpoint, {
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      if (activeTab === 'user') {
        localStorage.setItem('imovies-token', data.token || data.authToken || data.data?.token);
        localStorage.setItem('imovies-username', data.user?.username || data.username || 'User');
        localStorage.setItem('imovies-email', data.user?.email || form.email);
      } else {
        localStorage.setItem('imovies-admin-token', data.token || data.authToken || data.data?.token);
        localStorage.setItem('imovies-username', data.admin?.username || data.username || 'Admin');
        localStorage.setItem('imovies-email', form.email);
      }

      toast.success(`Welcome back! Logged in as ${activeTab}.`);
      navigate(activeTab === 'admin' ? '/admin' : '/home');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.isVerified === false) {
        setUnverifiedEmail(form.email.trim().toLowerCase());
      }
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background: 'rgba(10, 4, 18, 0.85)',
    border: `1px solid ${errors[field] ? '#F87171' : 'rgba(0, 229, 255, 0.22)'}`,
    borderRadius: '12px',
    color: '#fff',
    padding: '0.8rem 1rem 0.8rem 2.75rem',
    width: '100%',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.25s ease'
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(59, 10, 107, 0.55) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(0, 229, 255, 0.2) 0%, transparent 55%),
        #050505
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              fontSize: '2rem', fontWeight: 900, color: '#fff'
            }}>
              <FontAwesomeIcon icon={faFilm} style={{ color: '#00E5FF', filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.6))' }} />
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
          <p style={{ color: '#C4B5FD', marginTop: '0.5rem', fontSize: '0.92rem' }}>
            Sign in to experience real-time cinema booking
          </p>
        </div>

        {/* Glass Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.78) 0%, rgba(10, 4, 20, 0.92) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(59, 10, 107, 0.45)'
        }}>
          {/* Tabs */}
          <div className="tab-bar">
            {[
              { key: 'user', icon: faUser, label: 'User Login' },
              { key: 'admin', icon: faUserShield, label: 'Admin Login' }
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                className={`tab-item ${activeTab === key ? 'active' : ''}`}
                onClick={() => { setActiveTab(key); setErrors({}); }}
                style={{ background: 'none', border: 'none', flex: 1, padding: '0.65rem 0' }}
              >
                <FontAwesomeIcon icon={icon} style={{ marginRight: '0.45rem' }} />
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.35rem' }}>
              <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <FontAwesomeIcon
                  icon={faEnvelope}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF', fontSize: '0.9rem' }}
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                  style={inputStyle('email')}
                  onFocus={e => {
                    e.target.style.borderColor = '#00E5FF';
                    e.target.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.35)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = errors.email ? '#F87171' : 'rgba(0, 229, 255, 0.22)';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                  Password
                </label>
                {activeTab === 'user' && (
                  <Link to="/forgot-password" style={{ color: '#00E5FF', fontSize: '0.82rem', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <FontAwesomeIcon
                  icon={faLock}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF', fontSize: '0.9rem' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
                  style={{ ...inputStyle('password'), paddingRight: '2.75rem' }}
                  onFocus={e => {
                    e.target.style.borderColor = '#00E5FF';
                    e.target.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.35)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = errors.password ? '#F87171' : 'rgba(0, 229, 255, 0.22)';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '1rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: '#8E7BB0', cursor: 'pointer', padding: '0'
                  }}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {errors.password && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-cyan w-100"
              style={{ justifyContent: 'center', padding: '0.85rem', fontSize: '1.05rem', borderRadius: '14px' }}
            >
              {loading ? (
                <span className="film-reel" style={{ width: '22px', height: '22px', borderWidth: '2px' }} />
              ) : (
                <><FontAwesomeIcon icon={faSignInAlt} /> Sign In</>
              )}
            </button>

            {/* Unverified Account Helper Banner */}
            {unverifiedEmail && (
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid #00E5FF',
                borderRadius: '14px',
                padding: '0.9rem 1rem',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)'
              }}>
                <div style={{ color: '#00E5FF', fontWeight: 800, fontSize: '0.86rem' }}>
                  Account Not Verified Yet
                </div>
                <p style={{ color: '#C4B5FD', fontSize: '0.8rem', margin: '4px 0 10px 0' }}>
                  Please enter the 6-digit OTP code sent to your email to activate your account.
                </p>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="btn-primary-cyan d-inline-block py-2 px-3 fw-bold"
                  style={{ borderRadius: '10px', fontSize: '0.82rem', textDecoration: 'none' }}
                >
                  Enter Verification OTP Window
                </Link>
              </div>
            )}
          </form>

          {/* Footer Links */}
          {activeTab === 'user' ? (
            <div style={{ marginTop: '1.75rem', textAlign: 'center', color: '#C4B5FD', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#00E5FF', fontWeight: 700, textDecoration: 'none' }}>
                Sign Up
              </Link>
            </div>
          ) : (
            <div style={{
              marginTop: '1.75rem',
              padding: '0.75rem 1rem',
              background: 'rgba(59, 10, 107, 0.3)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#C4B5FD',
              fontSize: '0.82rem',
              lineHeight: 1.45
            }}>
              <FontAwesomeIcon icon={faUserShield} style={{ color: '#00E5FF', marginRight: '0.45rem' }} />
              <strong style={{ color: '#FFFFFF' }}>Admin Portal Restricted:</strong> For security, public admin registration is disabled. New administrators can only be created from the Admin Dashboard.
            </div>
          )}
        </div>

        {/* Back to Landing */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/landing" style={{ color: '#8E7BB0', fontSize: '0.88rem', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
