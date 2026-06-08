import type { SpotifySearchResponse, SpotifyTrack } from './types.js';
import { SpotifyError } from './types.js';
import type { Song } from './client.js';
import { SpotifyAuthenticationError, type AuthenticationResult, type AuthenticationAttempt } from './auth-types.js';

export type { Song };

export class EnhancedSpotifyClient {
  private tokenCache: { token: string; expires: Date } | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://api.spotify.com/v1';
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 100;
  private authAttempts: AuthenticationAttempt[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || '';
    this.clientSecret = clientSecret || '';

    // Log initialization for production debugging
    this.logAuthEvent('INIT', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdPrefix: this.clientId ? this.clientId.substring(0, 8) + '...' : 'missing'
    });
  }

  async searchTracks(query: string, maxResults: number = 20): Promise<Song[]> {
    try {
      this.validateCredentials();
      await this.waitForRateLimit();

      const token = await this.getAccessTokenWithRetry();
      const response = await this.makeSearchRequest(query, token, maxResults);

      if (response.status === 429) {
        const retryAfter = this.getRetryAfterDelay(response);
        await this.delay(retryAfter);
        return this.searchTracks(query, maxResults);
      }

      if (!response.ok) {
        throw new SpotifyAuthenticationError(
          `HTTP ${response.status}`,
          `HTTP_${response.status}`,
          response.status >= 500,
          response.status
        );
      }

      const data: SpotifySearchResponse = await response.json();
      return this.transformToSongFormat(data);

    } catch (error) {
      this.logAuthEvent('SEARCH_FAILED', {
        error: error.message,
        code: error.code,
        query: query.substring(0, 20) + '...'
      });

      // For production debugging, we want to see these errors
      console.warn('Spotify search failed:', error);
      return [];
    }
  }

  private validateCredentials(): void {
    if (!this.clientId) {
      throw new SpotifyAuthenticationError(
        'SPOTIFY_CLIENT_ID environment variable not found',
        'MISSING_CLIENT_ID',
        false
      );
    }

    if (!this.clientSecret) {
      throw new SpotifyAuthenticationError(
        'SPOTIFY_CLIENT_SECRET environment variable not found',
        'MISSING_CLIENT_SECRET',
        false
      );
    }

    this.logAuthEvent('CREDENTIALS_VALIDATED', {
      clientIdLength: this.clientId.length,
      clientSecretLength: this.clientSecret.length
    });
  }

  private async getAccessTokenWithRetry(): Promise<string> {
    if (this.isTokenValid()) {
      return this.tokenCache!.token;
    }

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.refreshTokenWithLogging(attempt);
      } catch (error) {
        const isLastAttempt = attempt === this.MAX_RETRIES;
        const isRetryable = error.retryable && error.statusCode !== 401;

        this.logAuthEvent('AUTH_ATTEMPT_FAILED', {
          attempt,
          maxRetries: this.MAX_RETRIES,
          error: error.message,
          retryable: isRetryable,
          statusCode: error.statusCode
        });

        if (isLastAttempt || !isRetryable) {
          throw error;
        }

        const delay = this.BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        this.logAuthEvent('RETRY_DELAY', { delay, nextAttempt: attempt + 1 });
        await this.delay(delay);
      }
    }

    throw new SpotifyAuthenticationError('Max retries exceeded', 'MAX_RETRIES_EXCEEDED', false);
  }

  private isTokenValid(): boolean {
    if (!this.tokenCache) {
      return false;
    }

    const isValid = this.tokenCache.expires > new Date();
    this.logAuthEvent('TOKEN_VALIDITY_CHECK', {
      hasToken: !!this.tokenCache,
      isValid,
      expiresIn: this.tokenCache.expires ? this.tokenCache.expires.getTime() - Date.now() : null
    });

    return isValid;
  }

  private async refreshTokenWithLogging(attempt: number): Promise<string> {
    const startTime = Date.now();

    this.logAuthEvent('TOKEN_REFRESH_START', { attempt });

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const requestDetails = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'POST',
      hasAuth: !!credentials,
      bodyLength: 'grant_type=client_credentials'.length
    };

    this.logAuthEvent('TOKEN_REQUEST_DETAILS', requestDetails);

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const responseTime = Date.now() - startTime;

      this.logAuthEvent('TOKEN_RESPONSE_RECEIVED', {
        status: response.status,
        ok: response.ok,
        responseTime,
        headers: response.headers ? {
          contentType: response.headers.get('content-type'),
          cacheControl: response.headers.get('cache-control')
        } : null
      });

      if (!response.ok) {
        let errorDetails: any = { status: response.status };

        try {
          const errorText = await response.text();
          errorDetails.body = errorText;

          // Try to parse as JSON for more details
          try {
            errorDetails.json = JSON.parse(errorText);
          } catch {
            // Not JSON, keep as text
          }
        } catch {
          errorDetails.body = 'Failed to read response body';
        }

        this.logAuthEvent('AUTH_FAILED', errorDetails);

        throw new SpotifyAuthenticationError(
          `Authentication failed: ${response.status} - ${errorDetails.body}`,
          'AUTH_FAILED',
          response.status >= 500,
          response.status
        );
      }

      const tokens = await response.json();

      this.logAuthEvent('TOKEN_PARSED', {
        hasAccessToken: !!tokens.access_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        tokenLength: tokens.access_token ? tokens.access_token.length : 0
      });

      if (!tokens.access_token) {
        throw new SpotifyAuthenticationError(
          'No access token in response',
          'INVALID_TOKEN_RESPONSE',
          false
        );
      }

      this.tokenCache = {
        token: tokens.access_token,
        expires: new Date(Date.now() + (tokens.expires_in - 60) * 1000),
      };

      this.recordSuccessfulAuth(attempt, responseTime);

      this.logAuthEvent('TOKEN_REFRESH_SUCCESS', {
        attempt,
        responseTime,
        expiresAt: this.tokenCache.expires.toISOString()
      });

      return tokens.access_token;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailedAuth(attempt, error, responseTime);
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

    const searchUrl = `${this.baseUrl}/search?${params}`;

    this.logAuthEvent('SEARCH_REQUEST', {
      query: query.substring(0, 20) + '...',
      limit,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 8) + '...' : 'missing',
      url: searchUrl
    });

    return fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
  }

  private transformToSongFormat(data: SpotifySearchResponse): Song[] {
    if (!data.tracks?.items) {
      this.logAuthEvent('EMPTY_SEARCH_RESULTS', { hasData: !!data, hasTracks: !!data.tracks });
      return [];
    }

    const songs = data.tracks.items.map((track: SpotifyTrack): Song => ({
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

    this.logAuthEvent('SEARCH_RESULTS_TRANSFORMED', {
      rawCount: data.tracks.items.length,
      transformedCount: songs.length
    });

    return songs;
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
      await this.delay(delay);
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

  private logAuthEvent(event: string, details?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      service: 'SpotifyAuth',
      ...details
    };

    console.log(`[${timestamp}] [SPOTIFY_AUTH] ${event}:`, details || '');
  }

  private recordSuccessfulAuth(attempt: number, responseTime: number): void {
    this.authAttempts.push({
      attemptNumber: attempt,
      timestamp: Date.now(),
      success: true,
      responseTime
    });

    // Keep only last 10 attempts for memory
    if (this.authAttempts.length > 10) {
      this.authAttempts.shift();
    }
  }

  private recordFailedAuth(attempt: number, error: any, responseTime: number): void {
    this.authAttempts.push({
      attemptNumber: attempt,
      timestamp: Date.now(),
      success: false,
      error: error.message,
      responseStatus: error.statusCode,
      responseTime
    });

    if (this.authAttempts.length > 10) {
      this.authAttempts.shift();
    }
  }

  getAuthMetrics(): any {
    const successful = this.authAttempts.filter(a => a.success);
    const failed = this.authAttempts.filter(a => !a.success);

    return {
      totalAttempts: this.authAttempts.length,
      successfulAttempts: successful.length,
      failedAttempts: failed.length,
      lastAttempt: this.authAttempts[this.authAttempts.length - 1] || null,
      recentAttempts: this.authAttempts.slice(-5)
    };
  }
}