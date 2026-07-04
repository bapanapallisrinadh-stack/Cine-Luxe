import { useState } from 'react';
import { Sparkles, Send, ArrowRight, Loader, Compass, MessageSquare } from 'lucide-react';
import { Movie } from '../types.ts';
import MovieCard from './MovieCard.tsx';

interface AIConciergeProps {
  onOpenMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  moviesPool: Movie[];
}

export default function AIConcierge({ onOpenMovie, onPlayTrailer, moviesPool }: AIConciergeProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation: string;
    matchedMovies: Movie[];
  } | null>(null);

  // Preset quick prompt ideas
  const PRESETS = [
    "A mind-bending sci-fi with beautiful visual effects and an emotional father-daughter bond.",
    "A gripping historical drama about tension, politics, and massive scientific breakthrough.",
    "A gorgeous animated story of multiverse spiders with unmatched visual art styles.",
    "An intense, dark psychological thriller with iconic villains and chaos in a city."
  ];

  const handleRecommend = async (inputStr: string) => {
    if (!inputStr.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputStr }),
      });

      if (res.ok) {
        const data = await res.json();
        const recommendedIds = data.recommended_ids || [];
        
        // Match IDs with actual movie objects from pool to render gorgeous active movie cards
        const matched = moviesPool.filter(m => recommendedIds.includes(m.id));

        // If no matches (fallback/offline mode), choose 2 beautiful movies
        const finalMatches = matched.length > 0 ? matched : moviesPool.slice(0, 2);

        setResult({
          explanation: data.explanation || "Based on your prompt, we matched your cinematic inquiry with our top-rated CineLuxe masterpieces.",
          matchedMovies: finalMatches,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-tr from-[#1E1B4B]/80 to-[#0F172A]/90 border border-indigo-500/20 shadow-2xl relative overflow-hidden" id="ai-concierge-panel">
      {/* Background visual glows */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner header */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-white shadow-xl shadow-indigo-500/10">
            <Sparkles className="w-6 h-6 text-[#FACC15] animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-sans font-extrabold text-white tracking-tight flex items-center gap-2">
              CineLuxe AI Concierge
            </h3>
            <p className="text-xs md:text-sm text-indigo-300 font-sans mt-0.5 leading-relaxed">
              Describe your mood, requested sub-genres, specific visual styles, or preferred themes. Our Gemini-powered system will analyze your criteria and build your custom cinema screening.
            </p>
          </div>
        </div>

        {/* Preset prompt selectors */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" /> Choose a preset inspiration
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(preset);
                  handleRecommend(preset);
                }}
                disabled={isLoading}
                className="text-left px-3 py-1.5 rounded-lg bg-[#1E293B]/60 hover:bg-[#1E293B] border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer font-sans"
              >
                {preset.substring(0, 75)}...
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRecommend(prompt);
          }}
          className="relative flex items-center"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your movie vibe here... (e.g. A beautiful, emotional visual sci-fi masterpiece with high rating)"
            rows={2}
            disabled={isLoading}
            className="w-full px-4 py-3 pr-16 text-xs md:text-sm rounded-xl bg-slate-900 border border-slate-800 placeholder-slate-400 text-white focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all resize-none shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="absolute right-3 p-3.5 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] hover:from-indigo-500 hover:to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-105 cursor-pointer shadow-lg shadow-indigo-500/15"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Recommendation Output Display */}
        {isLoading && (
          <div className="p-8 rounded-xl bg-slate-900/35 border border-dashed border-slate-800 flex flex-col items-center justify-center gap-3 animate-pulse">
            <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-indigo-300 font-mono">Analyzing screenplay databases, reviews, and scoring recommendations via Gemini...</p>
          </div>
        )}

        {result && (
          <div className="p-5 md:p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-5 animate-fade-in text-left">
            {/* Explanatory notes */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono font-bold text-amber-400 tracking-widest flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> AI Analysis Notes
              </span>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans font-normal">
                {result.explanation}
              </p>
            </div>

            {/* Matched Movies horizontal card listing */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                Matched CineLuxe Showings:
              </span>
              <div className="flex flex-wrap gap-4 pt-1">
                {result.matchedMovies.map((movie) => (
                  <div key={movie.id} className="transform scale-95 origin-bottom-left">
                    <MovieCard
                      movie={movie}
                      onOpenMovie={onOpenMovie}
                      onPlayTrailer={onPlayTrailer}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
