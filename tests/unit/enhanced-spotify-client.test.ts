import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedSpotifyClient } from '../../src/lib/spotify/enhanced-client.js';
import { SpotifyAuthenticationError } from '../../src/lib/spotify/auth-types.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.log to capture logging output
const mockConsoleLog = vi.fn();
const originalConsoleLog = console.log;

describe('Enhanced SpotifyClient', () => {
  let client: EnhancedSpotifyClient;

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = mockConsoleLog;
    client = new EnhancedSpotifyClient('test_client_id', 'test_client_secret');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    console.log = originalConsoleLog;
  });

  describe('Authentication Logging and Debugging', () => {
    test('should log initialization details', () => {
      new EnhancedSpotifyClient('test_id', 'test_secret');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[SPOTIFY_AUTH] INIT:'),
        expect.objectContaining({
          hasClientId: true,
          hasClientSecret: true,
          clientIdPrefix: 'test_id_...'
        })
      );
    });

    test('should log missing credentials during initialization', () => {
      new EnhancedSpotifyClient('', '');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[SPOTIFY_AUTH] INIT:'),
        expect.objectContaining({
          hasClientId: false,
          hasClientSecret: false,
          clientIdPrefix: 'missing'
        })
      );
    });
  });

  describe('Enhanced Error Handling', () => {
    test('should throw specific error for missing client ID', async () => {
      const clientWithoutId = new EnhancedSpotifyClient('', 'test_secret');

      const result = await clientWithoutId.searchTracks('test', 1);

      expect(result).toEqual([]);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('SEARCH_FAILED'),
        expect.objectContaining({
          error: expect.stringContaining('SPOTIFY_CLIENT_ID'),
          code: 'MISSING_CLIENT_ID'
        })
      );
    });

    test('should retry on server errors with exponential backoff', async () => {
      let callCount = 0;

      mockFetch.mockImplementation((url) => {
        if (url === 'https://accounts.spotify.com/api/token') {
          callCount++;
          if (callCount < 3) {
            return Promise.resolve({
              ok: false,
              status: 500,
              text: () => Promise.resolve('Server Error')
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access_token: 'retry_success', expires_in: 3600 })
          });
        }
        // Search request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tracks: { items: [] } })
        });
      });

      const startTime = Date.now();
      const result = await client.searchTracks('test query', 1);
      const endTime = Date.now();

      expect(result).toEqual([]);
      expect(callCount).toBe(3); // Should have retried twice
      expect(endTime - startTime).toBeGreaterThan(3000); // Should have waited for exponential backoff
    });

    test('should not retry on authentication errors (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('invalid_client')
      });

      const result = await client.searchTracks('test', 1);

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries on 401
    });

    test('should log detailed authentication failure information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"error":"invalid_client","error_description":"Invalid client credentials"}'),
        headers: {
          get: (header) => header === 'content-type' ? 'application/json' : null
        }
      });

      await client.searchTracks('test', 1);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('AUTH_FAILED'),
        expect.objectContaining({
          status: 401,
          body: expect.stringContaining('invalid_client'),
          json: expect.objectContaining({
            error: 'invalid_client'
          })
        })
      );
    });
  });

  describe('Token Management', () => {
    test('should log token validity checks', async () => {
      const mockTokenResponse = {
        access_token: 'test_token',
        expires_in: 3600
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tracks: { items: [] } })
        });

      await client.searchTracks('test', 1);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('TOKEN_VALIDITY_CHECK'),
        expect.objectContaining({
          hasToken: false,
          isValid: false
        })
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('TOKEN_REFRESH_SUCCESS'),
        expect.objectContaining({
          attempt: 1
        })
      );
    });

    test('should reuse valid tokens', async () => {
      const futureExpiry = new Date(Date.now() + 3600000); // 1 hour from now
      const mockTokenResponse = {
        access_token: 'cached_token',
        expires_in: 3600
      };

      // First request - get token
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ tracks: { items: [] } })
        });

      await client.searchTracks('first', 1);
      await client.searchTracks('second', 1);

      // Should only have one token request
      const tokenRequests = mockFetch.mock.calls.filter(call =>
        call[0] === 'https://accounts.spotify.com/api/token'
      );
      expect(tokenRequests).toHaveLength(1);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('TOKEN_VALIDITY_CHECK'),
        expect.objectContaining({
          isValid: true
        })
      );
    });
  });

  describe('Search Request Logging', () => {
    test('should log search request details', async () => {
      const mockTokenResponse = { access_token: 'test_token', expires_in: 3600 };
      const mockSearchResponse = { tracks: { items: [
        {
          id: 'track1',
          name: 'Test Song',
          artists: [{ name: 'Test Artist' }],
          album: { release_date: '1975-01-01', images: [] },
          preview_url: null,
          popularity: 50,
          explicit: false
        }
      ] } };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSearchResponse)
        });

      const result = await client.searchTracks('dancing queen test query', 5);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('SEARCH_REQUEST'),
        expect.objectContaining({
          query: 'dancing queen test qu...',
          limit: 5,
          hasToken: true,
          tokenPrefix: 'test_tok...'
        })
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('SEARCH_RESULTS_TRANSFORMED'),
        expect.objectContaining({
          rawCount: 1,
          transformedCount: 1
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Song');
    });

    test('should handle empty search results', async () => {
      const mockTokenResponse = { access_token: 'test_token', expires_in: 3600 };
      const mockSearchResponse = { tracks: { items: [] } };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSearchResponse)
        });

      const result = await client.searchTracks('nonexistent', 1);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('SEARCH_RESULTS_TRANSFORMED'),
        expect.objectContaining({
          rawCount: 0,
          transformedCount: 0
        })
      );

      expect(result).toEqual([]);
    });
  });

  describe('Authentication Metrics', () => {
    test('should track authentication attempts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error')
      });

      await client.searchTracks('test', 1);

      const metrics = client.getAuthMetrics();

      expect(metrics.totalAttempts).toBeGreaterThan(0);
      expect(metrics.failedAttempts).toBeGreaterThan(0);
      expect(metrics.lastAttempt).toBeTruthy();
      expect(metrics.lastAttempt.success).toBe(false);
    });

    test('should track successful authentication', async () => {
      const mockTokenResponse = { access_token: 'success_token', expires_in: 3600 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tracks: { items: [] } })
        });

      await client.searchTracks('test', 1);

      const metrics = client.getAuthMetrics();

      expect(metrics.successfulAttempts).toBe(1);
      expect(metrics.lastAttempt.success).toBe(true);
    });
  });
});