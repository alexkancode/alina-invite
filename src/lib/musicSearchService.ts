/**
 * Music Search Service for 70's Song Discovery
 *
 * Features:
 * - MusicBrainz API integration for comprehensive 70's music database
 * - Rate limiting to respect API limits (1 request/second)
 * - Intelligent caching to reduce API calls
 * - Progressive enhancement with curated fallback
 * - YouTube preview URL generation
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  year?: number;
  source: 'musicbrainz' | 'curated';
  youtubeSearchUrl?: string;
  musicbrainzId?: string;
}

export interface SearchResult {
  success: boolean;
  songs: Song[];
  error?: string;
  source: 'api' | 'cache' | 'fallback';
  totalFound?: number;
}

export interface SearchOptions {
  includeFallback?: boolean;
  maxResults?: number;
  cacheTimeout?: number;
}

interface CacheEntry {
  data: SearchResult;
  timestamp: number;
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  'artist-credit': Array<{
    artist: { name: string };
  }>;
  'first-release-date'?: string;
}

interface MusicBrainzResponse {
  recordings: MusicBrainzRecording[];
}

export class MusicSearchService {
  private cache = new Map<string, CacheEntry>();
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 1000; // 1 request per second for MusicBrainz
  private readonly CACHE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  private readonly DEFAULT_MAX_RESULTS = 15;

  /**
   * Search for 70's songs using MusicBrainz API with fallback to curated list
   */
  async search70sSongs(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const {
      includeFallback = false,
      maxResults = this.DEFAULT_MAX_RESULTS,
      cacheTimeout = this.CACHE_TIMEOUT_MS
    } = options;

    // Check cache first
    const cacheKey = `${query}_${maxResults}`;
    const cached = this.getFromCache(cacheKey, cacheTimeout);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    try {
      // Rate limiting for MusicBrainz API
      await this.waitForRateLimit();

      // Search MusicBrainz API
      const apiResult = await this.searchMusicBrainzAPI(query, maxResults);

      // Cache successful results
      this.setCache(cacheKey, apiResult);

      return apiResult;

    } catch (error) {
      console.warn('MusicBrainz API search failed:', error);

      if (includeFallback) {
        // Fallback to curated songs
        const fallbackSongs = this.searchCuratedSongs(query)
          .slice(0, maxResults);

        const fallbackResult: SearchResult = {
          success: true,
          songs: fallbackSongs,
          source: 'fallback',
          totalFound: fallbackSongs.length
        };

        return fallbackResult;
      }

      return {
        success: false,
        songs: [],
        error: 'Failed to search MusicBrainz API',
        source: 'api'
      };
    }
  }

  /**
   * Search MusicBrainz API for 70's songs
   */
  private async searchMusicBrainzAPI(query: string, maxResults: number): Promise<SearchResult> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://musicbrainz.org/ws/2/recording/` +
      `?query=${encodedQuery} AND date:[1970 TO 1979]` +
      `&fmt=json&limit=${maxResults}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PartyRSVPApp/1.0 (alina-birthday-party@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status}`);
    }

    const data: MusicBrainzResponse = await response.json();

    // Transform and filter results
    const songs = data.recordings
      .map(recording => this.transformMusicBrainzRecord(recording))
      .filter(song => song !== null) as Song[];

    return {
      success: true,
      songs,
      source: 'api',
      totalFound: data.recordings.length
    };
  }

  /**
   * Transform MusicBrainz recording to our Song interface
   */
  private transformMusicBrainzRecord(recording: MusicBrainzRecording): Song | null {
    // Validate required fields
    if (!recording.title || !recording['artist-credit']?.[0]?.artist?.name) {
      return null;
    }

    const artist = recording['artist-credit'][0].artist.name;
    const year = recording['first-release-date']
      ? parseInt(recording['first-release-date'].substring(0, 4))
      : undefined;

    // Filter to 70's only (double-check API results)
    if (year && (year < 1970 || year > 1979)) {
      return null;
    }

    return {
      id: recording.id,
      title: recording.title,
      artist,
      year,
      source: 'musicbrainz',
      musicbrainzId: recording.id,
      youtubeSearchUrl: this.generateYouTubeSearchUrl(recording.title, artist)
    };
  }

  /**
   * Generate YouTube search URL for song preview
   */
  private generateYouTubeSearchUrl(title: string, artist: string): string {
    const query = encodeURIComponent(`${title} ${artist} official`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  /**
   * Get curated list of popular 70's songs
   */
  getCuratedSongs(): Song[] {
    return CURATED_SEVENTIES_SONGS.map(song => ({
      ...song,
      source: 'curated' as const,
      youtubeSearchUrl: this.generateYouTubeSearchUrl(song.title, song.artist)
    }));
  }

  /**
   * Search curated songs by title or artist
   */
  searchCuratedSongs(query: string): Song[] {
    const lowercaseQuery = query.toLowerCase();
    const curated = this.getCuratedSongs();

    return curated.filter(song =>
      song.title.toLowerCase().includes(lowercaseQuery) ||
      song.artist.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Format song for display in UI
   */
  formatSongDisplay(song: Song): string {
    const yearPart = song.year ? ` (${song.year})` : '';
    return `${song.title} - ${song.artist}${yearPart}`;
  }

  /**
   * Rate limiting for MusicBrainz API (1 request/second)
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Cache management
   */
  private getFromCache(key: string, timeoutMs: number): SearchResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > timeoutMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: SearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old cache entries (simple LRU)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Curated list of popular 70's songs for fallback
 */
const CURATED_SEVENTIES_SONGS = [
  // 1970
  { id: 'cur-1', title: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel', year: 1970 },
  { id: 'cur-2', title: 'Let It Be', artist: 'The Beatles', year: 1970 },
  { id: 'cur-3', title: 'ABC', artist: 'The Jackson 5', year: 1970 },
  { id: 'cur-4', title: 'I Want You Back', artist: 'The Jackson 5', year: 1970 },

  // 1971
  { id: 'cur-5', title: 'Maggie May', artist: 'Rod Stewart', year: 1971 },
  { id: 'cur-6', title: 'Joy to the World', artist: 'Three Dog Night', year: 1971 },
  { id: 'cur-7', title: 'It\'s Too Late', artist: 'Carole King', year: 1971 },
  { id: 'cur-8', title: 'Stairway to Heaven', artist: 'Led Zeppelin', year: 1971 },

  // 1972
  { id: 'cur-9', title: 'The First Time Ever I Saw Your Face', artist: 'Roberta Flack', year: 1972 },
  { id: 'cur-10', title: 'Alone Again (Naturally)', artist: 'Gilbert O\'Sullivan', year: 1972 },
  { id: 'cur-11', title: 'I Can See Clearly Now', artist: 'Johnny Nash', year: 1972 },

  // 1973
  { id: 'cur-12', title: 'Killing Me Softly With His Song', artist: 'Roberta Flack', year: 1973 },
  { id: 'cur-13', title: 'Tie a Yellow Ribbon Round the Ole Oak Tree', artist: 'Tony Orlando & Dawn', year: 1973 },
  { id: 'cur-14', title: 'Bad, Bad Leroy Brown', artist: 'Jim Croce', year: 1973 },

  // 1974
  { id: 'cur-15', title: 'The Way You Make Me Feel', artist: 'Barbra Streisand', year: 1974 },
  { id: 'cur-16', title: 'Seasons in the Sun', artist: 'Terry Jacks', year: 1974 },
  { id: 'cur-17', title: 'Rock Me Gently', artist: 'Andy Kim', year: 1974 },

  // 1975
  { id: 'cur-18', title: 'Love Will Keep Us Together', artist: 'Captain & Tennille', year: 1975 },
  { id: 'cur-19', title: 'Bohemian Rhapsody', artist: 'Queen', year: 1975 },
  { id: 'cur-20', title: 'Philadelphia Freedom', artist: 'Elton John', year: 1975 },

  // 1976
  { id: 'cur-21', title: 'Silly Love Songs', artist: 'Wings', year: 1976 },
  { id: 'cur-22', title: 'Don\'t Go Breaking My Heart', artist: 'Elton John & Kiki Dee', year: 1976 },
  { id: 'cur-23', title: 'Hotel California', artist: 'Eagles', year: 1976 },

  // 1977
  { id: 'cur-24', title: 'Tonight\'s the Night', artist: 'Rod Stewart', year: 1977 },
  { id: 'cur-25', title: 'I Just Want to Be Your Everything', artist: 'Andy Gibb', year: 1977 },
  { id: 'cur-26', title: 'Best of My Love', artist: 'The Emotions', year: 1977 },

  // 1978
  { id: 'cur-27', title: 'Stayin\' Alive', artist: 'Bee Gees', year: 1978 },
  { id: 'cur-28', title: 'How Deep Is Your Love', artist: 'Bee Gees', year: 1978 },
  { id: 'cur-29', title: 'Baby Come Back', artist: 'Player', year: 1978 },

  // 1979
  { id: 'cur-30', title: 'My Sharona', artist: 'The Knack', year: 1979 },
  { id: 'cur-31', title: 'Bad Girls', artist: 'Donna Summer', year: 1979 },
  { id: 'cur-32', title: 'Ring My Bell', artist: 'Anita Ward', year: 1979 },
];

/**
 * Default export for easy importing
 */
export const musicSearchService = new MusicSearchService();