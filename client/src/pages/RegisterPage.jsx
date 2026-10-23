/**
 * RegisterPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Registration
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faEnvelope, faLock, faUser, faUserShield,
  faEye, faEyeSlash, faUserPlus, faCheck
} from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

/* ---- Password Strength Indicator ---- */
const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains number', pass: /\d/.test(password) },
    { label: 'Contains special char', pass: /[^a-zA-Z0-9]/.test(password) }
  ];
  const strength = checks.filter(c => c.pass).length;
  const colors = ['#6D5D8A', '#F87171', '#FFB800', '#00E5FF', '#33EBFF'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '0.6rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.45rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '4px',
            background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.1)',
            boxShadow: i <= strength ? `0 0 8px ${colors[strength]}` : 'none',
            transition: 'all 0.3s'
          }} />
        ))}
      </div>
      <p style={{ color: colors[strength], fontSize: '0.78rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
        {labels[strength]}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {checks.map(({ label, pass }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: pass ? '#00E5FF' : '#8E7BB0' }}>
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: '0.7rem' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  /* ---- Validation ---- */
  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (form.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      toast.success(res.data?.message || 'Account created! Enter the 6-digit OTP sent to your email.', { autoClose: 6000 });
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = (field, icon, placeholder, type = 'text', extra = {}) => (
    <div style={{ position: 'relative' }}>
      <FontAwesomeIcon
        icon={icon}
        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF', fontSize: '0.9rem', zIndex: 1 }}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={form[field]}
        onChange={handleChange(field)}
        style={{
          background: 'rgba(10, 4, 18, 0.85)',
          border: `1px solid ${errors[field] ? '#F87171' : 'rgba(0, 229, 255, 0.22)'}`,
          borderRadius: '12px', color: '#fff',
          padding: extra.paddingRight ? `0.8rem ${extra.paddingRight} 0.8rem 2.75rem` : '0.8rem 1rem 0.8rem 2.75rem',
          width: '100%', fontSize: '0.95rem', outline: 'none',
          transition: 'all 0.25s ease'
        }}
        onFocus={e => {
          e.target.style.borderColor = '#00E5FF';
          e.target.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.35)';
        }}
        onBlur={e => {
          e.target.style.borderColor = errors[field] ? '#F87171' : 'rgba(0, 229, 255, 0.22)';
          e.target.style.boxShadow = 'none';
        }}
        autoComplete={field === 'password' ? 'new-password' : field}
      />
      {extra.toggleEl}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      backgroundImage: `
        radial-gradient(circle at 75% 25%, rgba(59, 10, 107, 0.55) 0%, transparent 50%),
        radial-gradient(circle at 25% 75%, rgba(0, 229, 255, 0.2) 0%, transparent 55%),
        #050505
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
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
            Join the premier cinema booking community
          </p>
        </div>

        {/* Glass Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.78) 0%, rgba(10, 4, 20, 0.92) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '24px', padding: '2.25rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(59, 10, 107, 0.45)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.35rem', margin: 0 }}>
              Create User Account
            </h3>
            <p style={{ color: '#8E7BB0', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Standard viewer registration
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                Username
              </label>
              {inputWrap('username', faUser, 'Choose a username')}
              {errors.username && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.username}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                Email Address
              </label>
              {inputWrap('email', faEnvelope, 'your@email.com', 'email')}
              {errors.email && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                Password
              </label>
              {inputWrap('password', faLock, 'Create a strong password', showPassword ? 'text' : 'password', {
                paddingRight: '2.75rem',
                toggleEl: (
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8E7BB0', cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                )
              })}
              {errors.password && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.password}</p>}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                Confirm Password
              </label>
              {inputWrap('confirm', faLock, 'Repeat your password', showConfirm ? 'text' : 'password', {
                paddingRight: '2.75rem',
                toggleEl: (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8E7BB0', cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
                  </button>
                )
              })}
              {errors.confirm && <p style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.confirm}</p>}
              {form.confirm && form.password === form.confirm && (
                <p style={{ color: '#00E5FF', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 700 }}>
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: '0.35rem' }} /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-cyan w-100"
              style={{ justifyContent: 'center', padding: '0.85rem', fontSize: '1.05rem', borderRadius: '14px' }}
            >
              {loading
                ? <span className="film-reel" style={{ width: '22px', height: '22px', borderWidth: '2px' }} />
                : <><FontAwesomeIcon icon={faUserPlus} /> Create Account</>
              }
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center', color: '#C4B5FD', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00E5FF', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/landing" style={{ color: '#8E7BB0', fontSize: '0.88rem', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
