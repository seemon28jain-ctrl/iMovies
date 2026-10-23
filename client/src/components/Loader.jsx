/**
 * Loader.jsx - Jet Black, Royal Amethyst & Electric Cyan Glassmorphic Loader
 */
const Loader = () => {
  return (
    <div className="loader-overlay">
      <div style={{ textAlign: 'center' }}>
        {/* Dual-ring spinner */}
        <div className="film-reel" />
        {/* Loading text */}
        <p style={{
          marginTop: '1.5rem',
          color: '#00E5FF',
          fontSize: '1rem',
          letterSpacing: '0.12em',
          fontWeight: 800,
          textTransform: 'uppercase',
          textShadow: '0 0 12px rgba(0, 229, 255, 0.6)',
          animation: 'pulseGlow 1.5s ease-in-out infinite'
        }}>
          Loading iMovies...
        </p>
      </div>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.98); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
