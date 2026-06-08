import 'dotenv/config';
import { SpotifyClient, type Song } from './spotify/client.js';

export interface SearchResult {
  success: boolean;
  songs: Song[];
  source: 'spotify' | 'error';
  totalFound: number;
  error?: string;
  cached?: boolean;
}

export interface SpotifyMusicOptions {
  cacheTimeout?: number;
}

interface CacheEntry {
  data: SearchResult;
  timestamp: number;
}

export class SpotifyMusicService {
  private cache = new Map<string, CacheEntry>();
  private spotifyClient: SpotifyClient;
  private readonly DEFAULT_MAX_RESULTS = 15;
  private readonly CACHE_TIMEOUT_MS: number;

  constructor(
    clientId?: string,
    clientSecret?: string,
    options: SpotifyMusicOptions = {}
  ) {
    this.CACHE_TIMEOUT_MS = options.cacheTimeout || 10 * 60 * 1000; // 10 minutes default

    this.spotifyClient = new SpotifyClient(
      clientId || process.env.SPOTIFY_CLIENT_ID,
      clientSecret || process.env.SPOTIFY_CLIENT_SECRET
    );
  }

  async searchMusic(query: string, maxResults: number = this.DEFAULT_MAX_RESULTS): Promise<SearchResult> {
    if (!this.validateQuery(query)) {
      return {
        success: false,
        songs: [],
        source: 'error',
        totalFound: 0,
        error: 'Search query is required',
        cached: false
      };
    }

    const cacheKey = this.generateCacheKey(query.trim(), maxResults);
    const cachedResult = this.getFromCache(cacheKey);

    if (cachedResult) {
      return { ...cachedResult, cached: true };
    }

    try {
      const decade70sQuery = `${query.trim()} year:1970-1979`;
      const spotifyResults = await this.spotifyClient.searchTracks(decade70sQuery, maxResults);

      const filteredResults = this.filter70sOnly(spotifyResults || []);

      const result: SearchResult = {
        success: true,
        songs: filteredResults,
        source: 'spotify',
        totalFound: filteredResults.length,
        cached: false
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.warn('Spotify search failed:', error);

      // Provide more specific error messages for different failure types
      let errorMessage = 'Music search temporarily unavailable';

      if (error.code === 'MISSING_CLIENT_ID' || error.code === 'MISSING_CLIENT_SECRET') {
        errorMessage = 'Music search not configured - missing credentials';
      } else if (error.code === 'AUTH_FAILED') {
        errorMessage = 'Music search authentication failed';
      } else if (error.code === 'MAX_RETRIES_EXCEEDED') {
        errorMessage = 'Music search service temporarily unavailable';
      }

      return {
        success: false,
        songs: [],
        source: 'error',
        totalFound: 0,
        error: errorMessage,
        cached: false
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private validateQuery(query: string): boolean {
    return typeof query === 'string' && query.trim().length > 0;
  }

  private filter70sOnly(songs: Song[]): Song[] {
    return songs.filter(song =>
      song.year && song.year >= 1970 && song.year <= 1979
    );
  }

  private generateCacheKey(query: string, maxResults: number): string {
    return `spotify:${query}:${maxResults}`;
  }

  private getFromCache(cacheKey: string): SearchResult | null {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > this.CACHE_TIMEOUT_MS;

    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  private setCache(cacheKey: string, data: SearchResult): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    this.cleanupOldEntries();
  }

  private cleanupOldEntries(): void {
    if (this.cache.size <= 100) {
      return;
    }

    const cutoffTime = Date.now() - this.CACHE_TIMEOUT_MS;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoffTime) {
        this.cache.delete(key);
      }
    }

    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
}

export const spotifyMusicService = new SpotifyMusicService();