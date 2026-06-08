import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { SpotifyMusicService } from '../../src/lib/spotifyMusicService.js';
import { SpotifyClient } from '../../src/lib/spotify/client.js';

describe('Spotify Authentication Integration', () => {
  let service: SpotifyMusicService;
  let client: SpotifyClient;

  beforeAll(() => {
    // Use environment variables for integration testing
    service = new SpotifyMusicService();
    client = new SpotifyClient(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET
    );
  });

  describe('Real Spotify API Authentication', () => {
    test('should authenticate with real Spotify API', async () => {
      // Skip if no credentials provided
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping real API test - no credentials provided');
        return;
      }

      const result = await service.searchMusic('queen', 1);

      expect(result.success).toBe(true);
      expect(result.source).toBe('spotify');
      expect(result.songs.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();

      // Verify enhanced metadata
      const song = result.songs[0];
      expect(song).toHaveProperty('spotifyId');
      expect(song).toHaveProperty('albumArtUrl');
      expect(song.source).toBe('spotify');
    }, 15000);

    test('should handle 70s music filtering', async () => {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping 70s filtering test - no credentials provided');
        return;
      }

      const result = await service.searchMusic('dancing queen', 5);

      expect(result.success).toBe(true);

      // All results should be from the 70s
      result.songs.forEach(song => {
        expect(song.year).toBeGreaterThanOrEqual(1970);
        expect(song.year).toBeLessThanOrEqual(1979);
      });
    }, 15000);

    test('should handle empty results gracefully', async () => {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping empty results test - no credentials provided');
        return;
      }

      const result = await service.searchMusic('xyzqwerty12345nonexistent', 5);

      expect(result.success).toBe(true);
      expect(result.songs).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    }, 15000);
  });

  describe('Authentication Failure Scenarios', () => {
    test('should handle invalid credentials gracefully', async () => {
      const invalidService = new SpotifyMusicService('invalid_id', 'invalid_secret');
      const result = await invalidService.searchMusic('test', 1);

      expect(result.success).toBe(false);
      expect(result.songs).toHaveLength(0);
      expect(result.source).toBe('error');
      expect(result.error).toBe('Music search temporarily unavailable');
    });

    test('should handle missing credentials gracefully', async () => {
      const noCredsService = new SpotifyMusicService('', '');
      const result = await noCredsService.searchMusic('test', 1);

      expect(result.success).toBe(false);
      expect(result.songs).toHaveLength(0);
      expect(result.source).toBe('error');
    });
  });

  describe('Caching Behavior', () => {
    test('should cache results for repeated queries', async () => {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping cache test - no credentials provided');
        return;
      }

      // First request
      const startTime1 = Date.now();
      const result1 = await service.searchMusic('bohemian rhapsody', 1);
      const endTime1 = Date.now();

      expect(result1.success).toBe(true);
      expect(result1.cached).toBe(false);

      // Second identical request - should be cached
      const startTime2 = Date.now();
      const result2 = await service.searchMusic('bohemian rhapsody', 1);
      const endTime2 = Date.now();

      expect(result2.success).toBe(true);
      expect(result2.cached).toBe(true);

      // Cached request should be much faster
      const firstRequestTime = endTime1 - startTime1;
      const secondRequestTime = endTime2 - startTime2;
      expect(secondRequestTime).toBeLessThan(firstRequestTime / 2);
    }, 20000);

    test('should clear cache when requested', async () => {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping cache clear test - no credentials provided');
        return;
      }

      // Make a request to populate cache
      const result1 = await service.searchMusic('test cache', 1);
      expect(result1.cached).toBe(false);

      // Make same request - should be cached
      const result2 = await service.searchMusic('test cache', 1);
      expect(result2.cached).toBe(true);

      // Clear cache
      service.clearCache();

      // Make same request again - should not be cached
      const result3 = await service.searchMusic('test cache', 1);
      expect(result3.cached).toBe(false);
    }, 20000);
  });

  describe('Performance Validation', () => {
    test('should complete search within acceptable time', async () => {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping performance test - no credentials provided');
        return;
      }

      const startTime = Date.now();
      const result = await service.searchMusic('test performance', 5);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(result.success).toBe(true);
      // Target: sub-500ms response time (allowing for network latency in testing)
      expect(responseTime).toBeLessThan(2000);
    }, 10000);
  });

  describe('Production Environment Simulation', () => {
    test('should work with production-like environment variables', async () => {
      // Test environment variable access patterns used in production
      const prodService = new SpotifyMusicService(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET
      );

      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        console.log('Skipping production simulation - no credentials provided');
        return;
      }

      const result = await prodService.searchMusic('production test', 1);

      expect(result.success).toBe(true);
      expect(result.source).toBe('spotify');
    }, 15000);
  });
});