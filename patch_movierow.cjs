const fs = require('fs');
let code = fs.readFileSync('src/components/MovieRow.tsx', 'utf-8');

code = code.replace(
  "onPlayTrailer: (movie: Movie) => void;",
  "onPlayTrailer: (movie: Movie) => void;\n  onToggleReminder?: (movie: Movie) => void;\n  reminders?: number[];"
);

code = code.replace(
  "export default function MovieRow({ title, movies, onOpenMovie, onPlayTrailer, icon }: MovieRowProps) {",
  "export default function MovieRow({ title, movies, onOpenMovie, onPlayTrailer, icon, onToggleReminder, reminders = [] }: MovieRowProps) {"
);

code = code.replace(
  "<MovieCard key={movie.id || index} movie={movie} onOpenMovie={onOpenMovie} onPlayTrailer={onPlayTrailer} />",
  "<MovieCard key={movie.id || index} movie={movie} onOpenMovie={onOpenMovie} onPlayTrailer={onPlayTrailer} onToggleReminder={onToggleReminder} hasReminder={reminders.includes(movie.id)} />"
);

fs.writeFileSync('src/components/MovieRow.tsx', code);
