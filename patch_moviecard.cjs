const fs = require('fs');
let code = fs.readFileSync('src/components/MovieCard.tsx', 'utf-8');

code = code.replace(
  "onPlayTrailer: (movie: Movie) => void;",
  "onPlayTrailer: (movie: Movie) => void;\n  onToggleReminder?: (movie: Movie) => void;\n  hasReminder?: boolean;"
);

code = code.replace(
  "export default function MovieCard({ movie, onOpenMovie, onPlayTrailer }: MovieCardProps) {",
  "import { Bell, Check } from 'lucide-react';\n\nexport default function MovieCard({ movie, onOpenMovie, onPlayTrailer, onToggleReminder, hasReminder }: MovieCardProps) {"
);

const newButtons = `            {/* Quick Actions overlay */}
            <div className="flex items-center gap-1.5 pt-1">
              {new Date(rawReleaseDate) > new Date() && onToggleReminder ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReminder(movie);
                  }}
                  className={\`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-sm text-[10px] font-bold transition-colors cursor-pointer \${hasReminder ? 'bg-[#E50914] text-white hover:bg-red-700' : 'bg-white hover:bg-slate-200 text-black'}\`}
                >
                  {hasReminder ? <Check className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                  {hasReminder ? 'Reminded' : 'Remind Me'}
                </button>
              ) : (
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
              )}
                            
              <button`;

code = code.replace(`            {/* Quick Actions overlay */}
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
                            
              <button`, newButtons);

fs.writeFileSync('src/components/MovieCard.tsx', code);
