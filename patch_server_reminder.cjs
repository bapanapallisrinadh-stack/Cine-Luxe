const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newEndpoint = `
  // Toggle Reminder
  app.post('/api/movies/:id/reminder', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const movieId = parseInt(req.params.id);

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      const [uPref] = await db.select().from(userPreferences).where(eq(userPreferences.userId, dbUser.id)).limit(1);
      
      let reminders = [];
      let isAdding = true;
      if (uPref) {
        if (uPref.releaseReminders) {
          try {
            reminders = JSON.parse(uPref.releaseReminders);
          } catch(e) {}
        }
        
        if (reminders.includes(movieId)) {
          reminders = reminders.filter((id) => id !== movieId);
          isAdding = false;
        } else {
          reminders.push(movieId);
        }
        
        await db.update(userPreferences)
          .set({ releaseReminders: JSON.stringify(reminders) })
          .where(eq(userPreferences.userId, dbUser.id));
      } else {
        reminders.push(movieId);
        await db.insert(userPreferences).values({
          userId: dbUser.id,
          releaseReminders: JSON.stringify(reminders)
        });
      }

      res.json({ hasReminder: isAdding });
    } catch (error) {
      console.error('Error toggling reminder:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Toggle Watchlist`;

code = code.replace("  // Toggle Watchlist", newEndpoint);
fs.writeFileSync('server.ts', code);
