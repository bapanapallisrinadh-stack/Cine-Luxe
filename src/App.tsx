import { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Star, Award, Calendar, Film, Play, Info, Check, Plus, 
  HelpCircle, Tv, ArrowLeft, Loader, RefreshCw
} from 'lucide-react';
import { Movie, UserState, CastMember } from './types.ts';
import Header from './components/Header.tsx';
import HeroBanner from './components/HeroBanner.tsx';
import MovieRow from './components/MovieRow.tsx';
import MovieModal from './components/MovieModal.tsx';
import ActorModal from './components/ActorModal.tsx';
import AIConcierge from './components/AIConcierge.tsx';
import UserPreferencesModal from './components/UserPreferencesModal.tsx';
import Footer from './components/Footer.tsx';

type ActiveView = 'home' | 'search' | 'watchlist' | 'favorites';

export default function App() {
  // Navigation & Page State
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Movie collections
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [teluguMovies, setTeluguMovies] = useState<Movie[]>([]);
  
  // Database-backed list state
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [reminders, setReminders] = useState<number[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Selected details
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  // Modals
  const [showAI, setShowAI] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Authentication State
  const [user, setUser] = useState<UserState | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      document.documentElement.classList.remove('light');
      document.body.style.backgroundColor = '#030712';
      document.body.style.color = '#f8fafc';
    }
  }, [theme]);

  // Master Movies Pool (for offline matching in AI concierge)
  const [masterPool, setMasterPool] = useState<Movie[]>([]);

  // 1. Initial Load of Homepage content & URL query parameter checking
  useEffect(() => {
    fetchMovies();

    // Check if '?movie=ID' is present on startup
    const params = new URLSearchParams(window.location.search);
    const movieParam = params.get('movie');
    if (movieParam) {
      const id = parseInt(movieParam, 10);
      if (!isNaN(id)) {
        setSelectedMovieId(id);
      }
    }
  }, []);

  // Update URL search parameters when selectedMovieId changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedMovieId !== null) {
      params.set('movie', selectedMovieId.toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else {
      params.delete('movie');
      const searchStr = params.toString();
      const newUrl = window.location.pathname + (searchStr ? `?${searchStr}` : '');
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [selectedMovieId]);

  const fetchMovies = async () => {
    try {
      const [popular, topRated, upcoming, nowPlaying, telugu] = await Promise.all([
        fetch('/api/movies/popular').then(res => res.json()),
        fetch('/api/movies/top-rated').then(res => res.json()),
        fetch('/api/movies/upcoming').then(res => res.json()),
        fetch('/api/movies/now-playing').then(res => res.json()),
        fetch('/api/movies/telugu').then(res => res.json()),
      ]);

      setPopularMovies(popular);
      setTopRatedMovies(topRated);
      setUpcomingMovies(upcoming);
      setNowPlayingMovies(nowPlaying);
      setTeluguMovies(telugu);

      // Create master pool of movies
      const all = [...popular, ...topRated, ...upcoming, ...nowPlaying, ...telugu];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      setMasterPool(unique);
    } catch (e) {
      console.error('Failed to load movie datasets:', e);
    }
  };

  // 2. Fetch Watchlist and Favorites when auth state or active view changes
  useEffect(() => {
    if (authToken) {
      if (activeView === 'watchlist') {
        fetchWatchlist();
      } else if (activeView === 'favorites') {
        fetchFavorites();
      }
    }
  }, [activeView, authToken]);

  const fetchPreferences = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/user/preferences', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.releaseReminders) {
          try {
            setReminders(JSON.parse(data.releaseReminders));
          } catch(e) {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWatchlist = async () => {
    if (!authToken) return;
    setLoadingLists(true);
    try {
      const res = await fetch('/api/user/watchlist', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlistMovies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchFavorites = async () => {
    if (!authToken) return;
    setLoadingLists(true);
    try {
      const res = await fetch('/api/user/favorites', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteMovies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLists(false);
    }
  };

  // 3. Search triggers
  const handleSearch = async (q: string) => {
    if (!q || q.trim() === '') return;
    setSearchQuery(q);
    setActiveView('search');
    setIsSearching(true);

    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenMovie = (movie: Movie) => {
    setSelectedMovieId(movie.id);
  };


  const handleToggleReminder = async (movie: Movie) => {
    if (!authToken) {
      alert('Please log in to manage reminders.');
      return;
    }
    try {
      const res = await fetch(`/api/movies/${movie.id}/reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasReminder) {
          setReminders(prev => [...prev, movie.id]);
        } else {
          setReminders(prev => prev.filter(id => id !== movie.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayTrailer = (movie: Movie) => {
    setTrailerMovie(movie);
    setSelectedMovieId(movie.id); // Also open details to play inside the modal beautifully!
  };

  const handleOpenActor = (actorId: number) => {
    setSelectedActorId(actorId);
  };

  // Active hero billboard movie (defaults to first item in popular list, i.e. Oppenheimer)
  const heroMovie = popularMovies[0] || masterPool[0];

  return (
    <div className={`min-h-screen transition-all duration-300 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#030712] text-slate-100'} flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 antialiased`}>
      
      {/* Header bar */}
      <Header
        onSearch={handleSearch}
        onOpenAI={() => setShowAI(true)}
        onOpenPreferences={() => setShowPreferences(true)}
        onViewHome={() => {
          setActiveView('home');
          setSearchQuery('');
        }}
        onViewWatchlist={() => setActiveView('watchlist')}
        onViewFavorites={() => setActiveView('favorites')}
        user={user}
        setUser={setUser}
        setAuthToken={setAuthToken}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
      />

      {/* Main viewport */}
      <main className="flex-1 pb-16 space-y-12">
        
        {/* Dynamic route rendering */}
        {activeView === 'home' && (
          <div className="space-y-12">
            {/* Billboard banner */}
            {heroMovie && (
              <HeroBanner
                movie={heroMovie}
                onPlayTrailer={handlePlayTrailer}
                onOpenMovie={handleOpenMovie}
                authToken={authToken}
              />
            )}

            {/* Quick Categories Filter Bar */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-center sm:justify-start gap-3 overflow-x-auto pb-4 hide-scrollbar">
              {['All', 'Action', 'Drama', 'Comedy', 'Romance', 'Sci-Fi', 'Thriller'].map((cat, idx) => (
                <button 
                  key={cat}
                  className={`px-5 py-2 rounded-sm border text-xs font-sans font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    idx === 0 
                      ? (theme === 'light' ? 'bg-slate-900 text-white border-transparent shadow-md' : 'bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]') 
                      : (theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-950 shadow-sm' : 'bg-transparent border-slate-800 text-slate-300 hover:border-slate-500 hover:text-white')
                  }`}
                  onClick={() => handleSearch(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Popular Section (Phase 2) */}
            <MovieRow
              title="Trending Now"
              movies={popularMovies}
              onOpenMovie={handleOpenMovie}
              onPlayTrailer={handlePlayTrailer}
              icon={<Flame className="w-6 h-6 text-[#E50914]" />}
              theme={theme}
            />

            {/* Tollywood Blockbusters (Telugu) */}
            {teluguMovies && teluguMovies.length > 0 && (
              <MovieRow
                title="Tollywood Blockbusters"
                movies={teluguMovies}
                onOpenMovie={handleOpenMovie}
                onPlayTrailer={handlePlayTrailer}
                icon={<Film className="w-6 h-6 text-[#E50914]" />}
                theme={theme}
              />
            )}

            {/* AI Recommendation Spotlight */}
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <AIConcierge 
                onOpenMovie={handleOpenMovie} 
                onPlayTrailer={handlePlayTrailer}
                moviesPool={masterPool}
              />
            </div>

            {/* IMDb-Style Top Rated (Phase 2) */}
            <MovieRow
              title="Top Rated Masterpieces"
              movies={topRatedMovies}
              onOpenMovie={handleOpenMovie}
              onPlayTrailer={handlePlayTrailer}
              icon={<Star className="w-6 h-6 text-[#FACC15] fill-[#FACC15]" />}
              theme={theme}
            />

            {/* Streaming Now - Intertwined Carousel */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
              <div className={`p-8 md:p-10 rounded-xl ${theme === 'light' ? 'bg-gradient-to-br from-white to-slate-100 border-slate-200 shadow-sm' : 'bg-gradient-to-br from-[#0B0F19] to-[#030712] border-slate-800'} border flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 opacity-[0.02] blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-2 font-sans">
                    <Tv className="w-4 h-4 text-amber-500" /> CineLuxe Premium
                  </div>
                  <h3 className={`text-3xl font-display font-extrabold leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Streaming Now</h3>
                  <p className={`text-sm mt-2 max-w-md leading-relaxed font-sans ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Watch premium cinematic events instantly from the comfort of your room. Sign in to sync recommendations across your home theatre.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 relative z-10">
                  {['Peacock', 'HBO Max', 'Netflix', 'Prime Video', 'Apple TV+'].map((p, i) => (
                    <span key={i} className={`px-4 py-2 border text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 hover:border-amber-500/50 shadow-sm' : 'bg-black/50 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50'}`}>
                      🍿 {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Movies (Phase 2) */}
            <MovieRow
              title="Coming Soon"
              movies={upcomingMovies}
              onOpenMovie={handleOpenMovie}
              onPlayTrailer={handlePlayTrailer}
              onToggleReminder={handleToggleReminder}
              reminders={reminders}
              icon={<Calendar className="w-6 h-6 text-slate-400" />}
              theme={theme}
            />

            {/* Award Winners (Phase 2) */}
            <MovieRow
              title="Award-Winning Masterpieces"
              movies={topRatedMovies.filter(m => m.vote_average >= 8.7)}
              onOpenMovie={handleOpenMovie}
              onPlayTrailer={handlePlayTrailer}
              icon={<Award className="w-6 h-6 text-[#FACC15]" />}
              theme={theme}
            />
          </div>
        )}

        {/* Global Search Results view */}
        {activeView === 'search' && (
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-8 text-left">
            <button 
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer font-sans transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            
            <div className="space-y-1">
              <h3 className={`text-2xl font-display font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Search Results
              </h3>
              <p className={`text-xs font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Showing {searchResults.length} matches for "{searchQuery}"
              </p>
            </div>

            {isSearching ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                <p className={`font-sans text-xs uppercase tracking-widest font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Querying database...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className={`p-12 text-center rounded-xl border ${theme === 'light' ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-white/5'}`}>
                <p className={`text-sm font-sans ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  No matching movies found in CineLuxe database. Try searching for "Salaar" or "Pushpa"!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-2">
                {searchResults.map((movie) => (
                  <div key={movie.id} onClick={() => handleOpenMovie(movie)}>
                    <div className={`relative rounded-md overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-slate-400' : 'bg-[#0F172A] border-transparent hover:border-slate-700'} border cursor-pointer transform hover:scale-105 transition-all group`}>
                      <img 
                        src={movie.poster_path || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'} 
                        alt={movie.title} 
                        className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pt-8">
                        <div className="text-xs font-bold text-white line-clamp-1">{movie.title}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{movie.release_date ? movie.release_date.substring(0,4) : '2023'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Watchlist View */}
        {activeView === 'watchlist' && (
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-8 text-left">
            <button 
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer font-sans transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>

            <div className={`flex items-center justify-between border-b pb-4 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <h3 className={`text-2xl font-display font-extrabold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  My Watchlist
                </h3>
                <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Movies synced dynamically from your personal database queue.</p>
              </div>
              <button 
                onClick={fetchWatchlist}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${theme === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Refresh Watchlist"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingLists ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                <p className={`font-sans text-xs uppercase tracking-widest font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Loading queue...</p>
              </div>
            ) : watchlistMovies.length === 0 ? (
              <div className={`p-12 text-center rounded-xl border ${theme === 'light' ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-white/5'}`}>
                <p className={`text-sm font-sans ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Your CineLuxe Watchlist is empty.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchlistMovies.map((movie) => (
                  <div key={movie.id} onClick={() => handleOpenMovie(movie)}>
                    <div className={`relative rounded-md overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-slate-400' : 'bg-[#0F172A] border-transparent hover:border-slate-700'} border cursor-pointer transform hover:scale-105 transition-all group`}>
                      <img 
                        src={movie.posterPath || movie.poster_path || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'} 
                        alt={movie.title} 
                        className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pt-8">
                        <div className="text-xs font-bold text-white line-clamp-1">{movie.title}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{movie.releaseDate ? movie.releaseDate.substring(0,4) : '2023'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Favorites View */}
        {activeView === 'favorites' && (
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-8 text-left">
            <button 
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer font-sans transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>

            <div className={`flex items-center justify-between border-b pb-4 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <h3 className={`text-2xl font-display font-extrabold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  My Favorites
                </h3>
                <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Cinematic masterpieces that resonated deepest with you.</p>
              </div>
              <button 
                onClick={fetchFavorites}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${theme === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Refresh Favorites"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingLists ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                <p className={`font-sans text-xs uppercase tracking-widest font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Loading collection...</p>
              </div>
            ) : favoriteMovies.length === 0 ? (
              <div className={`p-12 text-center rounded-xl border ${theme === 'light' ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-white/5'}`}>
                <p className={`text-sm font-sans ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  No favorites marked yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {favoriteMovies.map((movie) => (
                  <div key={movie.id} onClick={() => handleOpenMovie(movie)}>
                    <div className={`relative rounded-md overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-slate-400' : 'bg-[#0F172A] border-transparent hover:border-slate-700'} border cursor-pointer transform hover:scale-105 transition-all group`}>
                      <img 
                        src={movie.posterPath || movie.poster_path || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'} 
                        alt={movie.title} 
                        className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pt-8">
                        <div className="text-xs font-bold text-white line-clamp-1">{movie.title}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{movie.releaseDate ? movie.releaseDate.substring(0,4) : '2023'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Interactive Overlay Modals */}
      
      {/* Movie Details overlay */}
      {selectedMovieId !== null && (
        <MovieModal
          movieId={selectedMovieId}
          onClose={() => {
            setSelectedMovieId(null);
            setTrailerMovie(null);
          }}
          authToken={authToken}
          onOpenActor={handleOpenActor}
          onOpenMovie={(id) => setSelectedMovieId(id)}
          theme={theme}
        />
      )}

      {/* Actor Portfolio profile overlay */}
      {selectedActorId !== null && (
        <ActorModal
          actorId={selectedActorId}
          onClose={() => setSelectedActorId(null)}
        />
      )}

      {/* Custom User Preferences modal */}
      {showPreferences && (
        <UserPreferencesModal
          onClose={() => setShowPreferences(false)}
          authToken={authToken}
        />
      )}

      {/* Premium Cinematic Footer */}
      <Footer onViewHome={() => {
        setActiveView('home');
        setSearchQuery('');
      }} theme={theme} />

    </div>
  );
}
