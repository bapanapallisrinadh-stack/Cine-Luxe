import { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, Heart, Star, Sparkles, Info } from 'lucide-react';
import { Movie } from '../types.ts';

interface HeroBannerProps {
  movie: Movie;
  onPlayTrailer: (movie: Movie) => void;
  onOpenMovie: (movie: Movie) => void;
  authToken: string | null;
}

export default function HeroBanner({ movie, onPlayTrailer, onOpenMovie, authToken }: HeroBannerProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const [autoplay, setAutoplay] = useState(() => {
    return localStorage.getItem('tflix_autoplay') === 'true';
  });
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    localStorage.setItem('tflix_autoplay', String(autoplay));
  }, [autoplay]);

  useEffect(() => {
    if (autoplay && movie && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      const timer = setTimeout(() => {
        onPlayTrailer(movie);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoplay, movie, onPlayTrailer]);

  useEffect(() => {
    if (authToken && movie) {
      fetch(`/api/movies/${movie.id}/state`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(res => res.json())
        .then(data => {
          setInWatchlist(data.inWatchlist);
          setInFavorites(data.inFavorites);
          setUserRating(data.userRating);
        })
        .catch(err => console.error('Error fetching hero movie state:', err));
    }
  }, [movie, authToken]);

  const handleWatchlistToggle = async () => {
    if (!authToken) {
      alert('Please login to manage your watchlist.');
      return;
    }
    try {
      const res = await fetch(`/api/movies/${movie.id}/watchlist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInWatchlist(data.inWatchlist);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!authToken) {
      alert('Please login to manage your favorites.');
      return;
    }
    try {
      const res = await fetch(`/api/movies/${movie.id}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInFavorites(data.inFavorites);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rawBackdropPath = movie && (movie.backdrop_path || (movie as any).backdropPath);
  const backdropUrl = rawBackdropPath 
    ? (rawBackdropPath.startsWith('http') 
        ? rawBackdropPath 
        : `https://image.tmdb.org/t/p/original${rawBackdropPath}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';

  return (
    <div 
      className="relative w-full h-[70vh] md:h-[85vh] flex items-end overflow-hidden group"
      id="hero-banner"
    >
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top opacity-70 group-hover:scale-105 transition-transform duration-[10000ms] ease-out"
        />
        {/* Complex Gradient Overlays - Netflix style (darker left and bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#030712]/80 to-transparent w-[85%] md:w-[60%]" />
      </div>

      {/* Main Metadata Panel */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 md:pb-20 space-y-4 md:space-y-6">
        
        {/* Dynamic Highlight Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-sans font-extrabold uppercase tracking-wider shadow-lg shadow-amber-500/10">
            CineLuxe Exclusive
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-sans uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#FACC15]" />
            98% Match
          </span>
        </div>

        {/* Big Display Title */}
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tighter text-white leading-[1.1] drop-shadow-2xl">
          {movie.title}
        </h2>

        {/* Year, Runtime, Genres */}
        <div className="flex flex-wrap items-center gap-3 text-slate-300 text-sm font-sans font-medium">
          <span className="text-green-400 font-bold">{movie.vote_average.toFixed(1)} ★</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>{movie.release_date?.substring(0, 4)}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="bg-white/10 px-1.5 rounded text-xs border border-white/20">
            {movie.censor_rating || movie.censorRating || 'U/A 16+'}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>{movie.runtime || 180} min</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {movie.genres?.slice(0, 3).map((g, i) => (
            <span key={g.id}>
              {g.name}
              {i < Math.min(movie.genres.length - 1, 2) && <span className="ml-2 text-slate-600">•</span>}
            </span>
          ))}
        </div>

        {/* Tagline & Overview Description */}
        <p className="text-sm md:text-lg text-slate-300 leading-relaxed max-w-2xl font-sans line-clamp-3 md:line-clamp-4 drop-shadow-md">
          {movie.overview}
        </p>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/* Play/Trailer Button */}
          <button
            onClick={() => onPlayTrailer(movie)}
            className="flex items-center gap-2.5 px-6 py-2.5 md:px-8 md:py-3.5 rounded bg-white hover:bg-slate-200 text-black font-sans font-bold transition-all cursor-pointer text-base md:text-lg"
            id="hero-play-trailer-btn"
          >
            <Play className="w-6 h-6 fill-current" />
            Play
          </button>

          {/* Details Button */}
          <button
            onClick={() => onOpenMovie(movie)}
            className="flex items-center gap-2.5 px-6 py-2.5 md:px-8 md:py-3.5 rounded bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-sans font-bold transition-all cursor-pointer text-base md:text-lg border border-transparent"
            id="hero-more-details-btn"
          >
            <Info className="w-6 h-6" />
            More Info
          </button>

          {/* Autoplay Toggle */}
          <div className="flex items-center gap-3 ml-2 md:ml-4 bg-white/5 backdrop-blur-md px-4 py-2.5 md:py-3.5 rounded border border-white/10">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoplay} 
                onChange={() => setAutoplay(!autoplay)} 
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E50914]"></div>
              <span className="ml-3 text-sm font-sans font-bold text-slate-200 uppercase tracking-wider">Autoplay</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
