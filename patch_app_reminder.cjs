const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const reminderToggle = `
  const handleToggleReminder = async (movie: Movie) => {
    if (!authToken) {
      alert('Please log in to manage reminders.');
      return;
    }
    try {
      const res = await fetch(\`/api/movies/\${movie.id}/reminder\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${authToken}\` },
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
  };

  const handlePlayTrailer = (movie: Movie) => {`;

code = code.replace("  const handlePlayTrailer = (movie: Movie) => {", reminderToggle);
fs.writeFileSync('src/App.tsx', code);
