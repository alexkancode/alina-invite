import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotifyClient } from '../../src/lib/spotify/client.js';
import { InterfaceValidator } from '../reflection/interface-validator.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('SpotifyClient Contract Tests', () => {
  let spotifyClient: SpotifyClient;

  beforeEach(() => {
    spotifyClient = new SpotifyClient('test-id', 'test-secret');
    vi.clearAllMocks();
  });

  describe('Data Contract Validation', () => {
    it('should return valid Song objects', async () => {
      // Mock successful Spotify response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'test-token',
            expires_in: 3600
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tracks: {
              items: [{
                id: 'test-id',
                name: 'Test Song',
                artists: [{ name: 'Test Artist' }],
                album: {
                  name: 'Test Album',
                  release_date: '1975-01-01',
                  images: [{ url: 'http://test.jpg' }]
                },
                preview_url: 'http://preview.mp3',
                popularity: 75,
                explicit: false
              }]
            }
          })
        } as Response);

      const results = await spotifyClient.searchTracks('test');

      // Contract validation: all results must be valid Song objects
      expect(results).toHaveLength(1);
      results.forEach(song => {
        expect(InterfaceValidator.validateSongObject(song)).toBe(true);
      });
    });

    it('should maintain contract on error scenarios', async () => {
      // Mock API failure
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const results = await spotifyClient.searchTracks('test');

      // Contract: must always return valid array, never throw
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should maintain consistent object signatures', async () => {
      // Mock two different successful responses
      const mockResponse1 = {
        tracks: {
          items: [{
            id: '1', name: 'Song 1', artists: [{ name: 'Artist 1' }],
            album: { name: 'Album 1', release_date: '1975-01-01', images: [] },
            preview_url: 'http://preview1.mp3', popularity: 75, explicit: false
          }]
        }
      };

      const mockResponse2 = {
        tracks: {
          items: [{
            id: '2', name: 'Song 2', artists: [{ name: 'Artist 2' }],
            album: { name: 'Album 2', release_date: '1976-01-01', images: [] },
            preview_url: null, popularity: 50, explicit: true
          }]
        }
      };

      vi.clearAllMocks();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1)
        } as Response);

      const results1 = await spotifyClient.searchTracks('test1');

      vi.clearAllMocks();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2)
        } as Response);

      const results2 = await spotifyClient.searchTracks('test2');

      // Contract: both results should have data
      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);

      // Contract: object signatures should be consistent (same set of keys)
      const sig1 = InterfaceValidator.getObjectSignature(results1[0]);
      const sig2 = InterfaceValidator.getObjectSignature(results2[0]);

      expect(sig1).toBe(sig2);
    });

    it('should maintain Spotify-specific field contracts', async () => {
      vi.clearAllMocks();
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tracks: {
              items: [{
                id: 'spotify-id',
                name: 'Spotify Song',
                artists: [{ name: 'Spotify Artist' }],
                album: {
                  name: 'Spotify Album',
                  release_date: '1975-06-01',
                  images: [{ url: 'http://spotify.art' }]
                },
                preview_url: 'http://spotify.preview',
                popularity: 90,
                explicit: true
              }]
            }
          })
        } as Response);

      const results = await spotifyClient.searchTracks('test');

      // Contract: should return results
      expect(results).toHaveLength(1);

      const song = results[0];

      // Contract: Spotify results must have enhanced metadata
      expect(song.source).toBe('spotify');
      expect(song.spotifyId).toBeDefined();
      expect(song.previewUrl).toBeDefined();
      expect(song.popularity).toBeTypeOf('number');
      expect(song.albumArtUrl).toBeDefined();
      expect(song.explicit).toBeTypeOf('boolean');
    });
  });

  describe('Performance Contract', () => {
    it('should complete searches within reasonable time', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tracks: { items: [] } })
        } as Response);

      const startTime = Date.now();
      await spotifyClient.searchTracks('test');
      const duration = Date.now() - startTime;

      // Contract: searches should complete in reasonable time (< 5 seconds for tests)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle timeouts gracefully', async () => {
      // Mock a slow response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 })
        } as Response)
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 10000))); // 10s delay

      const startTime = Date.now();
      const results = await spotifyClient.searchTracks('test');
      const duration = Date.now() - startTime;

      // Contract: should timeout and return empty results, not hang indefinitely
      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeLessThan(12000); // Should timeout around 8s + margin
    });
  });

  describe('Error Handling Contract', () => {
    it('should never throw errors to caller', async () => {
      const errorScenarios = [
        () => vi.mocked(fetch).mockRejectedValue(new Error('Network error')),
        () => vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response),
        () => vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.reject('Invalid JSON') } as Response)
      ];

      for (const setupError of errorScenarios) {
        vi.clearAllMocks();
        setupError();

        // Contract: should never throw, always return empty array
        const results = await spotifyClient.searchTracks('test');
        expect(Array.isArray(results)).toBe(true);
        expect(results).toHaveLength(0);
      }
    }, 15000); // Increase timeout for this test
  });
});