import React, { useState } from 'react';
import { Star, Sparkles, Play, Info } from 'lucide-react';
import { Movie } from '../types.ts';

interface MovieCardProps {
  movie: Movie;
  onOpenMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  onToggleReminder?: (movie: Movie) => void;
  hasReminder?: boolean;
  key?: number;
}

import { Bell, Check } from 'lucide-react';

export default function MovieCard({ movie, onOpenMovie, onPlayTrailer, onToggleReminder, hasReminder }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);

  const rawPosterPath = movie.poster_path || (movie as any).posterPath;
  const posterUrl = rawPosterPath
    ? (rawPosterPath.startsWith('http')
        ? rawPosterPath
        : `https://image.tmdb.org/t/p/w500${rawPosterPath}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';

  const displayPoster = posterUrl;
  const rawReleaseDate = movie.release_date || (movie as any).releaseDate;
  const releaseYear = rawReleaseDate ? rawReleaseDate.substring(0, 4) : 'N/A';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenMovie(movie)}
      className="relative flex-none w-[140px] md:w-[180px] h-[210px] md:h-[270px] rounded-md overflow-hidden bg-[#0F172A] border border-transparent hover:border-slate-700 cursor-pointer transform transition-all duration-300 group"
      id={`movie-card-${movie.id}`}
    >
      {/* Poster Image */}
      <img
        src={displayPoster}
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-110"
        loading="lazy"
      />

      {/* Floating Badge (CineLuxe Premium) */}
      <div className="absolute top-1.5 left-1.5 z-10">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[7.5px] font-sans font-black px-1.5 py-0.5 rounded shadow-lg shadow-amber-950/50 uppercase tracking-wider">
          CineLuxe
        </div>
      </div>

      {/* Hover Overlay Panels */}
      {hovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent flex flex-col justify-end p-3 md:p-4 animate-fade-in">
          
          <div className="space-y-1 text-left">
            {/* Title & Metadata */}
            <h4 className="text-xs md:text-sm font-sans font-bold text-white line-clamp-2 leading-snug">
              {movie.title}
            </h4>
            
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-sans">
              <span className="text-green-500 font-bold">{movie.vote_average ? movie.vote_average.toFixed(1) : '8.5'} ★</span>
              <span>•</span>
              <span>{releaseYear}</span>
            </div>

            {/* Quick Actions overlay */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayTrailer(movie);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-sm bg-white hover:bg-slate-200 text-black text-[10px] font-bold transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-black" />
                Play
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMovie(movie);
                }}
                className="p-1.5 rounded-sm bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer backdrop-blur-md"
                title="Details"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
