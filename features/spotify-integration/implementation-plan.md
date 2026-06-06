# Spotify Integration Implementation Plan

**REVISED APPROACH**: Extend existing `MusicSearchService` to support Spotify as additional source

## Current State Analysis

**Existing Architecture**:
- `MusicSearchService` class with MusicBrainz API integration
- In-memory caching with TTL (10 minutes)
- Rate limiting (1 request/second for MusicBrainz)
- Graceful fallback to curated 70's songs
- Comprehensive test coverage

**Enhancement Strategy**: Add Spotify as a third source alongside MusicBrainz and curated songs.

## File Structure (REVISED)

```
src/lib/
├── musicSearchService.ts        # EXTEND existing service
├── spotify/
│   ├── client.ts               # Spotify API client
│   ├── auth.ts                 # Spotify authentication
│   └── types.ts                # Spotify-specific interfaces
└── __tests__/unit/
    ├── music-search.test.ts    # EXTEND existing tests
    └── spotify-client.test.ts  # New Spotify-specific tests
```

## Enhanced Interfaces

### Extended Song Interface (`src/lib/musicSearchService.ts`)

```typescript
// ENHANCED Song interface - backwards compatible
export interface Song {
  id: string;
  title: string;
  artist: string;
  year?: number;
  source: 'musicbrainz' | 'curated' | 'spotify';  // ADD spotify source
  youtubeSearchUrl?: string;
  musicbrainzId?: string;
  
  // NEW Spotify-enhanced fields (optional for backwards compatibility)
  spotifyId?: string;
  previewUrl?: string | null;
  popularity?: number;
  albumArtUrl?: string | null;
  explicit?: boolean;
}

// ENHANCED SearchResult interface - backwards compatible 
export interface SearchResult {
  success: boolean;
  songs: Song[];
  error?: string;
  source: 'api' | 'cache' | 'fallback' | 'spotify' | 'mixed';  // ADD spotify/mixed sources
  totalFound?: number;
  
  // NEW metadata for enhanced results
  sourcesUsed?: Array<'musicbrainz' | 'spotify' | 'curated'>;
  searchStrategy?: 'spotify-primary' | 'musicbrainz-primary' | 'fallback-only';
}

// ENHANCED SearchOptions interface - backwards compatible
export interface SearchOptions {
  includeFallback?: boolean;
  maxResults?: number;
  cacheTimeout?: number;
  
  // NEW Spotify-specific options
  includeSpotify?: boolean;
  spotifyPrimary?: boolean;
  includeEnhancedMetadata?: boolean;
}
```

### Spotify-Specific Types (`src/lib/spotify/types.ts`)

```typescript
// Raw Spotify API response types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  popularity: number;
  explicit: boolean;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  images: SpotifyImage[];
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

// Authentication types
export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: Date;
}

// Error handling
export class SpotifyError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SpotifyError';
  }
}
```

## Implementation Phases (REVISED)

### Phase 1: Spotify Client Foundation (TDD)

**Test File**: `__tests__/unit/spotify-client.test.ts`

**Test Cases to Write First**:
```typescript
describe('SpotifyClient', () => {
  describe('searchTracks', () => {
    it('should return enhanced tracks for successful search');
    it('should return empty array when API fails');
    it('should handle authentication automatically');
    it('should respect rate limiting');
    it('should transform response to Song format');
  });
  
  describe('authentication', () => {
    it('should get access token using client credentials');
    it('should cache tokens until expiry');
    it('should refresh tokens automatically');
    it('should handle invalid credentials gracefully');
  });
});
```

**Implementation**: `src/lib/spotify/client.ts`

```typescript
export class SpotifyClient {
  private tokenCache: { token: string; expires: Date } | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://api.spotify.com/v1';
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 100; // 10 requests/second for Spotify

  constructor(clientId?: string, clientSecret?: string) {
    // Allow undefined to gracefully handle missing credentials
    this.clientId = clientId || '';
    this.clientSecret = clientSecret || '';
  }

  async searchTracks(query: string, maxResults: number = 20): Promise<Song[]> {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new SpotifyError('Missing Spotify credentials', 'MISSING_CREDENTIALS', false);
      }

      await this.waitForRateLimit();
      const token = await this.getAccessToken();
      const response = await this.makeSearchRequest(query, token, maxResults);
      
      if (response.status === 429) {
        const retryAfter = this.getRetryAfterDelay(response);
        await this.delay(retryAfter);
        return this.searchTracks(query, maxResults); // Retry once
      }
      
      if (!response.ok) {
        throw new SpotifyError(`HTTP ${response.status}`, `HTTP_${response.status}`, response.status >= 500);
      }
      
      const data: SpotifySearchResponse = await response.json();
      return this.transformToSongFormat(data);
      
    } catch (error) {
      console.warn('Spotify search failed:', error);
      return []; // Never throw - return empty array for graceful degradation
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.tokenCache!.token;
    }
    
    return this.refreshToken();
  }

  private isTokenValid(): boolean {
    return this.tokenCache !== null && this.tokenCache.expires > new Date();
  }

  private async refreshToken(): Promise<string> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new SpotifyError('Authentication failed', 'AUTH_FAILED', false);
    }

    const tokens = await response.json();
    this.tokenCache = {
      token: tokens.access_token,
      expires: new Date(Date.now() + (tokens.expires_in - 60) * 1000), // 1 min buffer
    };
    
    return tokens.access_token;
  }

  private async makeSearchRequest(query: string, token: string, limit: number): Promise<Response> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'US'
    });

    return fetch(`${this.baseUrl}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });
  }

  private transformToSongFormat(data: SpotifySearchResponse): Song[] {
    if (!data.tracks?.items) return [];

    return data.tracks.items.map((track: SpotifyTrack): Song => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      year: new Date(track.album.release_date).getFullYear(),
      source: 'spotify',
      spotifyId: track.id,
      previewUrl: track.preview_url,
      popularity: track.popularity,
      albumArtUrl: track.album.images[0]?.url || null,
      explicit: track.explicit,
      youtubeSearchUrl: this.generateYouTubeSearchUrl(track.name, track.artists[0]?.name || '')
    }));
  }

  private generateYouTubeSearchUrl(title: string, artist: string): string {
    const query = encodeURIComponent(`${title} ${artist} official`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  private getRetryAfterDelay(response: Response): number {
    const retryAfter = response.headers.get('Retry-After');
    return retryAfter ? parseInt(retryAfter) * 1000 : 1000;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Phase 2: Extend MusicSearchService (TDD)

**Test File**: `__tests__/unit/music-search.test.ts` (EXTEND existing tests)

**New Test Cases to Add**:
```typescript
describe('MusicSearchService - Spotify Integration', () => {
  describe('search70sSongs with Spotify', () => {
    it('should include Spotify results when includeSpotify is true');
    it('should use Spotify as primary when spotifyPrimary is true');
    it('should fall back to MusicBrainz when Spotify fails');
    it('should merge results from multiple sources');
    it('should preserve enhanced metadata from Spotify');
    it('should handle mixed source results correctly');
  });
  
  describe('Spotify error handling', () => {
    it('should gracefully handle missing Spotify credentials');
    it('should continue with MusicBrainz when Spotify fails');
    it('should not crash on Spotify API errors');
  });
});
```

**Implementation**: Extend `src/lib/musicSearchService.ts`

```typescript
import { SpotifyClient } from './spotify/client.js';

export class MusicSearchService {
  private cache = new Map<string, CacheEntry>();
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 1000;
  private readonly CACHE_TIMEOUT_MS = 10 * 60 * 1000;
  private readonly DEFAULT_MAX_RESULTS = 15;
  
  // NEW: Add Spotify client
  private spotifyClient: SpotifyClient;

  constructor() {
    // Initialize Spotify client with environment variables
    this.spotifyClient = new SpotifyClient(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET
    );
  }

  // ENHANCED: Updated search method with Spotify support
  async search70sSongs(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const {
      includeFallback = false,
      maxResults = this.DEFAULT_MAX_RESULTS,
      cacheTimeout = this.CACHE_TIMEOUT_MS,
      includeSpotify = true,        // NEW: Enable Spotify by default
      spotifyPrimary = false,       // NEW: Use Spotify as primary source
      includeEnhancedMetadata = true // NEW: Include rich metadata
    } = options;

    // Check cache first (include options in cache key)
    const cacheKey = `${query}_${maxResults}_${includeSpotify}_${spotifyPrimary}`;
    const cached = this.getFromCache(cacheKey, cacheTimeout);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    try {
      let result: SearchResult;
      
      if (spotifyPrimary && includeSpotify) {
        // Spotify-first strategy
        result = await this.searchSpotifyFirst(query, maxResults, options);
      } else if (includeSpotify) {
        // Mixed strategy (MusicBrainz + Spotify)
        result = await this.searchMixed(query, maxResults, options);
      } else {
        // Original MusicBrainz-only strategy
        result = await this.searchMusicBrainzOnly(query, maxResults, options);
      }

      // Cache successful results
      if (result.success) {
        this.setCache(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.warn('Music search failed:', error);

      if (includeFallback) {
        const fallbackSongs = this.searchCuratedSongs(query).slice(0, maxResults);
        return {
          success: true,
          songs: fallbackSongs,
          source: 'fallback',
          totalFound: fallbackSongs.length,
          sourcesUsed: ['curated'],
          searchStrategy: 'fallback-only'
        };
      }

      return {
        success: false,
        songs: [],
        error: 'All search methods failed',
        source: 'api'
      };
    }
  }

  // NEW: Spotify-first search strategy
  private async searchSpotifyFirst(query: string, maxResults: number, options: SearchOptions): Promise<SearchResult> {
    const sourcesUsed: Array<'musicbrainz' | 'spotify' | 'curated'> = [];
    let allSongs: Song[] = [];

    try {
      // Try Spotify first
      const spotifyResults = await this.searchSpotifyAPI(query, maxResults);
      if (spotifyResults.length > 0) {
        allSongs = spotifyResults;
        sourcesUsed.push('spotify');
        
        // If we have enough results from Spotify, return them
        if (allSongs.length >= maxResults) {
          return {
            success: true,
            songs: allSongs.slice(0, maxResults),
            source: 'spotify',
            totalFound: allSongs.length,
            sourcesUsed,
            searchStrategy: 'spotify-primary'
          };
        }
      }
    } catch (error) {
      console.warn('Spotify search failed, falling back to MusicBrainz:', error);
    }

    // Fill in with MusicBrainz if needed
    try {
      const remaining = maxResults - allSongs.length;
      if (remaining > 0) {
        await this.waitForRateLimit();
        const mbResult = await this.searchMusicBrainzAPI(query, remaining);
        if (mbResult.success && mbResult.songs.length > 0) {
          allSongs = [...allSongs, ...mbResult.songs];
          sourcesUsed.push('musicbrainz');
        }
      }
    } catch (error) {
      console.warn('MusicBrainz search also failed:', error);
    }

    // Fallback to curated if still not enough
    if (allSongs.length === 0 && options.includeFallback) {
      const curatedSongs = this.searchCuratedSongs(query).slice(0, maxResults);
      allSongs = curatedSongs;
      sourcesUsed.push('curated');
    }

    return {
      success: allSongs.length > 0,
      songs: allSongs.slice(0, maxResults),
      source: sourcesUsed.length > 1 ? 'mixed' : (sourcesUsed[0] as any) || 'api',
      totalFound: allSongs.length,
      sourcesUsed,
      searchStrategy: 'spotify-primary'
    };
  }

  // NEW: Mixed search strategy (MusicBrainz + Spotify)
  private async searchMixed(query: string, maxResults: number, options: SearchOptions): Promise<SearchResult> {
    const sourcesUsed: Array<'musicbrainz' | 'spotify' | 'curated'> = [];
    let allSongs: Song[] = [];

    // Start with MusicBrainz (original behavior)
    try {
      await this.waitForRateLimit();
      const mbResult = await this.searchMusicBrainzAPI(query, Math.ceil(maxResults / 2));
      if (mbResult.success) {
        allSongs = mbResult.songs;
        sourcesUsed.push('musicbrainz');
      }
    } catch (error) {
      console.warn('MusicBrainz search failed:', error);
    }

    // Enhance with Spotify results
    try {
      const remaining = maxResults - allSongs.length;
      const spotifyResults = await this.searchSpotifyAPI(query, Math.max(remaining, Math.ceil(maxResults / 2)));
      
      // Add Spotify results that aren't duplicates
      const uniqueSpotifyResults = spotifyResults.filter(spotifyTrack => 
        !allSongs.some(existingTrack => 
          this.areTracksEquivalent(existingTrack, spotifyTrack)
        )
      );
      
      if (uniqueSpotifyResults.length > 0) {
        allSongs = [...allSongs, ...uniqueSpotifyResults];
        sourcesUsed.push('spotify');
      }
    } catch (error) {
      console.warn('Spotify enhancement failed:', error);
    }

    // Final fallback if needed
    if (allSongs.length === 0 && options.includeFallback) {
      const curatedSongs = this.searchCuratedSongs(query).slice(0, maxResults);
      allSongs = curatedSongs;
      sourcesUsed.push('curated');
    }

    return {
      success: allSongs.length > 0,
      songs: allSongs.slice(0, maxResults),
      source: sourcesUsed.length > 1 ? 'mixed' : (sourcesUsed[0] as any) || 'api',
      totalFound: allSongs.length,
      sourcesUsed,
      searchStrategy: 'musicbrainz-primary'
    };
  }

  // NEW: Original MusicBrainz-only search (for backwards compatibility)
  private async searchMusicBrainzOnly(query: string, maxResults: number, options: SearchOptions): Promise<SearchResult> {
    await this.waitForRateLimit();
    const result = await this.searchMusicBrainzAPI(query, maxResults);
    return {
      ...result,
      sourcesUsed: ['musicbrainz'],
      searchStrategy: 'musicbrainz-primary'
    };
  }

  // NEW: Search Spotify API for 70's music
  private async searchSpotifyAPI(query: string, maxResults: number): Promise<Song[]> {
    // Add 70's decade filter to query
    const decade70sQuery = `${query} year:1970-1979`;
    const allResults = await this.spotifyClient.searchTracks(decade70sQuery, maxResults * 2);
    
    // Additional filtering to ensure 70's only
    const filtered70s = allResults.filter(track => 
      track.year && track.year >= 1970 && track.year <= 1979
    );
    
    return filtered70s.slice(0, maxResults);
  }

  // NEW: Check if two tracks are equivalent (for deduplication)
  private areTracksEquivalent(track1: Song, track2: Song): boolean {
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    
    return normalize(track1.title) === normalize(track2.title) && 
           normalize(track1.artist) === normalize(track2.artist);
  }

  // Existing methods remain unchanged for backwards compatibility
  // ... (getCuratedSongs, searchCuratedSongs, formatSongDisplay, etc.)
}
```

### Phase 3: Integration Testing and API Endpoint (TDD)

**Test File**: `__tests__/integration/music-search-integration.test.ts`

**Integration Test Cases**:
```typescript
describe('Enhanced Music Search Integration', () => {
  describe('MusicSearchService with Spotify', () => {
    it('should return mixed results from MusicBrainz and Spotify');
    it('should work with existing components unchanged');
    it('should handle Spotify credential failures gracefully');
    it('should maintain backwards compatibility with existing tests');
    it('should deduplicate similar tracks from different sources');
  });
  
  describe('if API endpoint is created', () => {
    it('should maintain existing response format');
    it('should include enhanced metadata when available');
    it('should respect search options via query params');
  });
});
```

**Optional API Endpoint**: Create only if needed for frontend integration

`src/pages/api/music-search.ts` (OPTIONAL)
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { musicSearchService, type SearchResult } from '../../lib/musicSearchService.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResult | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q: query, includeSpotify, spotifyPrimary, maxResults } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const result = await musicSearchService.search70sSongs(query.trim(), {
      includeFallback: true,
      includeSpotify: includeSpotify !== 'false',
      spotifyPrimary: spotifyPrimary === 'true',
      maxResults: maxResults ? parseInt(maxResults as string) : undefined
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Music search error:', error);
    
    res.status(200).json({
      success: false,
      songs: [],
      error: 'Search service temporarily unavailable',
      source: 'api'
    });
  }
}
```

```typescript
export class SpotifyClient {
  private authService: AuthService;
  private searchCache: CacheService<EnhancedTrack[]>;
  private readonly baseUrl = 'https://api.spotify.com/v1';
  private readonly maxRetries = 3;

  constructor(clientId: string, clientSecret: string) {
    this.authService = new AuthService(clientId, clientSecret);
    this.searchCache = new CacheService<EnhancedTrack[]>();
  }

  async searchTracks(query: string): Promise<EnhancedTrack[]> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query);
      const cached = this.searchCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Make API request with retry logic
      const results = await this.performSearchWithRetry(query);
      
      // Cache successful results
      this.searchCache.set(cacheKey, results, 300); // 5 minutes
      
      return results;
    } catch (error) {
      // Never crash - always return empty array
      console.error('Spotify search failed:', error);
      return [];
    }
  }

  private async performSearchWithRetry(query: string): Promise<EnhancedTrack[]> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const token = await this.authService.getAccessToken();
        const response = await this.makeSearchRequest(query, token);
        
        if (response.status === 429) {
          const retryAfter = this.getRetryAfterDelay(response);
          await this.delay(retryAfter);
          continue;
        }
        
        if (!response.ok) {
          throw new SpotifyError(
            `HTTP ${response.status}`,
            `HTTP_${response.status}`,
            response.status >= 500
          );
        }
        
        const data = await response.json();
        return this.transformSearchResults(data);
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries && this.isRetriableError(error)) {
          await this.delay(Math.pow(2, attempt - 1) * 1000); // Exponential backoff
          continue;
        }
        
        break;
      }
    }
    
    throw lastError!;
  }

  private async makeSearchRequest(query: string, token: string): Promise<Response> {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '20',
      market: 'US'
    });

    return fetch(`${this.baseUrl}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
  }

  private transformSearchResults(data: any): EnhancedTrack[] {
    if (!data.tracks?.items) {
      return [];
    }

    return data.tracks.items.map((track: SpotifyTrack): EnhancedTrack => ({
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album.name,
      year: new Date(track.album.release_date).getFullYear(),
      preview_url: track.preview_url,
      spotify_id: track.id,
      popularity: track.popularity,
      image_url: track.album.images[0]?.url || null,
    }));
  }

  private isRetriableError(error: any): boolean {
    return error instanceof SpotifyError && error.retryable;
  }

  private getRetryAfterDelay(response: Response): number {
    const retryAfter = response.headers.get('Retry-After');
    return retryAfter ? parseInt(retryAfter) * 1000 : 1000;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(query: string): string {
    return `search:${query.toLowerCase().trim()}`;
  }
}
```

### Phase 4: API Endpoint Integration (TDD)

**Test File**: `__tests__/integration/spotify-integration.test.ts`

**Integration Test Cases**:
```typescript
describe('Music Search API Integration', () => {
  describe('/api/music-search', () => {
    it('should return enhanced results from Spotify');
    it('should handle empty search queries');
    it('should return empty array when Spotify fails');
    it('should respect rate limits gracefully');
    it('should maintain backwards compatibility');
  });
});
```

**Implementation**: `src/pages/api/music-search.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { SpotifyClient } from '../../lib/spotify/client';
import type { SearchResponse } from '../../lib/spotify/types';

const spotifyClient = new SpotifyClient(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q: query } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const tracks = await spotifyClient.searchTracks(query.trim());
    
    const response: SearchResponse = {
      tracks,
      total: tracks.length,
      cached: false, // Could be enhanced to track cache hits
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Music search error:', error);
    
    // Always return valid response structure
    res.status(200).json({
      tracks: [],
      total: 0,
      cached: false,
    });
  }
}
```

### Phase 5: Environment Configuration

**Environment Variables** (`.env.local`):
```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Configuration Validation** (`src/lib/spotify/config.ts`):
```typescript
export function validateSpotifyConfig(): void {
  const requiredVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
}
```

## Testing Strategy

### Unit Test Coverage Requirements
- **AuthService**: 100% coverage of token management
- **CacheService**: 100% coverage of caching logic
- **SpotifyClient**: 95+ % coverage with mock scenarios
- **Utility functions**: 100% coverage

### Integration Test Scenarios
1. **Happy Path**: Successful search with real API structure
2. **Error Scenarios**: Network failures, rate limiting, invalid responses
3. **Cache Behavior**: Cache hits, misses, expiration
4. **Authentication Edge Cases**: Token refresh, credential errors

### Mock Strategy
```typescript
// Test utilities
export const createMockSpotifyResponse = (tracks: Partial<SpotifyTrack>[] = []) => ({
  tracks: {
    items: tracks.map(track => ({
      id: 'mock-id',
      name: 'Mock Track',
      artists: [{ id: 'artist-id', name: 'Mock Artist' }],
      album: {
        id: 'album-id',
        name: 'Mock Album',
        release_date: '2023-01-01',
        images: [{ url: 'http://example.com/image.jpg', height: 300, width: 300 }],
      },
      preview_url: 'http://example.com/preview.mp3',
      popularity: 75,
      explicit: false,
      ...track,
    })),
  },
});
```

## Deployment Requirements

### Pre-deployment Checklist
1. **Environment Variables**: Spotify credentials configured
2. **Unit Tests**: All tests passing (100% for core services)
3. **Integration Tests**: API contract tests passing
4. **Error Handling**: All error scenarios covered
5. **Performance**: Response times under target (<2s)
6. **Caching**: Cache hit rates validated
7. **Security**: No credential exposure in client-side code

### Post-deployment Validation
1. **Smoke Tests**: Basic search functionality works
2. **Error Simulation**: Test with invalid credentials, network issues
3. **Performance Monitoring**: Response time metrics
4. **Cache Effectiveness**: Monitor cache hit rates
5. **Error Rates**: Monitor and alert on error spikes

## Risk Mitigation Implementation

### Circuit Breaker Pattern (Future Enhancement)
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new SpotifyError('Circuit breaker is open', 'CIRCUIT_OPEN', false);
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Health Check Endpoint
```typescript
// /api/health/spotify
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = new SpotifyClient(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
    
    // Simple health check search
    const results = await client.searchTracks('test');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      spotify_api: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      spotify_api: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

## Success Metrics and Monitoring

### Key Performance Indicators
1. **Response Time**: P95 < 2 seconds for search requests
2. **Error Rate**: < 2% of requests should fail
3. **Cache Hit Rate**: > 70% for repeated queries
4. **Uptime**: > 99.9% availability

### Logging Strategy
```typescript
interface SearchMetrics {
  query: string;
  results_count: number;
  response_time_ms: number;
  cache_hit: boolean;
  error: string | null;
  timestamp: string;
}

function logSearchMetrics(metrics: SearchMetrics): void {
  console.log(JSON.stringify({
    event: 'spotify_search',
    ...metrics
  }));
}
```

This implementation plan provides a comprehensive roadmap for building a resilient Spotify integration that follows TDD principles and maintains high reliability standards.