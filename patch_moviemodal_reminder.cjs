const fs = require('fs');
let code = fs.readFileSync('src/components/MovieModal.tsx', 'utf-8');

const reminderFunc = `
  const toggleReminder = async () => {
    if (!authToken) {
      alert('Please log in to manage reminders.');
      return;
    }
    try {
      const res = await fetch(\`/api/movies/\${movieId}/reminder\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${authToken}\` },
      });
      if (res.ok) {
        const data = await res.json();
        setHasReminder(data.hasReminder);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRate = async (value: number) => {`;

code = code.replace("  const handleRate = async (value: number) => {", reminderFunc);

fs.writeFileSync('src/components/MovieModal.tsx', code);
