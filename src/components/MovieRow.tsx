import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types.ts';
import MovieCard from './MovieCard.tsx';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onOpenMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  onToggleReminder?: (movie: Movie) => void;
  reminders?: number[];
  icon?: React.ReactNode;
  theme?: 'dark' | 'light';
}

export default function MovieRow({ title, movies, onOpenMovie, onPlayTrailer, icon, onToggleReminder, reminders = [], theme = 'dark' }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="space-y-4 px-6 md:px-12 relative group" id={`movie-row-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Shelf Header */}
      <div className="flex items-center gap-2">
        {icon && <div className="text-[#E50914]">{icon}</div>}
        <h3 className={`text-xl md:text-2xl font-display font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          {title}
        </h3>
      </div>

      {/* Row Wrapper with Carousel controls */}
      <div className="relative">
        {/* Left Chevron Trigger */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-[-20px] md:left-[-40px] top-1/2 -translate-y-1/2 z-20 h-full w-12 bg-gradient-to-r ${theme === 'light' ? 'from-slate-50' : 'from-[#030712]'} to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden md:flex items-center justify-start`}
        >
          <div className="bg-[#E50914] hover:scale-110 transition-transform rounded-full p-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </button>

        {/* Scrollable container */}
        <div
          ref={rowRef}
          className="flex gap-3 md:gap-4 overflow-x-auto pb-6 pt-1 px-1 hide-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {movies.map((m) => (
            <div key={m.id} className="snap-start shrink-0">
              <MovieCard
                movie={m}
                onOpenMovie={onOpenMovie}
                onPlayTrailer={onPlayTrailer}
              />
            </div>
          ))}
        </div>

        {/* Right Chevron Trigger */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-[-20px] md:right-[-40px] top-1/2 -translate-y-1/2 z-20 h-full w-12 bg-gradient-to-l ${theme === 'light' ? 'from-slate-50' : 'from-[#030712]'} to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden md:flex items-center justify-end`}
        >
          <div className="bg-[#E50914] hover:scale-110 transition-transform rounded-full p-2 text-white">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      </div>
    </div>
  );
}
