/**
 * ThemeToggle.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Theme Toggle Button
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ variant = 'header', showLabel = false, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'floating') {
    return (
      <button
        onClick={toggleTheme}
        className={`btn-theme-floating ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle Theme"
        style={{
          background: isDark ? 'rgba(20, 8, 36, 0.85)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          border: isDark ? '1px solid rgba(0, 229, 255, 0.35)' : '1px solid rgba(59, 10, 107, 0.25)',
          boxShadow: isDark
            ? '0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(0, 229, 255, 0.4)'
            : '0 8px 25px rgba(59, 10, 107, 0.15)',
          color: isDark ? '#00E5FF' : '#3B0A6B',
          cursor: 'pointer',
          transition: 'all 0.25s ease'
        }}
      >
        <FontAwesomeIcon
          icon={isDark ? faSun : faMoon}
          style={{
            color: isDark ? '#FFB800' : '#6B17B8',
            filter: isDark ? 'drop-shadow(0 0 8px #FFB800)' : 'drop-shadow(0 0 6px #6B17B8)'
          }}
        />
        {showLabel && (
          <span className="ms-2 small fw-bold" style={{ color: isDark ? '#FFFFFF' : '#150626' }}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`btn-theme-toggle ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
      style={{
        background: isDark ? 'rgba(59, 10, 107, 0.35)' : 'rgba(255, 255, 255, 0.9)',
        border: isDark ? '1px solid rgba(0, 229, 255, 0.25)' : '1px solid rgba(59, 10, 107, 0.25)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '0.4rem 0.85rem',
        color: isDark ? '#00E5FF' : '#3B0A6B',
        cursor: 'pointer',
        boxShadow: isDark ? 'none' : '0 2px 8px rgba(59, 10, 107, 0.1)',
        transition: 'all 0.25s ease'
      }}
    >
      <div className="theme-toggle-inner d-flex align-items-center">
        <FontAwesomeIcon
          icon={isDark ? faSun : faMoon}
          style={{
            color: isDark ? '#FFB800' : '#6B17B8',
            filter: isDark ? 'drop-shadow(0 0 6px #FFB800)' : 'drop-shadow(0 0 4px #6B17B8)'
          }}
        />
        {showLabel && (
          <span className="theme-toggle-label ms-2 small fw-bold" style={{ color: isDark ? '#FFFFFF' : '#150626' }}>
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
