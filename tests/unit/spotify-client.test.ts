import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SpotifyClient } from '../../src/lib/spotify/client.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('SpotifyClient', () => {
  let spotifyClient: SpotifyClient;

  beforeEach(() => {
    spotifyClient = new SpotifyClient('test-client-id', 'test-client-secret');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchTracks', () => {
    it('should return enhanced tracks for successful search', async () => {
      // Mock authentication
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'mock-token',
          token_type: 'Bearer',
          expires_in: 3600
        })
      } as Response);

      // Mock search response
      const mockSpotifyResponse = {
        tracks: {
          items: [
            {
              id: 'spotify-123',
              name: 'Bohemian Rhapsody',
              artists: [{ id: 'queen-id', name: 'Queen' }],
              album: {
                id: 'album-id',
                name: 'A Night at the Opera',
                release_date: '1975-10-31',
                images: [{ url: 'http://example.com/album.jpg', height: 300, width: 300 }]
              },
              preview_url: 'http://example.com/preview.mp3',
              popularity: 90,
              explicit: false
            }
          ],
          total: 1
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSpotifyResponse)
      } as Response);

      const results = await spotifyClient.searchTracks('bohemian rhapsody');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'spotify-123',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        year: 1975,
        source: 'spotify',
        spotifyId: 'spotify-123',
        previewUrl: 'http://example.com/preview.mp3',
        popularity: 90,
        albumArtUrl: 'http://example.com/album.jpg',
        explicit: false,
        youtubeSearchUrl: 'https://www.youtube.com/results?search_query=Bohemian%20Rhapsody%20Queen%20official'
      });
    });

    it('should return empty array when API fails', async () => {
      // Mock auth failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const results = await spotifyClient.searchTracks('test query');

      expect(results).toEqual([]);
    });

    it('should handle authentication automatically', async () => {
      // Mock successful auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'valid-token',
          token_type: 'Bearer',
          expires_in: 3600
        })
      } as Response);

      // Mock search response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } })
      } as Response);

      await spotifyClient.searchTracks('test');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, 'https://accounts.spotify.com/api/token', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Basic dGVzdC1jbGllbnQtaWQ6dGVzdC1jbGllbnQtc2VjcmV0'
        })
      }));
    });

    it('should respect rate limiting', async () => {
      vi.useFakeTimers();

      // Mock auth
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          expires_in: 3600
        })
      } as Response);

      // Mock search responses
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } })
      } as Response);

      const promise1 = spotifyClient.searchTracks('query1');
      const promise2 = spotifyClient.searchTracks('query2');

      // Fast-forward time
      vi.advanceTimersByTime(200);
      await Promise.all([promise1, promise2]);

      expect(fetch).toHaveBeenCalledTimes(4); // 2 auth + 2 search

      vi.useRealTimers();
    });

    it('should transform Spotify response to Song format', async () => {
      // Mock auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          expires_in: 3600
        })
      } as Response);

      // Mock search with minimal data
      const mockResponse = {
        tracks: {
          items: [
            {
              id: 'test-id',
              name: 'Test Song',
              artists: [{ id: 'artist-id', name: 'Test Artist' }],
              album: {
                id: 'album-id',
                name: 'Test Album',
                release_date: '1977-06-01',
                images: []
              },
              preview_url: null,
              popularity: 50,
              explicit: true
            }
          ]
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const results = await spotifyClient.searchTracks('test');

      expect(results[0]).toEqual({
        id: 'test-id',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 1977,
        source: 'spotify',
        spotifyId: 'test-id',
        previewUrl: null,
        popularity: 50,
        albumArtUrl: null,
        explicit: true,
        youtubeSearchUrl: 'https://www.youtube.com/results?search_query=Test%20Song%20Test%20Artist%20official'
      });
    });
  });

  describe('authentication', () => {
    it('should get access token using client credentials', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'test-token',
          token_type: 'Bearer',
          expires_in: 3600
        })
      } as Response);

      // Trigger auth by making a search
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } })
      } as Response);

      await spotifyClient.searchTracks('test');

      expect(fetch).toHaveBeenNthCalledWith(1, 'https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic dGVzdC1jbGllbnQtaWQ6dGVzdC1jbGllbnQtc2VjcmV0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
    });

    it('should cache tokens until expiry', async () => {
      // Mock auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'cached-token',
          expires_in: 3600
        })
      } as Response);

      // Mock multiple searches
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } })
      } as Response);

      await spotifyClient.searchTracks('test1');
      await spotifyClient.searchTracks('test2');

      // Should only authenticate once
      expect(fetch).toHaveBeenCalledTimes(3); // 1 auth + 2 searches
    });

    it('should refresh tokens automatically', async () => {
      // Create client with expired token scenario
      const client = new SpotifyClient('id', 'secret');

      // First call - get initial token
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'initial-token',
          expires_in: -1 // Expired immediately for testing
        })
      } as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } })
      } as Response);

      await client.searchTracks('test1');

      // Second call - should refresh token
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'refreshed-token',
          expires_in: 3600
        })
      } as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } })
      } as Response);

      await client.searchTracks('test2');

      expect(fetch).toHaveBeenCalledTimes(4); // 2 auth + 2 search
    });

    it('should handle invalid credentials gracefully', async () => {
      const client = new SpotifyClient('', '');

      const results = await client.searchTracks('test');

      expect(results).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should handle 429 rate limiting with retry', async () => {
      // Mock auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'token',
          expires_in: 3600
        })
      } as Response);

      // Mock rate limit then success
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          status: 429,
          headers: { get: () => '1' }
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tracks: { items: [] } })
        } as Response);

      const results = await spotifyClient.searchTracks('test');

      expect(results).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(3); // auth + rate limited + retry
    });
  });
});