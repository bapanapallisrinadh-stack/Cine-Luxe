const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const stateDecls = `
  // Database-backed list state
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [reminders, setReminders] = useState<number[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);`;

code = code.replace(`
  // Database-backed list state
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);`, stateDecls);

const fetchFuncs = `
  const fetchWatchlist = async () => {`;

const newFetchFuncs = `
  const fetchPreferences = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/preferences', {
        headers: { Authorization: \`Bearer \${token}\` },
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

  const fetchWatchlist = async () => {`;

code = code.replace(fetchFuncs, newFetchFuncs);

const loadEffect = `
  useEffect(() => {
    if (token) {
      setLoadingLists(true);
      Promise.all([fetchWatchlist(), fetchFavorites()]).finally(() => {
        setLoadingLists(false);
      });
    } else {
      setWatchlistMovies([]);
      setFavoriteMovies([]);
    }
  }, [token]);`;

const newLoadEffect = `
  useEffect(() => {
    if (token) {
      setLoadingLists(true);
      Promise.all([fetchWatchlist(), fetchFavorites(), fetchPreferences()]).finally(() => {
        setLoadingLists(false);
      });
    } else {
      setWatchlistMovies([]);
      setFavoriteMovies([]);
      setReminders([]);
    }
  }, [token]);`;

code = code.replace(loadEffect, newLoadEffect);

const reminderToggle = `
  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovieId(movie.id);
  };

  const handleToggleReminder = async (movie: Movie) => {
    if (!token) {
      alert('Please log in to manage reminders.');
      return;
    }
    try {
      const res = await fetch(\`/api/movies/\${movie.id}/reminder\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` },
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
  };`;

code = code.replace(`
  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovieId(movie.id);
  };`, reminderToggle);

code = code.replace(
  `title="Coming Soon"
              movies={upcomingMovies}
              onOpenMovie={handleOpenMovie}
              onPlayTrailer={handlePlayTrailer}
              icon={<Calendar className="w-6 h-6 text-slate-400" />}`,
  `title="Coming Soon"
              movies={upcomingMovies}
              onOpenMovie={handleOpenMovie}
              onPlayTrailer={handlePlayTrailer}
              onToggleReminder={handleToggleReminder}
              reminders={reminders}
              icon={<Calendar className="w-6 h-6 text-slate-400" />}`
);

fs.writeFileSync('src/App.tsx', code);
