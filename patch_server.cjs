const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  "const uRating = await db.select().from(ratings).where(and(eq(ratings.movieId, movieId), eq(ratings.userId, dbUser.id)));",
  `const uRating = await db.select().from(ratings).where(and(eq(ratings.movieId, movieId), eq(ratings.userId, dbUser.id)));
      const [uPref] = await db.select().from(userPreferences).where(eq(userPreferences.userId, dbUser.id)).limit(1);
      
      let hasReminder = false;
      if (uPref && uPref.releaseReminders) {
        try {
          const reminders = JSON.parse(uPref.releaseReminders);
          if (Array.isArray(reminders) && reminders.includes(movieId)) {
            hasReminder = true;
          }
        } catch(e) {}
      }`
);

code = code.replace(
  "inFavorites: fList.length > 0,",
  `inFavorites: fList.length > 0,
        hasReminder: hasReminder,`
);

fs.writeFileSync('server.ts', code);
