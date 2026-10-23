/**
 * HomePage.jsx - Jet Black (#050505), Royal Amethyst (#3B0A6B) & Electric Cyan (#00E5FF)
 * Ultra-Modern Glassmorphic Movie Discovery Page with TMDB Live Sections & Interactive Filters
 */
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faFilm, faTimes, faFilter, faFire,
  faStar, faCalendarAlt, faMapMarkerAlt, faGlobe,
  faTags, faCheck, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MovieCard from '../components/MovieCard';
import api from '../utils/api';

/* ---- Glassmorphic Skeleton Card ---- */
const SkeletonCard = () => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.6) 0%, rgba(10, 4, 20, 0.8) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 229, 255, 0.12)',
    borderRadius: '14px', overflow: 'hidden'
  }}>
    <div className="skeleton" style={{ width: '100%', paddingTop: '150%' }} />
    <div style={{ padding: '0.75rem' }}>
      <div className="skeleton" style={{ height: '16px', marginBottom: '0.45rem', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: '0.45rem', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '28px', marginTop: '0.45rem', borderRadius: '8px' }} />
    </div>
  </div>
);

const CITIES = [
  'Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad',
  'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'New York', 'London'
];

const GENRES = [
  'All', 'Action', 'Adventure', 'Animation', 'Comedy',
  'Crime', 'Drama', 'Family', 'Fantasy', 'Horror',
  'Romance', 'Sci-Fi', 'Thriller'
];

const LANGUAGES = [
  'All', 'English', 'Hindi', 'Telugu', 'Tamil',
  'Malayalam', 'Kannada', 'Spanish', 'French'
];

const SECTIONS = [
  { id: 'all', label: 'All Curated Sections', icon: faLayerGroup },
  { id: 'top10', label: 'Top 10 Today', icon: faFire },
  { id: 'nowPlaying', label: 'Now Showing', icon: faFilm },
  { id: 'topRated', label: 'Top Rated', icon: faStar },
  { id: 'upcoming', label: 'Upcoming', icon: faCalendarAlt },
];

const HomePage = () => {
  const [activeSection, setActiveSection] = useState('all');
  const [curatedSections, setCuratedSections] = useState({
    top10: [],
    nowPlaying: [],
    topRated: [],
    upcoming: []
  });
  const [curatedLoading, setCuratedLoading] = useState(true);

  // Filtered / Search movies state
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem('imovies-location') || 'Mumbai');

  const username = localStorage.getItem('imovies-username') || 'User';

  // Listen to city changes from Header
  useEffect(() => {
    const handleCityChange = (e) => {
      if (e.detail) setCity(e.detail);
    };
    window.addEventListener('imovies-city-changed', handleCityChange);
    return () => window.removeEventListener('imovies-city-changed', handleCityChange);
  }, []);

  const handleCitySelect = (c) => {
    setCity(c);
    localStorage.setItem('imovies-location', c);
    window.dispatchEvent(new CustomEvent('imovies-city-changed', { detail: c }));
  };

  /* ---- Fetch Curated Sections (Top 10, Now Playing, Top Rated, Upcoming) ---- */
  const fetchCuratedSections = async () => {
    try {
      setCuratedLoading(true);
      const res = await api.get('/movie/curated-sections');
      if (res.data && res.data.sections) {
        setCuratedSections(res.data.sections);
      }
    } catch (err) {
      console.warn('Failed to fetch curated sections:', err.message);
    } finally {
      setCuratedLoading(false);
    }
  };

  useEffect(() => {
    fetchCuratedSections();
  }, []);

  /* ---- Fetch Filtered / Search Movies ---- */
  const fetchFilteredMovies = async () => {
    const isFiltered = search.trim() || (genre && genre !== 'All') || (language && language !== 'All') || activeSection !== 'all';
    if (!isFiltered) {
      setMovies([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (genre && genre !== 'All') params.append('genre', genre);
      if (language && language !== 'All') params.append('language', language);
      if (activeSection !== 'all') params.append('section', activeSection);

      const res = await api.get(`/movie?${params.toString()}`);
      setMovies(Array.isArray(res.data) ? res.data : (res.data.movies || []));
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredMovies();
  }, [genre, language, activeSection]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFilteredMovies();
  };

  const clearFilters = () => {
    setSearch('');
    setGenre('All');
    setLanguage('All');
    setActiveSection('all');
  };

  const hasFilters = Boolean(search.trim() || (genre && genre !== 'All') || (language && language !== 'All') || activeSection !== 'all');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* ---- HERO GLASS BANNER ---- */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(59, 10, 107, 0.45) 0%, rgba(5, 5, 5, 0.88) 100%)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.18)',
          padding: '3rem 0 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Radial Glow */}
          <div style={{
            position: 'absolute', top: '-60px', right: '10%',
            width: '450px', height: '300px',
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            {/* Header row with Location Pill */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                  Welcome, <span style={{
                    background: 'linear-gradient(135deg, #00E5FF, #FFFFFF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(0, 229, 255, 0.4)'
                  }}>{username}</span> 👋
                </h1>
                <p style={{ color: '#C4B5FD', marginBottom: 0, fontSize: '0.98rem' }}>
                  Live cinema trends from TMDB. Book prime tickets in <strong>{city}</strong> instantly.
                </p>
              </div>

              {/* Location Badge & Quick Selector */}
              <div className="mt-2 mt-md-0 d-flex align-items-center gap-2">
                <span style={{
                  background: 'rgba(59, 10, 107, 0.45)',
                  border: '1px solid rgba(0, 229, 255, 0.35)',
                  borderRadius: '30px',
                  padding: '0.45rem 1.15rem',
                  color: '#00E5FF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#00E5FF' }} />
                  {city} Cinema Zone
                </span>
              </div>
            </div>

            {/* Quick City Buttons Row */}
            <div className="mb-4 d-flex flex-wrap align-items-center" style={{ gap: '0.65rem' }}>
              <span style={{ color: '#8E7BB0', fontSize: '0.82rem', fontWeight: 700, marginRight: '0.35rem' }}>
                <FontAwesomeIcon icon={faGlobe} className="me-1 text-cyan" /> Select City:
              </span>
              {CITIES.map((c) => {
                const isSelected = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCitySelect(c)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #00E5FF, #3B0A6B)' : 'rgba(25, 9, 45, 0.65)',
                      color: isSelected ? '#050505' : '#C4B5FD',
                      border: `1px solid ${isSelected ? '#00E5FF' : 'rgba(0, 229, 255, 0.2)'}`,
                      borderRadius: '20px',
                      padding: '0.35rem 0.95rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 14px rgba(0, 229, 255, 0.45)' : 'none'
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Search Bar with Glass Panel */}
            <form onSubmit={handleSearch} className="mb-4">
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <FontAwesomeIcon
                    icon={faSearch}
                    style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF' }}
                  />
                  <input
                    type="text"
                    placeholder="Search blockbusters, actors, directors from TMDB..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      background: 'rgba(12, 4, 22, 0.8)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(0, 229, 255, 0.25)',
                      borderRadius: '14px', color: '#fff',
                      padding: '0.85rem 1.25rem 0.85rem 3.2rem',
                      width: '100%', fontSize: '0.98rem', outline: 'none',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(s => !s)}
                  style={{
                    background: showFilters ? 'rgba(0, 229, 255, 0.15)' : 'rgba(25, 9, 45, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${showFilters ? '#00E5FF' : 'rgba(0, 229, 255, 0.25)'}`,
                    borderRadius: '14px', color: showFilters ? '#00E5FF' : '#C4B5FD',
                    padding: '0.85rem 1.4rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 700,
                    transition: 'all 0.25s ease'
                  }}
                >
                  <FontAwesomeIcon icon={faFilter} />
                  Filters {hasFilters && (
                    <span style={{
                      background: '#00E5FF', color: '#050505',
                      borderRadius: '50%', width: '20px', height: '20px',
                      fontSize: '0.75rem', fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      !
                    </span>
                  )}
                </button>
                <button
                  type="submit"
                  className="btn-primary-cyan"
                  style={{ padding: '0.85rem 1.8rem', borderRadius: '14px' }}
                >
                  <FontAwesomeIcon icon={faSearch} /> Search
                </button>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '14px', color: '#F87171',
                      padding: '0.85rem 1.4rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      fontWeight: 700, fontSize: '0.92rem'
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Reset Filters
                  </button>
                )}
              </div>
            </form>

            {/* ---- TMDB SECTION SWITCHER BUTTONS ---- */}
            <div className="d-flex flex-wrap align-items-center mb-3" style={{ gap: '0.75rem' }}>
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #00E5FF 0%, #3B0A6B 100%)'
                        : 'rgba(25, 9, 45, 0.72)',
                      color: isActive ? '#050505' : '#C4B5FD',
                      border: `1px solid ${isActive ? '#00E5FF' : 'rgba(0, 229, 255, 0.2)'}`,
                      borderRadius: '14px',
                      padding: '0.6rem 1.35rem',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      backdropFilter: 'blur(10px)',
                      boxShadow: isActive ? '0 0 20px rgba(0, 229, 255, 0.5)' : 'none',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <FontAwesomeIcon icon={sec.icon} style={{ color: isActive ? '#050505' : '#00E5FF' }} />
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* ---- GENRE & LANGUAGE BUTTON FEATURES (Collapsible or always visible) ---- */}
            {showFilters && (
              <div style={{
                background: 'rgba(16, 6, 30, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: '18px',
                padding: '1.25rem 1.5rem',
                marginTop: '1rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}>
                {/* Genre Buttons Feature */}
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faTags} style={{ color: '#00E5FF', fontSize: '0.85rem' }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem' }}>Genre:</span>
                  </div>
                  <div className="d-flex flex-wrap" style={{ gap: '0.55rem' }}>
                    {GENRES.map((g) => {
                      const isSel = genre === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGenre(g)}
                          style={{
                            background: isSel ? '#00E5FF' : 'rgba(59, 10, 107, 0.35)',
                            color: isSel ? '#050505' : '#C4B5FD',
                            border: `1px solid ${isSel ? '#00E5FF' : 'rgba(0, 229, 255, 0.2)'}`,
                            borderRadius: '10px',
                            padding: '0.4rem 0.95rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSel ? '0 0 12px rgba(0, 229, 255, 0.4)' : 'none'
                          }}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language Buttons Feature */}
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faGlobe} style={{ color: '#00E5FF', fontSize: '0.85rem' }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem' }}>Language:</span>
                  </div>
                  <div className="d-flex flex-wrap" style={{ gap: '0.55rem' }}>
                    {LANGUAGES.map((l) => {
                      const isSel = language === l;
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLanguage(l)}
                          style={{
                            background: isSel ? '#00E5FF' : 'rgba(59, 10, 107, 0.35)',
                            color: isSel ? '#050505' : '#C4B5FD',
                            border: `1px solid ${isSel ? '#00E5FF' : 'rgba(0, 229, 255, 0.2)'}`,
                            borderRadius: '10px',
                            padding: '0.4rem 0.95rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSel ? '0 0 12px rgba(0, 229, 255, 0.4)' : 'none'
                          }}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- CONTENT AREA ---- */}
        <div className="container" style={{ padding: '2.5rem 1rem 4rem' }}>
          {/* If user filtered or searched, show targeted results grid */}
          {hasFilters ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(59,10,107,0.4))',
                    border: '1px solid rgba(0,229,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#00E5FF'
                  }}>
                    <FontAwesomeIcon icon={faFilter} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#fff' }}>
                      {search ? `Search: "${search}"` : `${activeSection !== 'all' ? SECTIONS.find(s => s.id === activeSection)?.label : 'Filtered Results'}`}
                    </h2>
                    <span style={{ color: '#8E7BB0', fontSize: '0.82rem' }}>
                      {genre !== 'All' ? `Genre: ${genre} • ` : ''}
                      {language !== 'All' ? `Language: ${language} • ` : ''}
                      In {city}
                    </span>
                  </div>
                </div>
                {!loading && (
                  <span style={{
                    background: 'rgba(59, 10, 107, 0.4)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    color: '#00E5FF',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {movies.length} title{movies.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Loading Skeletons */}
              {loading && (
                <div className="row g-2 g-md-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <SkeletonCard />
                    </div>
                  ))}
                </div>
              )}

              {/* Movies Grid */}
              {!loading && movies.length > 0 && (
                <div className="row g-2 g-md-3">
                  {movies.map((movie, idx) => (
                    <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <MovieCard movie={movie} rank={activeSection === 'top10' ? idx + 1 : undefined} />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && movies.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '5rem 2rem',
                  background: 'linear-gradient(135deg, rgba(25, 9, 45, 0.6) 0%, rgba(10, 4, 20, 0.8) 100%)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(0, 229, 255, 0.18)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                }}>
                  <FontAwesomeIcon icon={faSearch} style={{ fontSize: '3rem', color: '#00E5FF', marginBottom: '1.25rem', opacity: 0.7 }} />
                  <h3 style={{ color: '#FFFFFF', fontWeight: 800, marginBottom: '0.5rem' }}>No Screenings Found</h3>
                  <p style={{ color: '#C4B5FD', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                    No market movies found matching your current filter criteria in {city}.
                  </p>
                  <button className="btn-outline-cyan" onClick={clearFilters}>
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT: CURATED TMDB SECTIONS VIEW (Top 10, Now Playing, Top Rated, Upcoming) */
            <div>
              {/* SECTION 1: TOP 10 MOVIES TODAY */}
              <section className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{
                      background: 'linear-gradient(135deg, #00E5FF, #3B0A6B)',
                      color: '#050505',
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 900
                    }}>
                      <FontAwesomeIcon icon={faFire} />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        🔥 Top 10 Movies Today
                      </h3>
                      <span style={{ color: '#8E7BB0', fontSize: '0.8rem' }}>
                        Daily trending market rankings from TMDB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('top10')}
                    className="btn-outline-cyan"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '18px' }}
                  >
                    View All Top 10
                  </button>
                </div>

                {curatedLoading ? (
                  <div className="row g-2 g-md-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row g-2 g-md-3">
                    {curatedSections.top10.slice(0, 6).map((movie, idx) => (
                      <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <MovieCard movie={movie} rank={idx + 1} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: NEWLY ADDED MOVIES (SPOTLIGHT) */}
              {curatedSections.newlyAdded && curatedSections.newlyAdded.length > 0 && (
                <section className="mb-5">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span style={{
                        background: 'linear-gradient(135deg, #00E5FF, #3B0A6B)',
                        color: '#050505',
                        width: '36px', height: '36px',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 900,
                        boxShadow: '0 0 15px rgba(0, 229, 255, 0.5)'
                      }}>
                        ✨
                      </span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                          ✨ Newly Added to iMovies
                        </h3>
                        <span style={{ color: '#00E5FF', fontSize: '0.8rem', fontWeight: 700 }}>
                          Latest titles added to the catalog • Ready for seat booking
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="row g-2 g-md-3">
                    {curatedSections.newlyAdded.slice(0, 6).map((movie) => (
                      <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* SECTION 2: NOW SHOWING (NEW RELEASES) */}
              <section className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{
                      background: 'rgba(59, 10, 107, 0.5)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      color: '#00E5FF',
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      <FontAwesomeIcon icon={faFilm} />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        🎬 Now Showing in Theatres
                      </h3>
                      <span style={{ color: '#8E7BB0', fontSize: '0.8rem' }}>
                        Fresh theatrical releases currently screening in {city}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('nowPlaying')}
                    className="btn-outline-cyan"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '18px' }}
                  >
                    View All Screenings
                  </button>
                </div>

                {curatedLoading ? (
                  <div className="row g-2 g-md-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row g-2 g-md-3">
                    {curatedSections.nowPlaying.slice(0, 6).map((movie) => (
                      <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 3: TOP RATED BLOCKBUSTERS */}
              <section className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{
                      background: 'rgba(255, 184, 0, 0.15)',
                      border: '1px solid rgba(255, 184, 0, 0.4)',
                      color: '#FFB800',
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      <FontAwesomeIcon icon={faStar} />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        ⭐ Critically Acclaimed & Top Rated
                      </h3>
                      <span style={{ color: '#8E7BB0', fontSize: '0.8rem' }}>
                        Highest audience-rated masterpieces on TMDB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('topRated')}
                    className="btn-outline-cyan"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '18px' }}
                  >
                    View All Top Rated
                  </button>
                </div>

                {curatedLoading ? (
                  <div className="row g-2 g-md-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row g-2 g-md-3">
                    {curatedSections.topRated.slice(0, 6).map((movie) => (
                      <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 4: UPCOMING ATTRACTIONS */}
              <section className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{
                      background: 'rgba(107, 23, 184, 0.3)',
                      border: '1px solid rgba(196, 181, 253, 0.3)',
                      color: '#C4B5FD',
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        🚀 Upcoming Screenings
                      </h3>
                      <span style={{ color: '#8E7BB0', fontSize: '0.8rem' }}>
                        Blockbusters premiering in theatres soon
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('upcoming')}
                    className="btn-outline-cyan"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '18px' }}
                  >
                    View All Upcoming
                  </button>
                </div>

                {curatedLoading ? (
                  <div className="row g-2 g-md-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row g-2 g-md-3">
                    {curatedSections.upcoming.slice(0, 6).map((movie) => (
                      <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
