import { GoogleGenAI, Type } from '@google/genai';

// TMDB base image URLs
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

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

// 1. Core Curated Masterpiece Dataset (Fallback/Offline Database)
import rawTeluguMovies from '../data/telugu_movies.json';
export const CURATED_MOVIES: Movie[] = rawTeluguMovies as unknown as Movie[];

// 2. High-Quality Placeholder Helper (in case TMDB image loading fails or is empty)
export const getPlaceholderUrl = (width: number, height: number, text: string) => {
  return `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=${width}&auto=format&fit=crop`;
};

// 3. MovieService Class implementing both TMDB API Proxy and dynamic falling back to local database
export class MovieService {
  private apiKey: string | undefined;
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  // Generic TMDB fetch helper
  private async fetchTMDB(endpoint: string, params: Record<string, string | number> = {}) {
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY is not defined.');
    }

    const queryParams = new URLSearchParams({
      api_key: this.apiKey,
      language: 'en-US',
      ...Object.fromEntries(
        Object.entries(params).map(([key, val]) => [key, String(val)])
      ),
    });

    const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API call failed: ${response.statusText}`);
    }
    return response.json();
  }

  // popular movies list
  async getPopularMovies(): Promise<Movie[]> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB('/discover/movie', { with_original_language: 'te', sort_by: 'popularity.desc' });
        return this.mapTMDBResults(data.results);
      } catch (e) {
        console.warn('Failed to fetch popular from TMDB, using curated local data:', e);
      }
    }
    return CURATED_MOVIES;
  }

  // top rated movies list
  async getTopRatedMovies(): Promise<Movie[]> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB('/discover/movie', { with_original_language: 'te', sort_by: 'vote_average.desc', 'vote_count.gte': 100 });
        return this.mapTMDBResults(data.results);
      } catch (e) {
        console.warn('Failed to fetch top rated from TMDB:', e);
      }
    }
    return [...CURATED_MOVIES].sort((a, b) => b.vote_average - a.vote_average);
  }

  // upcoming movies
  async getUpcomingMovies(): Promise<Movie[]> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB('/discover/movie', { with_original_language: 'te', 'primary_release_date.gte': new Date().toISOString().split('T')[0], sort_by: 'popularity.desc' });
        return this.mapTMDBResults(data.results);
      } catch (e) {
        console.warn('Failed to fetch upcoming from TMDB:', e);
      }
    }
    return CURATED_MOVIES;
  }

  // now playing / trending movies
  async getNowPlayingMovies(): Promise<Movie[]> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB('/discover/movie', { with_original_language: 'te', 'primary_release_date.lte': new Date().toISOString().split('T')[0], sort_by: 'popularity.desc' });
        return this.mapTMDBResults(data.results);
      } catch (e) {
        console.warn('Failed to fetch now playing from TMDB:', e);
      }
    }
    return CURATED_MOVIES;
  }

  // popular Telugu movies (Tollywood)
  async getTeluguMovies(): Promise<Movie[]> {
    if (this.apiKey) {
      try {
        const [page1, page2] = await Promise.all([
          this.fetchTMDB('/discover/movie', { with_original_language: 'te', sort_by: 'popularity.desc', page: 1 }),
          this.fetchTMDB('/discover/movie', { with_original_language: 'te', sort_by: 'popularity.desc', page: 2 })
        ]);
        return this.mapTMDBResults([...(page1.results || []), ...(page2.results || [])]);
      } catch (e) {
        console.warn('Failed to fetch telugu from TMDB:', e);
      }
    }
    return this.getPopularMovies();
  }

  // search movies
  async searchMovies(query: string): Promise<Movie[]> {
    if (!query || query.trim() === '') return [];
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB('/search/movie', { query });
        const teluguOnly = (data.results || []).filter((m: any) => m.original_language === 'te');
        return this.mapTMDBResults(teluguOnly);
      } catch (e) {
        console.warn('Failed to search from TMDB:', e);
      }
    }
    return CURATED_MOVIES.filter(m =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.overview.toLowerCase().includes(query.toLowerCase())
    );
  }

  // get single movie by id with complete append_to_response details
  async getMovieDetails(id: number): Promise<Movie | null> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB(`/movie/${id}`, {
          append_to_response: 'credits,videos,images',
          include_video_language: 'en,te,hi,ta,ml,kn',
        });
        
        // Find trailer
        const trailers: Trailer[] = (data.videos?.results || [])
          .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
          .map((v: any) => ({
            id: v.id,
            key: v.key,
            name: v.name,
            site: v.site,
            type: v.type,
          }));

        // Cast & Crew
        const cast: CastMember[] = (data.credits?.cast || []).slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path ? `${TMDB_IMAGE_BASE}${c.profile_path}` : '',
          order: c.order,
        }));

        const crew: CrewMember[] = (data.credits?.crew || [])
          .filter((cr: any) => ['Director', 'Producer', 'Screenplay', 'Original Music Composer'].includes(cr.job))
          .map((cr: any) => ({
            id: cr.id,
            name: cr.name,
            job: cr.job,
            department: cr.department,
            profile_path: cr.profile_path ? `${TMDB_IMAGE_BASE}${cr.profile_path}` : '',
          }));

        return {
          id: data.id,
          title: data.title,
          tagline: data.tagline,
          overview: data.overview,
          release_date: data.release_date,
          runtime: data.runtime,
          vote_average: data.vote_average,
          vote_count: data.vote_count,
          budget: data.budget,
          revenue: data.revenue,
          poster_path: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : '',
          backdrop_path: data.backdrop_path ? `${TMDB_BACKDROP_BASE}${data.backdrop_path}` : '',
          status: data.status,
          popularity: data.popularity,
          genres: data.genres || [],
          cast,
          crew,
          trailers,
          images: (data.images?.backdrops || []).slice(0, 5).map((img: any) => `${TMDB_BACKDROP_BASE}${img.file_path}`),
          aiScore: Math.floor(Math.random() * 15) + 85, // Default AI score prediction
        };
      } catch (e) {
        console.warn('Failed to get movie details from TMDB:', e);
      }
    }

    const localMovie = CURATED_MOVIES.find(m => m.id === id);
    if (localMovie) return localMovie;
    return CURATED_MOVIES[0]; // fallback
  }

  // map basic TMDB items to standard Movie format
  private mapTMDBResults(results: any[]): Movie[] {
    return (results || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      tagline: '',
      overview: m.overview || '',
      release_date: m.release_date || '',
      runtime: 0,
      vote_average: m.vote_average || 0,
      vote_count: m.vote_count || 0,
      budget: 0,
      revenue: 0,
      poster_path: m.poster_path ? `${TMDB_IMAGE_BASE}${m.poster_path}` : '',
      backdrop_path: m.backdrop_path ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}` : '',
      status: 'Released',
      popularity: m.popularity || 0,
      genres: [],
      cast: [],
      crew: [],
      trailers: [],
      images: [],
    }));
  }

  // get popular actors
  async getPopularActors(): Promise<CastMember[]> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB('/person/popular');
        return (data.results || []).slice(0, 10).map((p: any) => ({
          id: p.id,
          name: p.name,
          character: 'Popular Star',
          profile_path: p.profile_path ? `${TMDB_IMAGE_BASE}${p.profile_path}` : '',
          order: 0,
          popularity: p.popularity,
          known_for: (p.known_for || []).map((kf: any) => kf.title || kf.name),
        }));
      } catch (e) {
        console.warn('Failed to fetch popular actors:', e);
      }
    }
    // Static Fallback
    return CURATED_MOVIES.flatMap(m => m.cast).slice(0, 8);
  }

  // get specific actor details
  async getActorDetails(id: number): Promise<CastMember | null> {
    if (this.apiKey) {
      try {
        const data = await this.fetchTMDB(`/person/${id}`, {
          append_to_response: 'combined_credits',
        });
        const knownFor = (data.combined_credits?.cast || [])
          .slice(0, 5)
          .map((c: any) => c.title || c.name);

        return {
          id: data.id,
          name: data.name,
          character: '',
          profile_path: data.profile_path ? `${TMDB_IMAGE_BASE}${data.profile_path}` : '',
          order: 0,
          biography: data.biography || 'No biography available.',
          birthday: data.birthday,
          place_of_birth: data.place_of_birth,
          nationality: data.place_of_birth ? data.place_of_birth.split(',').pop()?.trim() : 'International',
          popularity: data.popularity,
          known_for: knownFor,
        };
      } catch (e) {
        console.warn('Failed to fetch actor details:', e);
      }
    }

    const localCast = CURATED_MOVIES.flatMap(m => m.cast).find(c => c.id === id);
    if (localCast) return localCast;
    return null;
  }

  // 4. Dynamic AI Recommendations leveraging Gemini API
  async getAIRecommendation(userInput: string, preferences: any = {}): Promise<any> {
    if (!this.ai) {
      // Fallback response with beautiful mock cinematic recommendations
      return {
        explanation: "Based on the mood and themes you described, CineLuxe AI recommend matching these atmospheric titles. These films are perfect for a late-night cinema experience with beautiful soundtracks and thought-provoking storytelling.",
        recommended_ids: [872585, 693134, 157336],
        match_reasons: [
          "Oppenheimer: Deep political thriller with an amazing Ludwig Göransson cinematic score.",
          "Dune: Part Two: Epic desert cinematography and Denis Villeneuve sci-fi direction.",
          "Interstellar: A gorgeous, emotional exploration of the cosmic unknown with a Hans Zimmer pipe organ soundscape."
        ]
      };
    }

    const availableMoviesSummary = CURATED_MOVIES.map(m => 
      `[ID: ${m.id}] ${m.title} (${m.release_date.substring(0, 4)}) - Genres: ${m.genres.map(g=>g.name).join(', ')} - Tagline: "${m.tagline}" - Overview: ${m.overview.substring(0, 150)}...`
    ).join('\n');

    const prompt = `You are the ultimate CineLuxe AI Movie Concierge, a movie expert.
User request: "${userInput}"
User profile preferences: ${JSON.stringify(preferences)}

Choose the most appropriate movies from this pool of curated CineLuxe cinematic masterpieces:
${availableMoviesSummary}

Give your response in raw JSON format matching this schema:
{
  "explanation": "Brief, elegant, 1-2 sentence paragraph explaining why these suggestions match the user's specific mood, genres, or actors requested.",
  "recommended_ids": [number, number, ...],
  "match_reasons": ["Reason 1 for first movie", "Reason 2 for second movie", ...]
}
Return only valid JSON. Do not include markdown wraps or code block syntax.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              recommended_ids: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              },
              match_reasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['explanation', 'recommended_ids', 'match_reasons']
          }
        }
      });

      const text = response.text?.trim() || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating AI recommendation from Gemini:', error);
      return {
        explanation: "Our primary neural link is buffering, so we matched your cinematic search with our top-voted cinematic masterpieces:",
        recommended_ids: [157336, 872585],
        match_reasons: [
          "Interstellar: Matches beautiful visual effects and sci-fi mystery themes.",
          "Oppenheimer: Matches rich historical drama, dialogue intensity, and visual craft."
        ]
      };
    }
  }
}

// Export singleton instance
export const movieService = new MovieService();
