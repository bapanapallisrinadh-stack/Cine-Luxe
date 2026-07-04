import { pgTable, serial, text, integer, timestamp, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role').default('user'), // 'user', 'admin'
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Movies Table (uses TMDB ID as the primary key)
export const movies = pgTable('movies', {
  id: integer('id').primaryKey(), // TMDB movie id
  title: text('title').notNull(),
  tagline: text('tagline'),
  overview: text('overview'),
  releaseDate: text('release_date'), // YYYY-MM-DD
  runtime: integer('runtime'),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  budget: real('budget'),
  revenue: real('revenue'),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  logoPath: text('logo_path'),
  status: text('status'),
  popularity: real('popularity'),
  language: text('language'),
  censorRating: text('censor_rating'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Genres Table
export const genres = pgTable('genres', {
  id: integer('id').primaryKey(), // TMDB genre id
  name: text('name').notNull(),
});

// 4. MovieGenres Table (Junction Table)
export const movieGenres = pgTable('movie_genres', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  genreId: integer('genre_id').references(() => genres.id, { onDelete: 'cascade' }).notNull(),
});

// 5. Actors Table
export const actors = pgTable('actors', {
  id: integer('id').primaryKey(), // TMDB person id
  name: text('name').notNull(),
  photoPath: text('photo_path'),
  biography: text('biography'),
  birthday: text('birthday'),
  birthplace: text('birthplace'),
  nationality: text('nationality'),
  popularity: real('popularity'),
});

// 6. Crew Table
export const crew = pgTable('crew', {
  id: integer('id').primaryKey(), // TMDB person id
  name: text('name').notNull(),
  photoPath: text('photo_path'),
  biography: text('biography'),
  birthday: text('birthday'),
  birthplace: text('birthplace'),
  nationality: text('nationality'),
  popularity: real('popularity'),
});

// 7. MovieCast Table (Junction Table for Actors)
export const movieCast = pgTable('movie_cast', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  actorId: integer('actor_id').references(() => actors.id, { onDelete: 'cascade' }).notNull(),
  characterName: text('character_name').notNull(),
  castOrder: integer('cast_order'),
});

// 8. MovieCrew Table (Junction Table for Crew)
export const movieCrew = pgTable('movie_crew', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  crewId: integer('crew_id').references(() => crew.id, { onDelete: 'cascade' }).notNull(),
  department: text('department').notNull(),
  job: text('job').notNull(),
});

// 9. Reviews Table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  rating: integer('rating'), // Individual review rating (1-10)
  summary: text('summary'),
  helpfulCount: integer('helpful_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Ratings Table (Exclusive 1-10 movie ratings)
export const ratings = pgTable('ratings', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  value: integer('value').notNull(), // 1 to 10
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Favorites Table
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Watchlists Table
export const watchlists = pgTable('watchlists', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. MovieImages Table
export const movieImages = pgTable('movie_images', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  imagePath: text('image_path').notNull(),
  imageType: text('image_type').notNull(), // 'backdrop', 'poster', 'logo', 'gallery'
  width: integer('width'),
  height: integer('height'),
});

// 14. Trailers Table
export const trailers = pgTable('trailers', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  key: text('key').notNull(), // YouTube Video Key
  name: text('name').notNull(),
  site: text('site').notNull(), // 'YouTube', etc.
  type: text('type').notNull(), // 'Trailer', 'Teaser', 'Featurette'
  size: integer('size'),
});

// 15. Recommendations Table (Generated Recommendations)
export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  recommendedMovieId: integer('recommended_movie_id').references(() => movies.id, { onDelete: 'cascade' }).notNull(),
  score: real('score'), // confidence or match percentage
  reason: text('reason'), // E.g., 'Because you liked Interstellar' or AI description
});

// 16. UserPreferences Table
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  favoriteGenres: text('favorite_genres'), // JSON array of genre IDs or names
  favoriteActors: text('favorite_actors'), // JSON array of actor names/IDs
  favoriteDirectors: text('favorite_directors'), // JSON array of director names/IDs
  languagePreference: text('language_preference'),
  releaseReminders: text('release_reminders'), // JSON array of movie IDs
  preferredYearsRange: text('preferred_years_range'), // JSON or text range like '1990-2026'
});

// 17. SearchHistory Table
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  query: text('query').notNull(),
  searchedAt: timestamp('searched_at').defaultNow(),
});

// 18. Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  type: text('type').notNull(), // 'recommendation', 'review_like', 'system'
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. AuditLogs Table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // nullable for anonymous/guest
  action: text('action').notNull(), // E.g., 'LOGIN', 'DELETE_REVIEW'
  entityType: text('entity_type'), // E.g., 'REVIEWS', 'USERS'
  entityId: integer('entity_id'),
  details: text('details'), // JSON details
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RELATIONSHIPS DEFINITIONS

export const usersRelations = relations(users, ({ many, one }) => ({
  reviews: many(reviews),
  ratings: many(ratings),
  favorites: many(favorites),
  watchlists: many(watchlists),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  searchHistory: many(searchHistory),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  movieCast: many(movieCast),
  movieCrew: many(movieCrew),
  reviews: many(reviews),
  ratings: many(ratings),
  favorites: many(favorites),
  watchlists: many(watchlists),
  images: many(movieImages),
  trailers: many(trailers),
  recommendations: many(recommendations, { relationName: 'movie_recommendations' }),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const actorsRelations = relations(actors, ({ many }) => ({
  movieCast: many(movieCast),
}));

export const crewRelations = relations(crew, ({ many }) => ({
  movieCrew: many(movieCrew),
}));

export const movieCastRelations = relations(movieCast, ({ one }) => ({
  movie: one(movies, {
    fields: [movieCast.movieId],
    references: [movies.id],
  }),
  actor: one(actors, {
    fields: [movieCast.actorId],
    references: [actors.id],
  }),
}));

export const movieCrewRelations = relations(movieCrew, ({ one }) => ({
  movie: one(movies, {
    fields: [movieCrew.movieId],
    references: [movies.id],
  }),
  crew: one(crew, {
    fields: [movieCrew.crewId],
    references: [crew.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  movie: one(movies, {
    fields: [reviews.movieId],
    references: [movies.id],
  }),
  author: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  movie: one(movies, {
    fields: [ratings.movieId],
    references: [movies.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  movie: one(movies, {
    fields: [favorites.movieId],
    references: [movies.id],
  }),
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const watchlistsRelations = relations(watchlists, ({ one }) => ({
  movie: one(movies, {
    fields: [watchlists.movieId],
    references: [movies.id],
  }),
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
}));

export const movieImagesRelations = relations(movieImages, ({ one }) => ({
  movie: one(movies, {
    fields: [movieImages.movieId],
    references: [movies.id],
  }),
}));

export const trailersRelations = relations(trailers, ({ one }) => ({
  movie: one(movies, {
    fields: [trailers.movieId],
    references: [movies.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  movie: one(movies, {
    fields: [recommendations.movieId],
    references: [movies.id],
    relationName: 'movie_recommendations',
  }),
  recommendedMovie: one(movies, {
    fields: [recommendations.recommendedMovieId],
    references: [movies.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
