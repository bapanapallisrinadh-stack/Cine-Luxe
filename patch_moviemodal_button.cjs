const fs = require('fs');
let code = fs.readFileSync('src/components/MovieModal.tsx', 'utf-8');

const oldGrid = `<div className="grid grid-cols-2 gap-3">`;

const newGrid = `
            {/* Quick action triggers */}
            <div className={\`grid \${new Date(movie?.release_date || '') > new Date() ? 'grid-cols-3' : 'grid-cols-2'} gap-3\`}>
              {new Date(movie?.release_date || '') > new Date() && (
                <button
                  onClick={toggleReminder}
                  className={\`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer \${hasReminder ? 'bg-amber-600/25 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}\`}
                >
                  {hasReminder ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>Remind Me</span>
                </button>
              )}`;

code = code.replace(oldGrid, newGrid);
fs.writeFileSync('src/components/MovieModal.tsx', code);
