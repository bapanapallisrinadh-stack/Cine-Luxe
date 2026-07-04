import React, { useState, useEffect } from 'react';
import { X, Save, Check, Star } from 'lucide-react';
import { UserPreferences } from '../types.ts';

interface UserPreferencesModalProps {
  onClose: () => void;
  authToken: string | null;
}

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 
  'Thriller', 'War', 'Western'
];

export default function UserPreferencesModal({ onClose, authToken }: UserPreferencesModalProps) {
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteActors, setFavoriteActors] = useState<string[]>([]);
  const [favoriteDirectors, setFavoriteDirectors] = useState<string[]>([]);
  const [languagePreference, setLanguagePreference] = useState('en');
  const [preferredYearsRange, setPreferredYearsRange] = useState('2010-2026');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (authToken) {
      fetch('/api/user/preferences', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(res => res.json())
        .then((data) => {
          if (data) {
            setFavoriteGenres(JSON.parse(data.favoriteGenres || '[]'));
            setFavoriteActors(JSON.parse(data.favoriteActors || '[]'));
            setFavoriteDirectors(JSON.parse(data.favoriteDirectors || '[]'));
            setLanguagePreference(data.languagePreference || 'en');
            setPreferredYearsRange(data.preferredYearsRange || '2010-2026');
          }
        })
        .catch(err => console.error('Error fetching preferences:', err));
    }
  }, [authToken]);

  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          favoriteGenres,
          favoriteActors,
          favoriteDirectors,
          languagePreference,
          preferredYearsRange,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        className="relative max-w-lg w-full rounded-2xl bg-[#0F172A] border border-slate-800 text-white shadow-2xl overflow-hidden"
        id="user-preferences-modal"
      >
        {/* Close trigger */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:text-rose-400 text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6 text-left">
          <div className="space-y-1.5">
            <h3 className="text-xl font-sans font-extrabold text-white tracking-tight flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FACC15]" /> Profile Preferences
            </h3>
            <p className="text-xs text-slate-400">
              Customize your CineLuxe recommendations by specifying your preferred cinematic eras, genres, and languages.
            </p>
          </div>

          {/* Genres selections */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-sans">
              Favorite Genres
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-800/80 rounded-lg bg-slate-950/50">
              {AVAILABLE_GENRES.map((genre) => {
                const active = favoriteGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-md text-xs font-sans transition-all cursor-pointer ${active ? 'bg-indigo-600 border border-indigo-500 text-white font-semibold' : 'bg-[#1E293B]/60 border border-slate-800 text-slate-300 hover:text-white'}`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Year Era selections */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-sans">
                Preferred Era
              </label>
              <select
                value={preferredYearsRange}
                onChange={(e) => setPreferredYearsRange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="2020-2026">2020s (Modern Masterpieces)</option>
                <option value="2010-2020">2010s (Golden Blockbusters)</option>
                <option value="2000-2010">2000s (Classic Cinephile Era)</option>
                <option value="1990-2000">1990s (Retro Cinema)</option>
                <option value="1900-1990">Pre-1990s (Vintage Legends)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-sans">
                Language
              </label>
              <select
                value={languagePreference}
                onChange={(e) => setLanguagePreference(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="en">English (US/UK)</option>
                <option value="fr">French (Cinéma d'art)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ja">Japanese (Cinema Classics)</option>
              </select>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saveSuccess ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold animate-fade-in">
                <Check className="w-4 h-4" /> Preferences Synchronized!
              </span>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/25"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Synchronizing...' : 'Save Preferences'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
