import type { SpotifySearchResponse, SpotifyTrack } from './types.js';
import { SpotifyError } from './types.js';

// Extended Song interface for Spotify results
export interface Song {
  id: string;
  title: string;
  artist: string;
  year?: number;
  source: 'musicbrainz' | 'curated' | 'spotify';
  youtubeSearchUrl?: string;
  musicbrainzId?: string;

  // Spotify-enhanced fields (optional for backwards compatibility)
  spotifyId?: string;
  previewUrl?: string | null;
  popularity?: number;
  albumArtUrl?: string | null;
  explicit?: boolean;
}

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
    // Enhanced logging for production debugging
    console.log('🔍 [SPOTIFY_DEBUG] Starting token refresh...');
    console.log('🔍 [SPOTIFY_DEBUG] Client ID present:', !!this.clientId);
    console.log('🔍 [SPOTIFY_DEBUG] Client Secret present:', !!this.clientSecret);
    console.log('🔍 [SPOTIFY_DEBUG] Client ID length:', this.clientId ? this.clientId.length : 0);
    console.log('🔍 [SPOTIFY_DEBUG] Client Secret length:', this.clientSecret ? this.clientSecret.length : 0);

    if (this.clientId) {
      console.log('🔍 [SPOTIFY_DEBUG] Client ID prefix:', this.clientId.substring(0, 8) + '...');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    console.log('🔍 [SPOTIFY_DEBUG] Credentials encoded length:', credentials.length);

    const requestBody = 'grant_type=client_credentials';
    const requestUrl = 'https://accounts.spotify.com/api/token';

    console.log('🔍 [SPOTIFY_DEBUG] Request URL:', requestUrl);
    console.log('🔍 [SPOTIFY_DEBUG] Request body:', requestBody);

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      console.log('🔍 [SPOTIFY_DEBUG] Response status:', response.status);
      console.log('🔍 [SPOTIFY_DEBUG] Response ok:', response.ok);
      console.log('🔍 [SPOTIFY_DEBUG] Response headers:', {
        contentType: response.headers.get('content-type'),
        cacheControl: response.headers.get('cache-control')
      });

      if (!response.ok) {
        let errorBody: string;
        try {
          errorBody = await response.text();
          console.log('🔍 [SPOTIFY_DEBUG] Error response body:', errorBody);
        } catch (e) {
          errorBody = 'Could not read error response';
          console.log('🔍 [SPOTIFY_DEBUG] Could not read error response');
        }

        throw new SpotifyError(`Authentication failed: ${response.status} - ${errorBody}`, 'AUTH_FAILED', false);
      }

      const tokens = await response.json();
      console.log('🔍 [SPOTIFY_DEBUG] Token response received:', {
        hasAccessToken: !!tokens.access_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        tokenLength: tokens.access_token ? tokens.access_token.length : 0
      });

      if (!tokens.access_token) {
        console.log('❌ [SPOTIFY_DEBUG] No access token in response!');
        throw new SpotifyError('No access token in response', 'INVALID_TOKEN_RESPONSE', false);
      }

      this.tokenCache = {
        token: tokens.access_token,
        expires: new Date(Date.now() + (tokens.expires_in - 60) * 1000), // 1 min buffer
      };

      console.log('✅ [SPOTIFY_DEBUG] Token refresh successful, expires at:', this.tokenCache.expires.toISOString());
      return tokens.access_token;

    } catch (error) {
      console.log('❌ [SPOTIFY_DEBUG] Token refresh failed:', error);
      throw error;
    }
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