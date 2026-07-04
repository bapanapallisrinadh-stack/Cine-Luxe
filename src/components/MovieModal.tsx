import React, { useState, useEffect } from 'react';
import { X, Star, Sparkles, Heart, Plus, Check, Play, Send, Calendar, Clock, DollarSign, Award, Bell, Share2, Copy, Twitter, MessageSquare } from 'lucide-react';
import { Movie, Review, CastMember, CrewMember } from '../types.ts';

interface MovieModalProps {
  movieId: number;
  onClose: () => void;
  authToken: string | null;
  onOpenActor: (actorId: number) => void;
  onOpenMovie?: (movieId: number) => void;
  theme?: 'dark' | 'light';
}

export default function MovieModal({ movieId, onClose, authToken, onOpenActor, onOpenMovie, theme = 'dark' }: MovieModalProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive User States
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Review form states
  const [reviewText, setReviewText] = useState('');
  const [reviewSummary, setReviewSummary] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(8);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Active Trailer Video
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);

  // Share state & actions
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const shareLink = movie ? `${window.location.origin}/?movie=${movie.id}` : '';
  const shareSnippet = movie 
    ? `🍿 Just discovered "${movie.title}" (${movie.release_date?.substring(0, 4)}) on CineLuxe!\n\n"${movie.tagline || movie.overview?.substring(0, 80) + '...'}"\n\nRating: ${movie.vote_average ? movie.vote_average.toFixed(1) : '8.5'}/10 ★\nCheck it out here: ${shareLink}`
    : '';

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error('Failed to copy link via navigator.clipboard', e);
    }
  };

  const copySnippet = () => {
    try {
      navigator.clipboard.writeText(shareSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch (e) {
      console.error('Failed to copy snippet via navigator.clipboard', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Fetch Movie details
    fetch(`/api/movies/${movieId}`)
      .then(res => res.json())
      .then(data => {
        setMovie(data);
        if (data.trailers && data.trailers.length > 0) {
          setActiveVideoKey(data.trailers[0].key);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch Community Reviews
    fetch(`/api/movies/${movieId}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error(err));

    // Fetch Similar Movies (using popular as fallback/proxy for now)
    fetch(`/api/movies/popular`)
      .then(res => res.json())
      .then((data: Movie[]) => {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setSimilarMovies(shuffled.slice(0, 4));
      })
      .catch(err => console.error(err));

    // Fetch logged in user state (watchlist, favorites, personal rating)
    if (authToken) {
      fetch(`/api/movies/${movieId}/state`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(res => res.json())
        .then(data => {
          setInWatchlist(data.inWatchlist);
          setInFavorites(data.inFavorites);
          setUserRating(data.userRating);
          setHasReminder(data.hasReminder || false);
        })
        .catch(err => console.error('Error fetching user movie state:', err));
    }
  }, [movieId, authToken]);

  const toggleWatchlist = async () => {
    if (!authToken) {
      alert('Please log in to manage your watchlist.');
      return;
    }
    try {
      const res = await fetch(`/api/movies/${movieId}/watchlist`, {
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

  const toggleFavorite = async () => {
    if (!authToken) {
      alert('Please log in to manage your favorites.');
      return;
    }
    try {
      const res = await fetch(`/api/movies/${movieId}/favorite`, {
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

  const toggleReminder = async () => {
    if (!authToken) {
      alert('Please log in to manage reminders.');
      return;
    }
    try {
      const res = await fetch(`/api/movies/${movieId}/reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHasReminder(data.hasReminder || false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRate = async (val: number) => {
    if (!authToken) {
      alert('Please log in to rate movies.');
      return;
    }
    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/movies/${movieId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ value: val }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserRating(val);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      alert('Please log in to submit a review.');
      return;
    }
    if (!reviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/movies/${movieId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: reviewText,
          summary: reviewSummary || null,
          rating: reviewRating,
        }),
      });

      if (res.ok) {
        setReviewText('');
        setReviewSummary('');
        // Refresh reviews list
        const updatedReviewsRes = await fetch(`/api/movies/${movieId}/reviews`);
        const updatedReviews = await updatedReviewsRes.json();
        setReviews(updatedReviews);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 ${theme === 'light' ? 'bg-slate-100/80' : 'bg-slate-950/80'} backdrop-blur-md z-50 flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          <p className={`font-mono text-sm ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Decoding cinema data...</p>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const rawPosterPath = movie.poster_path || (movie as any).posterPath;
  const posterUrl = rawPosterPath
    ? (rawPosterPath.startsWith('http') ? rawPosterPath : `https://image.tmdb.org/t/p/w500${rawPosterPath}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';

  const rawBackdropPath = movie.backdrop_path || (movie as any).backdropPath;
  const backdropUrl = rawBackdropPath
    ? (rawBackdropPath.startsWith('http') ? rawBackdropPath : `https://image.tmdb.org/t/p/original${rawBackdropPath}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';

  const getProfileUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  return (
    <div className={`fixed inset-0 ${theme === 'light' ? 'bg-slate-900/60' : 'bg-slate-950/85'} backdrop-blur-md z-50 overflow-y-auto px-4 py-6 md:py-12 flex justify-center transition-all duration-300`}>
      <div 
        className={`relative max-w-5xl w-full rounded-2xl ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#0F172A] border-slate-800 text-white shadow-2xl'} border overflow-hidden self-start flex flex-col transition-all duration-300`}
        id="movie-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-50 p-2.5 rounded-full ${theme === 'light' ? 'bg-white/85 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-500 shadow-md' : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:text-rose-400 text-slate-300'} border transition-colors cursor-pointer`}
          id="close-movie-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Trailer Video / Backdrop section */}
        <div className="relative w-full aspect-video bg-black">
          {activeVideoKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${activeVideoKey}?autoplay=1&mute=0`}
              title={`${movie.title} Trailer`}
              className="w-full h-full object-cover"
              allowFullScreen
              allow="autoplay"
            />
          ) : (
            <div className="w-full h-full relative">
              <img
                src={backdropUrl}
                alt={movie.title}
                className="w-full h-full object-cover filter brightness-50"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-white' : 'from-[#0F172A]'} to-transparent`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                  Trailer unavailable • Rendered from static backdrop
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column Left: Poster & Fast Actions */}
          <div className="md:col-span-1 space-y-6">
            <div className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'border-slate-200 shadow-lg' : 'border-slate-800 shadow-xl'} hidden md:block`}>
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full object-cover"
              />
            </div>

            {/* Accolades & Awards section */}
            {movie.awards && movie.awards.length > 0 && (
              <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-500/10 border-amber-500/20'} border space-y-2`}>
                <div className="flex items-center gap-1.5 text-amber-500 text-xs font-sans font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4 text-[#FACC15]" />
                  <span>Accolades</span>
                </div>
                {movie.awards.map((award, i) => (
                  <p key={i} className={`text-[11px] leading-relaxed font-sans font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {award}
                  </p>
                ))}
              </div>
            )}

            {/* Quick action triggers */}
            
            {/* Quick action triggers */}
            <div className={`grid ${new Date(movie?.release_date || '') > new Date() ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
              {new Date(movie?.release_date || '') > new Date() && (
                <button
                  onClick={toggleReminder}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${hasReminder ? 'bg-amber-600/25 border-amber-500 text-amber-500 font-extrabold' : (theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800')}`}
                >
                  {hasReminder ? <Check className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4" />}
                  <span>Remind Me</span>
                </button>
              )}
              <button
                onClick={toggleWatchlist}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${inWatchlist ? 'bg-indigo-600/25 border-indigo-500 text-indigo-500 font-extrabold' : (theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800')}`}
              >
                {inWatchlist ? <Check className="w-4 h-4 text-indigo-500" /> : <Plus className="w-4 h-4" />}
                <span>Watchlist</span>
              </button>

              <button
                onClick={toggleFavorite}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${inFavorites ? 'bg-rose-600/25 border-rose-500 text-rose-500 font-extrabold' : (theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800')}`}
              >
                <Heart className={`w-4 h-4 ${inFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>Favorite</span>
              </button>
            </div>

            {/* Share action button & dropdown/popover panel */}
            {movie && (
              <div className="relative space-y-2" id="share-action-section">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${showShareOptions ? 'bg-amber-500/20 border-amber-500 text-amber-600 font-extrabold shadow-md shadow-amber-500/5' : (theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white')}`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>{showShareOptions ? 'Close Share Menu' : 'Share Masterpiece'}</span>
                </button>

                {showShareOptions && (
                  <div className={`p-4 rounded-xl border shadow-2xl space-y-4 animate-fade-in z-20 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900/95 border-slate-800 shadow-2xl'}`}>
                    <div className="space-y-1">
                      <h4 className={`text-xs font-bold uppercase tracking-wider font-sans ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Share this Masterpiece</h4>
                      <p className={`text-[10px] font-sans ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Choose how you would like to showcase this film to others.</p>
                    </div>

                    {/* Copy Link Row */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Share Link</label>
                      <div className={`flex items-center gap-2 border p-2 rounded-lg ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                        <input 
                          type="text" 
                          readOnly 
                          value={shareLink} 
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className={`bg-transparent text-[11px] font-mono flex-1 outline-none select-all ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}
                        />
                        <button 
                          onClick={copyLink} 
                          className={`p-1.5 rounded-md hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer`}
                          title="Copy Link"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Social/Copy Snippet Row */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Social Snippet</label>
                        <button 
                          onClick={copySnippet} 
                          className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {copiedSnippet ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Snippet
                            </>
                          )}
                        </button>
                      </div>
                      <div className={`p-3 rounded-lg border text-[11px] font-sans leading-relaxed italic relative ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                        {shareSnippet}
                      </div>
                    </div>

                    {/* Quick Share Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a 
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareSnippet)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] text-[10px] font-bold transition-all cursor-pointer text-center"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                        Share on X
                      </a>
                      <a 
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareSnippet)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] text-[10px] font-bold transition-all cursor-pointer text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Streaming Availability */}
            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#1E293B] border-slate-800 text-slate-300'}`}>
              <h4 className={`text-xs font-sans font-bold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                Streaming Now On
              </h4>
              {movie.streamingProviders && movie.streamingProviders.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {movie.streamingProviders.map((prov, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-1.5 px-3 py-1 border text-[11px] font-sans font-medium rounded-full ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-200'}`}
                    >
                      <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-tr from-indigo-500 to-purple-600 shrink-0" />
                      <span>{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-[11px] leading-relaxed font-sans ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Available to buy or rent on CineLuxe Premier.
                </p>
              )}
            </div>
          </div>

          {/* Column Right: Primary Info, Ratings, Reviews, Cast */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Title, Year, Genres, Run-time */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-2xl md:text-3xl font-sans font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {movie.title}
                </h3>
                {movie.aiScore && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-indigo-500 text-[10px] font-mono uppercase tracking-wider font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Match {movie.aiScore}%
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-500 font-mono italic">"{movie.tagline || 'A CineLuxe Exclusive Screening'}"</p>

              <div className={`flex flex-wrap items-center gap-3 text-xs font-sans pt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> {movie.release_date}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {movie.runtime || 150}m</span>
                {movie.language && (
                  <>
                    <span>•</span>
                    <span className={`font-mono uppercase border px-1.5 py-0.5 rounded text-[10px] ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                      Language: {movie.language}
                    </span>
                  </>
                )}
                {(movie.censor_rating || movie.censorRating) && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border ${
                      (movie.censor_rating || movie.censorRating) === 'U' 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' 
                        : (movie.censor_rating || movie.censorRating) === 'U/A' || (movie.censor_rating || movie.censorRating) === 'UA 16+'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-600' 
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-600'
                    }`}>
                      CBFC: {movie.censor_rating || movie.censorRating}
                    </span>
                  </>
                )}
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  {movie.genres.map(g => (
                    <span key={g.id} className={`border px-2 py-0.5 rounded text-[10px] ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Overview / Story synopsis */}
            <div className="space-y-2">
              <h4 className="text-xs font-sans font-bold text-indigo-500 uppercase tracking-wider">Synopsis</h4>
              <p className={`text-sm leading-relaxed font-sans ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                {movie.overview}
              </p>
            </div>

            {/* Movie Financials */}
            <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>Budget</span>
                <p className={`text-sm font-semibold mt-0.5 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  {movie.budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(movie.budget * 83) : '₹12,45,00,00,000'}
                </p>
              </div>
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>Box Office Revenue</span>
                <p className={`text-sm font-semibold mt-0.5 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  {movie.revenue ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(movie.revenue * 83) : '₹62,25,00,00,000'}
                </p>
              </div>
            </div>

            {/* Starring Cast */}
            <div className="space-y-4">
              <h4 className="text-xs font-sans font-bold text-indigo-500 uppercase tracking-wider">Starring Cast</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {movie.cast && movie.cast.length > 0 ? (
                  movie.cast.slice(0, 6).map((c: CastMember) => {
                    const avatarSrc = getProfileUrl(c.profile_path);
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => onOpenActor(c.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer group transition-all duration-300 ${theme === 'light' ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300 hover:shadow-sm' : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800 hover:border-indigo-500/30'}`}
                      >
                        <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border shadow-inner ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                          {avatarSrc ? (
                            <img 
                              src={avatarSrc} 
                              alt={c.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${theme === 'light' ? 'text-slate-500 bg-slate-100' : 'text-slate-400 bg-slate-800'}`}>
                              {c.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold group-hover:text-indigo-500 transition-colors truncate ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{c.name}</div>
                          <div className={`text-[10px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{c.character}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 col-span-3 italic">Cast information pending.</p>
                )}
              </div>
            </div>

            {/* Creative Crew */}
            {movie.crew && movie.crew.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-sans font-bold text-indigo-500 uppercase tracking-wider">Creative Crew</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {movie.crew.slice(0, 6).map((cr: CrewMember) => {
                    const avatarSrc = getProfileUrl(cr.profile_path);
                    return (
                      <div 
                        key={cr.id + '-' + cr.job}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'}`}
                      >
                        <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border shadow-inner ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                          {avatarSrc ? (
                            <img 
                              src={avatarSrc} 
                              alt={cr.name} 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${theme === 'light' ? 'text-slate-500 bg-slate-100' : 'text-slate-400 bg-slate-800'}`}>
                              {cr.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{cr.name}</div>
                          <div className={`text-[10px] font-mono tracking-wider uppercase truncate mt-0.5 ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-300'}`}>{cr.job}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CineLuxe Cast Rating Wheels & Star submission */}
            <div className={`p-5 rounded-xl border space-y-4 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#1E293B]/70 border-slate-800'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className={`text-sm font-sans font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>CineLuxe Critic & Fan Ratings</h4>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Cast your official cinematic rating on a scale of 1 to 10.</p>
                </div>
                <div className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-amber-500 font-sans font-extrabold text-lg ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span>{movie.vote_average ? movie.vote_average.toFixed(1) : '8.5'}</span>
                  <span className="text-slate-400 text-xs font-normal">/ 10</span>
                </div>
              </div>

              {/* Dynamic click-rate selection */}
              <div className="flex flex-col items-center gap-2 py-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {userRating ? `Your Rating: ${userRating} ★` : 'Click a Star to Submit Your Rating'}
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      disabled={isSubmittingRating}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`w-6 h-6 transition-colors ${userRating && userRating >= star ? 'fill-[#FACC15] text-[#FACC15]' : 'text-slate-400 hover:text-amber-500'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Community Reviews & Comments */}
            <div className="space-y-6">
              <div className={`flex items-center justify-between border-b pb-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                <h4 className="text-xs font-sans font-bold text-indigo-500 uppercase tracking-wider">
                  Community Reviews ({reviews.length})
                </h4>
              </div>

              {/* Review Input Box */}
              {authToken ? (
                <form onSubmit={handleReviewSubmit} className={`space-y-3 p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#111827] border-slate-800'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Review summary / title (e.g. Masterpiece!)"
                      value={reviewSummary}
                      onChange={(e) => setReviewSummary(e.target.value)}
                      className={`w-full px-3.5 py-2 text-xs rounded-lg border placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}
                    />
                    <div className="flex items-center gap-2 pl-1">
                      <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Score rating:</span>
                      <select 
                        value={reviewRating}
                        onChange={(e)=>setReviewRating(parseInt(e.target.value))}
                        className={`border rounded-lg py-1 px-3 text-xs focus:outline-none focus:border-indigo-500 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}
                      >
                        {[10,9,8,7,6,5,4,3,2,1].map(n=>(
                          <option key={n} value={n}>{n} ★</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write your beautiful CineLuxe review. Express your cinematic thoughts..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 text-xs rounded-lg border placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] resize-none ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/25"
                    >
                      <Send className="w-3 h-3" />
                      Post Review
                    </button>
                  </div>
                </form>
              ) : (
                <div className={`p-4 rounded-xl border border-dashed text-center ${theme === 'light' ? 'border-slate-300 bg-slate-50/50' : 'border-slate-800 bg-slate-900/30'}`}>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sign in to join the CineLuxe conversation and submit your review.
                  </p>
                </div>
              )}

              {/* Reviews Thread */}
              <div className={`space-y-4 max-h-[300px] overflow-y-auto divide-y pr-2 ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    Be the first to review this cinematic piece. Write your review above!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img 
                            src={rev.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} 
                            alt={rev.user?.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{rev.user?.name || 'Anon Cinephile'}</span>
                        </div>
                        {rev.rating && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${theme === 'light' ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-300'}`}>
                            ★ {rev.rating}/10
                          </span>
                        )}
                      </div>
                      
                      {rev.summary && (
                        <h5 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                          {rev.summary}
                        </h5>
                      )}
                      
                      <p className={`text-xs leading-relaxed font-sans whitespace-pre-wrap ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {rev.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <div className={`space-y-4 pt-6 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                <h4 className="text-xs font-sans font-bold text-indigo-500 uppercase tracking-wider">
                  You Might Also Like
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {similarMovies.map(sm => {
                    const smPosterUrl = sm.poster_path
                      ? (sm.poster_path.startsWith('http') ? sm.poster_path : `https://image.tmdb.org/t/p/w342${sm.poster_path}`)
                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=342&auto=format&fit=crop';
                    
                    return (
                      <div 
                        key={sm.id}
                        className={`group relative rounded-lg overflow-hidden border cursor-pointer ${theme === 'light' ? 'border-slate-200 shadow-sm' : 'border-slate-800'}`}
                        onClick={() => {
                          if (onOpenMovie) onOpenMovie(sm.id);
                        }}
                      >
                        <div className="aspect-[2/3] w-full bg-slate-900">
                          <img 
                            src={smPosterUrl} 
                            alt={sm.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-[10px] font-bold text-white leading-tight truncate">{sm.title}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
