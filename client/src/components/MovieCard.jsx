/**
 * MovieCard.jsx - Jet Black, Royal Amethyst & Electric Cyan Glassmorphic Movie Card
 */
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCalendarAlt, faFilm, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';

const StarRating = ({ rating = 0 }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {stars.map((filled, i) => (
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          style={{
            color: filled ? '#FFB800' : 'rgba(107, 23, 184, 0.4)',
            fontSize: '0.75rem',
            marginRight: '1px',
            filter: filled ? 'drop-shadow(0 0 3px rgba(255, 184, 0, 0.6))' : 'none'
          }}
        />
      ))}
      {rating > 0 && (
        <span style={{ color: '#FFB800', fontSize: '0.75rem', fontWeight: 700, marginLeft: '4px' }}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </span>
  );
};

const MovieCard = ({ movie, rank }) => {
  const {
    _id,
    movieName = 'Untitled Movie',
    posterUrl,
    genres = [],
    language = 'English',
    certification = 'UA',
    releaseDate,
    avgRating
  } = movie || {};

  const displayGenres = Array.isArray(genres)
    ? genres.slice(0, 2)
    : (typeof genres === 'string' ? genres.split(',').slice(0, 2) : []);

  return (
    <div className="movie-card h-100">
      {/* Poster Container */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '15px 15px 0 0' }}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movieName}
            className="movie-poster"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback placeholder */}
        <div
          className="poster-placeholder"
          style={{ display: posterUrl ? 'none' : 'flex' }}
        >
          <FontAwesomeIcon icon={faFilm} />
        </div>

        {/* Glossy top overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(180deg, rgba(5,5,5,0.7) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        {/* Certification badge */}
        {certification && (
          <span
            className="badge-cert"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '0.7rem'
            }}
          >
            {certification}
          </span>
        )}

        {/* Rating badge */}
        {avgRating > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(5, 5, 5, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 184, 0, 0.4)',
              borderRadius: '8px',
              padding: '0.2rem 0.55rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#FFB800'
            }}
          >
            <FontAwesomeIcon icon={faStar} style={{ fontSize: '0.7rem' }} />
            {Number(avgRating).toFixed(1)}
          </span>
        )}

        {/* Newly Added Badge */}
        {(!movie.tmdbId || (movie.createdAt && (Date.now() - new Date(movie.createdAt).getTime()) < 14 * 86400000)) && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: avgRating > 0 ? '65px' : '10px',
              background: 'linear-gradient(135deg, #00E5FF, #3B0A6B)',
              color: '#050505',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '0.18rem 0.45rem',
              borderRadius: '6px',
              boxShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
              letterSpacing: '0.06em',
              zIndex: 2,
            }}
          >
            NEW
          </span>
        )}

        {/* Top 10 Rank Badge */}
        {rank && (
          <span
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'linear-gradient(135deg, #00E5FF 0%, #3B0A6B 100%)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '0.2rem 0.65rem',
              fontWeight: 900,
              fontSize: '0.85rem',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 15px rgba(0, 229, 255, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 2,
            }}
          >
            #{rank}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <h6 style={{
          color: 'var(--text-primary)',
          fontWeight: 700,
          fontSize: '0.86rem',
          marginBottom: '0.4rem',
          lineHeight: 1.3,
          minHeight: '2.4em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {movieName}
        </h6>

        {/* Genre Badges */}
        {displayGenres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.45rem' }}>
            {displayGenres.map((g, i) => (
              <span key={i} className="badge-genre" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                {typeof g === 'string' ? g.trim() : g}
              </span>
            ))}
          </div>
        )}

        {/* Language & Rating Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <span className="badge-lang" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>{language}</span>
          {avgRating > 0 && <StarRating rating={avgRating} />}
        </div>

        {/* Release Date */}
        {releaseDate && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: 'var(--cyan-electric)', fontSize: '0.68rem' }} />
            {dayjs(releaseDate).format('DD MMM YYYY')}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View Details Button */}
        <Link
          to={`/moviedetails/${_id}`}
          className="btn-primary-cyan w-100"
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontSize: '0.78rem',
            padding: '0.42rem 0.6rem',
            borderRadius: '8px',
            marginTop: '0.2rem'
          }}
        >
          <FontAwesomeIcon icon={faTicketAlt} style={{ fontSize: '0.72rem' }} />
          View Details
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;
