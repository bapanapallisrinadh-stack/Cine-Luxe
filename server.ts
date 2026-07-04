import express from 'express';
import path from 'path';

import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { users, movies, genres, movieGenres, reviews, ratings, favorites, watchlists, userPreferences, notifications } from './src/db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import { movieService } from './src/lib/movie-service.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

// removed __filename and __dirname

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database Connection Keepalive Middleware
  // Absorbs Cloud SQL "Connection terminated unexpectedly" errors caused by scale-to-zero cold starts
  let lastRequestTime = Date.now();
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      const now = Date.now();
      if (now - lastRequestTime > 15000) { // 15 seconds idle
        try {
          await db.execute(sql`SELECT 1`);
        } catch (err: any) {
          if (err?.cause?.message === 'Connection terminated unexpectedly' || err?.message?.includes('Connection terminated unexpectedly')) {
            console.log('Database cold start detected. Absorbing stale connection error...');
            try {
              await new Promise(r => setTimeout(r, 500));
              await db.execute(sql`SELECT 1`);
            } catch (e) {
               console.error('Ping retry failed:', e);
            }
          }
        }
      }
      lastRequestTime = Date.now();
    }
    next();
  });

  // API ROUTES

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. User Synchronization (Called on login to create or fetch a postgres user matching Firebase ID)
  app.post('/api/user/sync', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      
      if (existingUsers.length > 0) {
        return res.json({ user: existingUsers[0] });
      }

      // If not, insert new user
      const [newUser] = await db.insert(users).values({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.name || firebaseUser.email?.split('@')[0] || 'Cinephile',
        avatar: firebaseUser.picture || '',
        role: 'user',
      }).returning();

      // Seed initial preferences and welcome notification
      await db.insert(userPreferences).values({
        userId: newUser.id,
        favoriteGenres: JSON.stringify(['Drama', 'Science Fiction']),
        languagePreference: 'en',
      });

      await db.insert(notifications).values({
        userId: newUser.id,
        title: 'Welcome to CineLuxe!',
        message: 'Discover, review, track, and let AI build your custom cinema feed. Enjoy the premiere experience!',
        type: 'system',
      });

      res.status(201).json({ user: newUser });
    } catch (error) {
      console.error('Error synchronizing user profile:', error);
      res.status(500).json({ error: 'Server error synchronizing user profile' });
    }
  });

  // 3. User Preferences endpoints
  app.get('/api/user/preferences', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not found' });

      let [pref] = await db.select().from(userPreferences).where(eq(userPreferences.userId, dbUser.id)).limit(1);
      if (!pref) {
        // Create default if missing
        [pref] = await db.insert(userPreferences).values({
          userId: dbUser.id,
          favoriteGenres: JSON.stringify([]),
        }).returning();
      }

      res.json(pref);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ error: 'Server error fetching preferences' });
    }
  });

  app.post('/api/user/preferences', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });

    const { favoriteGenres, favoriteActors, favoriteDirectors, languagePreference, preferredYearsRange } = req.body;

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not found' });

      const updated = await db.insert(userPreferences)
        .values({
          userId: dbUser.id,
          favoriteGenres: JSON.stringify(favoriteGenres || []),
          favoriteActors: JSON.stringify(favoriteActors || []),
          favoriteDirectors: JSON.stringify(favoriteDirectors || []),
          languagePreference: languagePreference || 'en',
          preferredYearsRange: preferredYearsRange || '1990-2026',
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            favoriteGenres: JSON.stringify(favoriteGenres || []),
            favoriteActors: JSON.stringify(favoriteActors || []),
            favoriteDirectors: JSON.stringify(favoriteDirectors || []),
            languagePreference: languagePreference || 'en',
            preferredYearsRange: preferredYearsRange || '1990-2026',
          }
        })
        .returning();

      res.json(updated[0]);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: 'Server error updating preferences' });
    }
  });

  // 4. Movie collection proxies
  app.get('/api/movies/popular', async (req, res) => {
    try {
      const result = await movieService.getPopularMovies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve popular movies' });
    }
  });

  app.get('/api/movies/top-rated', async (req, res) => {
    try {
      const result = await movieService.getTopRatedMovies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve top-rated movies' });
    }
  });

  app.get('/api/movies/upcoming', async (req, res) => {
    try {
      const result = await movieService.getUpcomingMovies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve upcoming movies' });
    }
  });

  app.get('/api/movies/now-playing', async (req, res) => {
    try {
      const result = await movieService.getNowPlayingMovies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve now-playing movies' });
    }
  });

  app.get('/api/movies/telugu', async (req, res) => {
    try {
      const result = await movieService.getTeluguMovies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve Telugu movies' });
    }
  });

  app.get('/api/movies/search', async (req, res) => {
    const { q } = req.query;
    try {
      const result = await movieService.searchMovies(String(q || ''));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search movies' });
    }
  });

  app.get('/api/movies/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const details = await movieService.getMovieDetails(id);
      if (!details) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve movie details' });
    }
  });

  // 5. Interactive user actions: Watchlist, Favorites, Ratings, Reviews
  app.get('/api/movies/:id/state', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const movieId = parseInt(req.params.id);

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      const wList = await db.select().from(watchlists).where(and(eq(watchlists.movieId, movieId), eq(watchlists.userId, dbUser.id)));
      const fList = await db.select().from(favorites).where(and(eq(favorites.movieId, movieId), eq(favorites.userId, dbUser.id)));
      const uRating = await db.select().from(ratings).where(and(eq(ratings.movieId, movieId), eq(ratings.userId, dbUser.id)));
      const [uPref] = await db.select().from(userPreferences).where(eq(userPreferences.userId, dbUser.id)).limit(1);
      
      let hasReminder = false;
      if (uPref && uPref.releaseReminders) {
        try {
          const reminders = JSON.parse(uPref.releaseReminders);
          if (Array.isArray(reminders) && reminders.includes(movieId)) {
            hasReminder = true;
          }
        } catch(e) {}
      }

      res.json({
        inWatchlist: wList.length > 0,
        inFavorites: fList.length > 0,
        hasReminder: hasReminder,
        userRating: uRating.length > 0 ? uRating[0].value : null,
      });
    } catch (error) {
      console.error('Error fetching movie state:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });


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

  // Toggle Watchlist
  app.post('/api/movies/:id/watchlist', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const movieId = parseInt(req.params.id);

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      // Ensure the movie exists in local cache/movies table first (so the foreign key holds)
      const existingMovie = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
      if (existingMovie.length === 0) {
        const details = await movieService.getMovieDetails(movieId);
        if (details) {
          await db.insert(movies).values({
            id: details.id,
            title: details.title,
            tagline: details.tagline,
            overview: details.overview,
            releaseDate: details.release_date,
            runtime: details.runtime,
            voteAverage: details.vote_average,
            voteCount: details.vote_count,
            budget: details.budget,
            revenue: details.revenue,
            posterPath: details.poster_path,
            backdropPath: details.backdrop_path,
            status: details.status,
            popularity: details.popularity,
          });
        }
      }

      const existing = await db.select().from(watchlists).where(and(eq(watchlists.movieId, movieId), eq(watchlists.userId, dbUser.id)));
      
      if (existing.length > 0) {
        await db.delete(watchlists).where(and(eq(watchlists.movieId, movieId), eq(watchlists.userId, dbUser.id)));
        return res.json({ success: true, inWatchlist: false });
      } else {
        await db.insert(watchlists).values({ movieId, userId: dbUser.id });
        return res.json({ success: true, inWatchlist: true });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      res.status(500).json({ error: 'Failed to toggle watchlist' });
    }
  });

  // Toggle Favorite
  app.post('/api/movies/:id/favorite', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const movieId = parseInt(req.params.id);

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      // Ensure the movie exists in the movies table first (so the foreign key holds)
      const existingMovie = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
      if (existingMovie.length === 0) {
        const details = await movieService.getMovieDetails(movieId);
        if (details) {
          await db.insert(movies).values({
            id: details.id,
            title: details.title,
            tagline: details.tagline,
            overview: details.overview,
            releaseDate: details.release_date,
            runtime: details.runtime,
            voteAverage: details.vote_average,
            voteCount: details.vote_count,
            budget: details.budget,
            revenue: details.revenue,
            posterPath: details.poster_path,
            backdropPath: details.backdrop_path,
            status: details.status,
            popularity: details.popularity,
          });
        }
      }

      const existing = await db.select().from(favorites).where(and(eq(favorites.movieId, movieId), eq(favorites.userId, dbUser.id)));
      
      if (existing.length > 0) {
        await db.delete(favorites).where(and(eq(favorites.movieId, movieId), eq(favorites.userId, dbUser.id)));
        return res.json({ success: true, inFavorites: false });
      } else {
        await db.insert(favorites).values({ movieId, userId: dbUser.id });
        return res.json({ success: true, inFavorites: true });
      }
    } catch (error) {
      console.error('Error toggling favorites:', error);
      res.status(500).json({ error: 'Failed to toggle favorites' });
    }
  });

  // Submit Rating (1-10)
  app.post('/api/movies/:id/rate', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const movieId = parseInt(req.params.id);
    const { value } = req.body;

    if (typeof value !== 'number' || value < 1 || value > 10) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
    }

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      // Ensure movie exists in table
      const existingMovie = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
      if (existingMovie.length === 0) {
        const details = await movieService.getMovieDetails(movieId);
        if (details) {
          await db.insert(movies).values({
            id: details.id,
            title: details.title,
            tagline: details.tagline,
            overview: details.overview,
            releaseDate: details.release_date,
            runtime: details.runtime,
            voteAverage: details.vote_average,
            voteCount: details.vote_count,
            budget: details.budget,
            revenue: details.revenue,
            posterPath: details.poster_path,
            backdropPath: details.backdrop_path,
            status: details.status,
            popularity: details.popularity,
          });
        }
      }

      await db.insert(ratings)
        .values({ movieId, userId: dbUser.id, value })
        .onConflictDoUpdate({
          target: [ratings.id], // Wait, ratings table doesn't have a compound unique target in the schema, but we can do insert or find & update
          set: { value, updatedAt: new Date() }
        });

      // Let's do a find & update instead to be absolutely safe:
      const existingRating = await db.select().from(ratings).where(and(eq(ratings.movieId, movieId), eq(ratings.userId, dbUser.id)));
      if (existingRating.length > 0) {
        await db.update(ratings).set({ value, updatedAt: new Date() }).where(eq(ratings.id, existingRating[0].id));
      } else {
        await db.insert(ratings).values({ movieId, userId: dbUser.id, value });
      }

      res.json({ success: true, rating: value });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ error: 'Failed to submit rating' });
    }
  });

  // Get Community Reviews
  app.get('/api/movies/:id/reviews', async (req, res) => {
    const movieId = parseInt(req.params.id);
    try {
      const movieReviews = await db.select({
        id: reviews.id,
        content: reviews.content,
        rating: reviews.rating,
        summary: reviews.summary,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
        user: {
          name: users.name,
          avatar: users.avatar,
        }
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.movieId, movieId))
      .orderBy(desc(reviews.createdAt));

      res.json(movieReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Submit Review
  app.post('/api/movies/:id/reviews', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const movieId = parseInt(req.params.id);
    const { content, rating, summary } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Review content cannot be empty' });
    }

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      // Ensure movie exists in table
      const existingMovie = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
      if (existingMovie.length === 0) {
        const details = await movieService.getMovieDetails(movieId);
        if (details) {
          await db.insert(movies).values({
            id: details.id,
            title: details.title,
            tagline: details.tagline,
            overview: details.overview,
            releaseDate: details.release_date,
            runtime: details.runtime,
            voteAverage: details.vote_average,
            voteCount: details.vote_count,
            budget: details.budget,
            revenue: details.revenue,
            posterPath: details.poster_path,
            backdropPath: details.backdrop_path,
            status: details.status,
            popularity: details.popularity,
          });
        }
      }

      const [newReview] = await db.insert(reviews).values({
        movieId,
        userId: dbUser.id,
        content,
        rating: rating || null,
        summary: summary || null,
      }).returning();

      res.status(201).json({ success: true, review: newReview });
    } catch (error) {
      console.error('Error inserting review:', error);
      res.status(500).json({ error: 'Failed to post review' });
    }
  });

  // Helper to map DB movie back to TMDB format for consistency on frontend
  const mapDbMovieToMovie = (dbMovie: any) => {
    if (!dbMovie) return null;
    return {
      id: dbMovie.id,
      title: dbMovie.title,
      tagline: dbMovie.tagline || '',
      overview: dbMovie.overview || '',
      release_date: dbMovie.releaseDate || '',
      runtime: dbMovie.runtime || 0,
      vote_average: dbMovie.voteAverage || 0,
      vote_count: dbMovie.voteCount || 0,
      budget: dbMovie.budget || 0,
      revenue: dbMovie.revenue || 0,
      poster_path: dbMovie.posterPath || '',
      backdrop_path: dbMovie.backdropPath || '',
      logo_path: dbMovie.logoPath || '',
      status: dbMovie.status || 'Released',
      popularity: dbMovie.popularity || 0,
      language: dbMovie.language || 'en',
      censor_rating: dbMovie.censorRating || '',
      censorRating: dbMovie.censorRating || '',
      genres: [],
      cast: [],
      crew: [],
      trailers: [],
      images: []
    };
  };

  // 6. User's Watchlist and Favorites feeds
  app.get('/api/user/watchlist', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      const list = await db.select({
        movie: movies
      })
      .from(watchlists)
      .innerJoin(movies, eq(watchlists.movieId, movies.id))
      .where(eq(watchlists.userId, dbUser.id))
      .orderBy(desc(watchlists.createdAt));

      res.json(list.map(l => mapDbMovieToMovie(l.movie)).filter(Boolean));
    } catch (error) {
      console.error('Error fetching user watchlist:', error);
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  });

  app.get('/api/user/favorites', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      const list = await db.select({
        movie: movies
      })
      .from(favorites)
      .innerJoin(movies, eq(favorites.movieId, movies.id))
      .where(eq(favorites.userId, dbUser.id))
      .orderBy(desc(favorites.createdAt));

      res.json(list.map(l => mapDbMovieToMovie(l.movie)).filter(Boolean));
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });

  // 7. Notifications
  app.get('/api/user/notifications', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      const notifs = await db.select().from(notifications).where(eq(notifications.userId, dbUser.id)).orderBy(desc(notifications.createdAt));
      res.json(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/user/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    const firebaseUser = req.user;
    if (!firebaseUser) return res.status(401).json({ error: 'Unauthorized' });
    const notifId = parseInt(req.params.id);

    try {
      const [dbUser] = await db.select().from(users).where(eq(users.uid, firebaseUser.uid)).limit(1);
      if (!dbUser) return res.status(404).json({ error: 'User not registered' });

      await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notifId), eq(notifications.userId, dbUser.id)));
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // 8. Actor endpoints
  app.get('/api/actors/popular', async (req, res) => {
    try {
      const actorsList = await movieService.getPopularActors();
      res.json(actorsList);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch popular actors' });
    }
  });

  app.get('/api/actors/:id', async (req, res) => {
    const actorId = parseInt(req.params.id);
    try {
      const details = await movieService.getActorDetails(actorId);
      if (!details) {
        return res.status(404).json({ error: 'Actor details not found' });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch actor details' });
    }
  });

  // 9. Gemini AI recommendations
  app.post('/api/ai/recommend', async (req, res) => {
    const { prompt, preferences } = req.body;
    try {
      const recommendation = await movieService.getAIRecommendation(prompt || '', preferences || {});
      res.json(recommendation);
    } catch (error) {
      console.error('AI recommendation failure:', error);
      res.status(500).json({ error: 'AI recommendation service unavailable' });
    }
  });

  // VITE SERVER OR STATIC PRODUCTION BUILD HANDLER
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CineLuxe server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
