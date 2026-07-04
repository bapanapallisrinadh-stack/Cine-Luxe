export interface Movie {
  id: number;
  title: string;
  tagline: string;
  overview: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  budget: number;
  revenue: number;
  poster_path: string;
  backdrop_path: string;
  logo_path?: string;
  status: string;
  popularity: number;
  genres: { id: number; name: string }[];
  cast: CastMember[];
  crew: CrewMember[];
  trailers: Trailer[];
  images: string[];
  streamingProviders?: { provider_name: string; logo_path: string }[];
  awards?: string[];
  aiScore?: number;
  language?: string;
  censor_rating?: string;
  censorRating?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  order: number;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  nationality?: string;
  popularity?: number;
  known_for?: string[];
  awards?: string[];
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  popularity?: number;
}

export interface Trailer {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Review {
  id: number;
  content: string;
  rating: number | null;
  summary: string | null;
  helpfulCount: number;
  createdAt: string;
  user: {
    name: string;
    avatar: string;
  };
}

export interface UserState {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
}

export interface UserPreferences {
  favoriteGenres: string[];
  favoriteActors: string[];
  favoriteDirectors: string[];
  languagePreference: string;
  preferredYearsRange: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}
