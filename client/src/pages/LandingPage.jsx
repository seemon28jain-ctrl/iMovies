/**
 * LandingPage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Hero Landing Page
 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm, faTicketAlt, faCouch, faPlayCircle,
  faStar, faArrowRight, faBolt
} from '@fortawesome/free-solid-svg-icons';

/* ---- Floating Particle Canvas with Cyan & Amethyst Neon Specks ---- */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles with Electric Cyan & Royal Amethyst tones
    const initParticles = () => {
      particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.2 + 0.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.45 - 0.1,
        alpha: Math.random() * 0.6 + 0.15,
        color: Math.random() > 0.5
          ? `rgba(0, 229, 255, ${Math.random() * 0.5 + 0.2})`   /* Electric Cyan */
          : `rgba(139, 31, 232, ${Math.random() * 0.5 + 0.2})`  /* Royal Amethyst */
      }));
    };
    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.001;

        if (p.y < -10 || p.alpha <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.alpha = Math.random() * 0.6 + 0.15;
          p.color = Math.random() > 0.5
            ? `rgba(0, 229, 255, ${Math.random() * 0.5 + 0.2})`
            : `rgba(139, 31, 232, ${Math.random() * 0.5 + 0.2})`;
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', opacity: 0.85
      }}
    />
  );
};

/* ---- Glassmorphism Feature Card ---- */
const FeatureCard = ({ icon, title, desc }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.72) 0%, rgba(10, 4, 20, 0.88) 100%)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(0, 229, 255, 0.18)',
    borderRadius: '20px',
    padding: '2.5rem 1.75rem',
    textAlign: 'center',
    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    height: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(59, 10, 107, 0.3)'
  }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#00E5FF';
      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 20px 45px rgba(0,0,0,0.8), 0 0 30px rgba(0, 229, 255, 0.4), 0 0 50px rgba(59, 10, 107, 0.5)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.18)';
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(59, 10, 107, 0.3)';
    }}
  >
    <div style={{
      width: '70px', height: '70px', borderRadius: '18px',
      background: 'linear-gradient(135deg, rgba(59, 10, 107, 0.8), rgba(0, 229, 255, 0.2))',
      border: '1px solid rgba(0, 229, 255, 0.4)',
      boxShadow: '0 0 20px rgba(0, 229, 255, 0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 1.5rem', fontSize: '1.85rem', color: '#00E5FF'
    }}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <h5 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.85rem', fontSize: '1.2rem' }}>{title}</h5>
    <p style={{ color: '#C4B5FD', fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>{desc}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      backgroundImage: `
        radial-gradient(circle at 18% 22%, rgba(59, 10, 107, 0.55) 0%, transparent 48%),
        radial-gradient(circle at 82% 78%, rgba(0, 229, 255, 0.22) 0%, transparent 52%),
        radial-gradient(circle at 50% 50%, rgba(20, 5, 40, 0.9) 0%, #050505 100%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ParticleCanvas />

      {/* Futuristic Electric Cyan Top Glow Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '4px', zIndex: 10,
        background: 'linear-gradient(90deg, #3B0A6B 0%, #00E5FF 50%, #3B0A6B 100%)',
        boxShadow: '0 0 15px rgba(0, 229, 255, 0.8)'
      }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* ---- HERO SECTION ---- */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          textAlign: 'center'
        }}>
          {/* Logo Mark Pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(59, 10, 107, 0.45)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50px', padding: '0.55rem 1.4rem',
            marginBottom: '2.5rem', animation: 'fadeInDown 0.8s ease both',
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)'
          }}>
            <FontAwesomeIcon icon={faBolt} style={{ color: '#00E5FF', fontSize: '1.1rem' }} />
            <span style={{ color: '#00E5FF', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.12em' }}>
              NEXT-GEN CINEMA BOOKING
            </span>
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.75rem, 7.5vw, 5.8rem)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            marginBottom: '1.5rem',
            animation: 'fadeInUp 0.8s ease 0.1s both'
          }}>
            Welcome to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00E5FF 0%, #FFFFFF 40%, #C4B5FD 70%, #8B1FE8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(0, 229, 255, 0.35))'
            }}>
              iMovies
            </span>
          </h1>

          {/* Sub-heading */}
          <p style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)',
            color: '#C4B5FD',
            maxWidth: '640px',
            lineHeight: 1.7,
            marginBottom: '3rem',
            animation: 'fadeInUp 0.8s ease 0.2s both',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)'
          }}>
            Experience cinema reimagined. Real-time TMDB market streams, instantaneous seat reservation, and stunning visual acoustics in one seamless platform.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
            justifyContent: 'center', marginBottom: '4rem',
            animation: 'fadeInUp 0.8s ease 0.3s both'
          }}>
            <Link
              to="/login"
              className="btn-primary-cyan"
              style={{
                fontSize: '1.1rem',
                padding: '0.9rem 2.8rem',
                borderRadius: '50px',
                boxShadow: '0 0 30px rgba(0, 229, 255, 0.5)'
              }}
            >
              <FontAwesomeIcon icon={faPlayCircle} />
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary-amethyst"
              style={{
                fontSize: '1.1rem',
                padding: '0.9rem 2.8rem',
                borderRadius: '50px',
                border: '1px solid #00E5FF'
              }}
            >
              Get Started
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </section>

        {/* ---- FEATURES SECTION ---- */}
        <section style={{
          padding: '6rem 2rem',
          background: 'radial-gradient(ellipse at center, rgba(59, 10, 107, 0.25) 0%, transparent 70%)'
        }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                color: '#00E5FF', fontSize: '0.88rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.85rem',
                textShadow: '0 0 10px rgba(0, 229, 255, 0.5)'
              }}>
                SUPERIOR ARCHITECTURE
              </p>
              <h2 style={{
                fontSize: '2.5rem', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                The Ultimate Cinema Experience
              </h2>
            </div>
            <div className="row g-4">
              <div className="col-12 col-md-4">
                <FeatureCard
                  icon={faFilm}
                  title="Live TMDB Discovery"
                  desc="Synced directly with global TMDB feeds. Discover real blockbusters, cast rosters, trailers, and market ratings in real time."
                />
              </div>
              <div className="col-12 col-md-4">
                <FeatureCard
                  icon={faTicketAlt}
                  title="Instantaneous Locking"
                  desc="Zero race conditions. Real-time WebSocket telemetry reserves your seat with an active 10-minute hold while you checkout."
                />
              </div>
              <div className="col-12 col-md-4">
                <FeatureCard
                  icon={faCouch}
                  title="Interactive Seat Mapping"
                  desc="High-fidelity tier selection with Balcony, Middle, and Lower levels. See availability instantly with radiant Electric Cyan status."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---- FINAL CTA ---- */}
        <section style={{
          padding: '6rem 2rem',
          background: 'linear-gradient(135deg, rgba(59, 10, 107, 0.45) 0%, rgba(0, 229, 255, 0.12) 100%)',
          borderTop: '1px solid rgba(0, 229, 255, 0.25)',
          backdropFilter: 'blur(20px)'
        }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '1rem', color: '#fff' }}>
              Ready to Watch Something Extraordinary?
            </h2>
            <p style={{ color: '#C4B5FD', marginBottom: '2.5rem', fontSize: '1.15rem', maxWidth: '580px', margin: '0 auto 2.5rem' }}>
              Step into the cinema of the future. Reserve your first ticket in under 60 seconds.
            </p>
            <Link
              to="/register"
              className="btn-primary-cyan"
              style={{
                fontSize: '1.15rem',
                padding: '0.95rem 3rem',
                borderRadius: '50px',
                boxShadow: '0 0 35px rgba(0, 229, 255, 0.6)'
              }}
            >
              <FontAwesomeIcon icon={faTicketAlt} />
              Create Free Account
            </Link>
          </div>
        </section>

        {/* ---- MINI FOOTER ---- */}
        <div style={{
          textAlign: 'center', padding: '1.75rem',
          borderTop: '1px solid rgba(0, 229, 255, 0.15)',
          color: '#8E7BB0', fontSize: '0.85rem',
          background: '#050505'
        }}>
          &copy; {new Date().getFullYear()} iMovies Inc. Designed in Jet Black, Royal Amethyst & Electric Cyan.
          {' · '}
          <Link to="/login" style={{ color: '#00E5FF' }}>Sign In</Link>
          {' · '}
          <Link to="/register" style={{ color: '#00E5FF' }}>Register</Link>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
