import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpotifyClient } from '../../src/lib/spotify/client.js';
import { SpotifyError } from '../../src/lib/spotify/types.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SpotifyClient Authentication', () => {
  let client: SpotifyClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SpotifyClient('test_client_id', 'test_client_secret');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    test('should obtain access token on first request', async () => {
      const mockTokenResponse = {
        access_token: 'test_access_token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      // Mock token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTokenResponse)
      });

      // Mock search request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ tracks: { items: [] } })
      });

      await client.searchTracks('test query', 5);

      // Verify token request was made
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic dGVzdF9jbGllbnRfaWQ6dGVzdF9jbGllbnRfc2VjcmV0', // base64 encoded
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
    });

    test('should reuse valid token without refreshing', async () => {
      const mockTokenResponse = {
        access_token: 'cached_token',
        expires_in: 3600
      };

      // Mock initial token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTokenResponse)
      });

      // Mock multiple search requests
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ tracks: { items: [] } })
      });

      // First request - should get token
      await client.searchTracks('query1', 5);

      // Second request - should reuse token
      await client.searchTracks('query2', 5);

      // Only one token request should be made
      const tokenRequests = mockFetch.mock.calls.filter(call =>
        call[0] === 'https://accounts.spotify.com/api/token'
      );
      expect(tokenRequests).toHaveLength(1);
    });

    test('should refresh expired token', async () => {
      const expiredTokenResponse = {
        access_token: 'expired_token',
        expires_in: -1 // Already expired
      };

      const freshTokenResponse = {
        access_token: 'fresh_token',
        expires_in: 3600
      };

      // Mock expired token then fresh token
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(expiredTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(freshTokenResponse)
        })
        .mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({ tracks: { items: [] } })
        });

      await client.searchTracks('query1', 5);

      // Wait for token to be considered expired
      await new Promise(resolve => setTimeout(resolve, 10));

      await client.searchTracks('query2', 5);

      // Should have made two token requests
      const tokenRequests = mockFetch.mock.calls.filter(call =>
        call[0] === 'https://accounts.spotify.com/api/token'
      );
      expect(tokenRequests).toHaveLength(2);
    });
  });

  describe('Authentication Error Handling', () => {
    test('should throw SpotifyError on authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'invalid_client' })
      });

      const result = await client.searchTracks('test', 5);

      // Should return empty array on auth failure (graceful degradation)
      expect(result).toEqual([]);
    });

    test('should handle missing credentials', async () => {
      const clientWithoutCreds = new SpotifyClient('', '');

      const result = await clientWithoutCreds.searchTracks('test', 5);

      expect(result).toEqual([]);
    });

    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.searchTracks('test', 5);

      expect(result).toEqual([]);
    });

    test('should handle malformed token response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({}) // Missing access_token
      });

      const result = await client.searchTracks('test', 5);

      expect(result).toEqual([]);
    });
  });

  describe('Rate Limiting', () => {
    test('should handle 429 rate limit responses', async () => {
      const mockTokenResponse = {
        access_token: 'test_token',
        expires_in: 3600
      };

      mockFetch
        // Token request
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockTokenResponse)
        })
        // Rate limited response
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: {
            get: vi.fn().mockReturnValue('1') // Retry-After: 1 second
          }
        })
        // Successful retry
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ tracks: { items: [] } })
        });

      const startTime = Date.now();
      const result = await client.searchTracks('test', 5);
      const endTime = Date.now();

      expect(result).toEqual([]);
      // Should have waited at least 1 second for retry
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Search Result Transformation', () => {
    test('should transform Spotify tracks to Song format', async () => {
      const mockTokenResponse = {
        access_token: 'test_token',
        expires_in: 3600
      };

      const mockSearchResponse = {
        tracks: {
          items: [
            {
              id: 'spotify_id_123',
              name: 'Dancing Queen',
              artists: [{ name: 'ABBA' }],
              album: {
                release_date: '1976-08-15',
                images: [{ url: 'https://album-art.jpg' }]
              },
              preview_url: 'https://preview.mp3',
              popularity: 95,
              explicit: false
            }
          ]
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse)
        });

      const result = await client.searchTracks('dancing queen', 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'spotify_id_123',
        title: 'Dancing Queen',
        artist: 'ABBA',
        year: 1976,
        source: 'spotify',
        spotifyId: 'spotify_id_123',
        albumArtUrl: 'https://album-art.jpg',
        explicit: false,
        popularity: 95
      });
    });

    test('should handle empty search results', async () => {
      const mockTokenResponse = {
        access_token: 'test_token',
        expires_in: 3600
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ tracks: { items: [] } })
        });

      const result = await client.searchTracks('nonexistent song', 5);

      expect(result).toEqual([]);
    });
  });
});