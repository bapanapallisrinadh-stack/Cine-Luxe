import { useState, useEffect } from 'react';
import { X, Star, Sparkles, MapPin, Calendar, Globe } from 'lucide-react';
import { CastMember } from '../types.ts';

interface ActorModalProps {
  actorId: number;
  onClose: () => void;
}

export default function ActorModal({ actorId, onClose }: ActorModalProps) {
  const [actor, setActor] = useState<CastMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/actors/${actorId}`)
      .then(res => res.json())
      .then(data => {
        setActor(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [actorId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[60] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 font-mono text-xs">Fetching actor portfolio...</p>
        </div>
      </div>
    );
  }

  if (!actor) return null;

  const profileUrl = actor.profile_path && actor.profile_path.startsWith('http')
    ? actor.profile_path
    : `https://image.tmdb.org/t/p/w500${actor.profile_path}`;

  const displayProfile = actor.profile_path
    ? profileUrl
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] overflow-y-auto px-4 py-8 flex items-center justify-center">
      <div 
        className="relative max-w-3xl w-full rounded-2xl bg-[#0F172A] border border-slate-800 text-white shadow-2xl overflow-hidden"
        id="actor-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-slate-800 hover:text-rose-400 text-slate-300 transition-colors cursor-pointer"
          id="close-actor-modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8">
          {/* Left Column: Image & Personal info */}
          <div className="md:col-span-1 space-y-4 text-center md:text-left">
            <div className="w-48 h-64 mx-auto md:w-full md:h-auto rounded-xl overflow-hidden border border-slate-800 shadow-lg">
              <img
                src={displayProfile}
                alt={actor.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 justify-center md:justify-start text-xs text-slate-400 font-sans">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Born: {actor.birthday || 'International'}</span>
              </div>
              {actor.place_of_birth && (
                <div className="flex items-center gap-2 justify-center md:justify-start text-xs text-slate-400 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate">{actor.place_of_birth}</span>
                </div>
              )}
              {actor.nationality && (
                <div className="flex items-center gap-2 justify-center md:justify-start text-xs text-slate-400 font-sans">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nationality: {actor.nationality}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bio & Filmography */}
          <div className="md:col-span-2 space-y-6 text-left">
            <div className="space-y-1.5">
              <h3 className="text-xl md:text-2xl font-sans font-extrabold text-white tracking-tight">
                {actor.name}
              </h3>
              {actor.popularity && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                  <Star className="w-3 h-3 fill-amber-300" />
                  Popularity Score: {Math.floor(actor.popularity)}
                </div>
              )}
            </div>

            {/* Biography */}
            <div className="space-y-2">
              <h4 className="text-xs font-sans font-bold text-indigo-400 uppercase tracking-wider">Biography</h4>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-h-48 overflow-y-auto pr-1">
                {actor.biography || `${actor.name} is a highly accomplished international cinematic talent known for their iconic character interpretations, deep dramatic presence, and multiple collaborations with legendary award-winning directors.`}
              </p>
            </div>

            {/* Filmography / Known For */}
            <div className="space-y-3">
              <h4 className="text-xs font-sans font-bold text-indigo-400 uppercase tracking-wider">Known For</h4>
              {actor.known_for && actor.known_for.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {actor.known_for.map((kf, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800/80 rounded-lg text-xs font-sans font-semibold text-slate-300 hover:text-white hover:border-indigo-500/40 transition-colors"
                    >
                      🎬 {kf}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No filmography indexed in current library.</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
