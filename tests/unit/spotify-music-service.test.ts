import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SpotifyMusicService } from '../../src/lib/spotifyMusicService.js';
import { SpotifyClient } from '../../src/lib/spotify/client.js';
import type { Song } from '../../src/lib/spotify/client.js';

vi.mock('../../src/lib/spotify/client.js');

describe('SpotifyMusicService', () => {
  let spotifyMusicService: SpotifyMusicService;
  let mockSpotifyClient: any;

  beforeEach(() => {
    mockSpotifyClient = {
      searchTracks: vi.fn()
    };

    vi.mocked(SpotifyClient).mockImplementation(() => mockSpotifyClient);
    spotifyMusicService = new SpotifyMusicService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    spotifyMusicService.clearCache();
    vi.restoreAllMocks();
  });

  describe('searchMusic', () => {
    it('should return Spotify results for valid query', async () => {
      const mockSongs: Song[] = [
        {
          id: 'spotify-123',
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          year: 1975,
          source: 'spotify',
          spotifyId: 'spotify-123',
          previewUrl: 'https://example.com/preview.mp3',
          albumArtUrl: 'https://example.com/album.jpg',
          popularity: 90,
          explicit: false
        }
      ];

      mockSpotifyClient.searchTracks.mockResolvedValue(mockSongs);

      const result = await spotifyMusicService.searchMusic('queen');

      expect(result).toEqual({
        success: true,
        songs: mockSongs,
        source: 'spotify',
        totalFound: 1,
        cached: false
      });

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith('queen', 15);
    });

    it('should pass the query through without decade scoping', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      await spotifyMusicService.searchMusic('test query');

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith('test query', 15);
    });

    it('should respect maxResults parameter', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      await spotifyMusicService.searchMusic('queen', 5);

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith('queen', 5);
    });

    it('should return cached results when available', async () => {
      const mockSongs: Song[] = [
        {
          id: 'cached-123',
          title: 'Cached Song',
          artist: 'Cached Artist',
          year: 1975,
          source: 'spotify',
          spotifyId: 'cached-123'
        }
      ];

      mockSpotifyClient.searchTracks.mockResolvedValue(mockSongs);

      // First call - should cache
      await spotifyMusicService.searchMusic('queen');

      // Second call - should use cache
      const result = await spotifyMusicService.searchMusic('queen');

      expect(result.cached).toBe(true);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledTimes(1);
    });

    it('should handle empty query gracefully', async () => {
      const result = await spotifyMusicService.searchMusic('');

      expect(result).toEqual({
        success: false,
        songs: [],
        source: 'error',
        totalFound: 0,
        error: 'Search query is required',
        cached: false
      });

      expect(mockSpotifyClient.searchTracks).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only query gracefully', async () => {
      const result = await spotifyMusicService.searchMusic('   ');

      expect(result).toEqual({
        success: false,
        songs: [],
        source: 'error',
        totalFound: 0,
        error: 'Search query is required',
        cached: false
      });

      expect(mockSpotifyClient.searchTracks).not.toHaveBeenCalled();
    });

    it('should handle Spotify client errors gracefully', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Spotify API error'));

      const result = await spotifyMusicService.searchMusic('queen');

      expect(result).toEqual({
        success: false,
        songs: [],
        source: 'error',
        totalFound: 0,
        error: 'Music search temporarily unavailable',
        cached: false
      });
    });

    it('should handle Spotify client returning empty array', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      const result = await spotifyMusicService.searchMusic('unknown song');

      expect(result).toEqual({
        success: true,
        songs: [],
        source: 'spotify',
        totalFound: 0,
        cached: false
      });
    });

    it('should return songs from any decade unfiltered', async () => {
      const mockSongs: Song[] = [
        {
          id: 'song-1',
          title: '70s Song',
          artist: 'Artist',
          year: 1975,
          source: 'spotify',
          spotifyId: 'song-1'
        },
        {
          id: 'song-2',
          title: '80s Song',
          artist: 'Artist',
          year: 1985,
          source: 'spotify',
          spotifyId: 'song-2'
        }
      ];

      mockSpotifyClient.searchTracks.mockResolvedValue(mockSongs);

      const result = await spotifyMusicService.searchMusic('artist');

      expect(result.songs).toHaveLength(2);
      expect(result.songs.map(s => s.year)).toEqual([1975, 1985]);
      expect(result.totalFound).toBe(2);
    });

    it('should use different cache keys for different queries', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      await spotifyMusicService.searchMusic('queen');
      await spotifyMusicService.searchMusic('beatles');

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledTimes(2);
    });

    it('should use different cache keys for different maxResults', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      await spotifyMusicService.searchMusic('queen', 10);
      await spotifyMusicService.searchMusic('queen', 20);

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('should clear cached results', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([
        {
          id: 'test-song',
          title: 'Test Song',
          artist: 'Test Artist',
          year: 1975,
          source: 'spotify',
          spotifyId: 'test-song'
        }
      ]);

      // First call - should cache
      await spotifyMusicService.searchMusic('test');

      // Clear cache
      spotifyMusicService.clearCache();

      // Second call - should not use cache
      await spotifyMusicService.searchMusic('test');

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache expiration', () => {
    it('should expire cached results after timeout', async () => {
      const service = new SpotifyMusicService('test-client-id', 'test-client-secret', { cacheTimeout: 100 });

      mockSpotifyClient.searchTracks.mockResolvedValue([
        {
          id: 'test-song',
          title: 'Test Song',
          artist: 'Test Artist',
          year: 1975,
          source: 'spotify',
          spotifyId: 'test-song'
        }
      ]);

      // First call - should cache
      await service.searchMusic('test');

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call - should not use expired cache
      await service.searchMusic('test');

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledTimes(2);
    });
  });

  describe('error scenarios', () => {
    it('should handle network timeouts', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Network timeout'));

      const result = await spotifyMusicService.searchMusic('queen');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Music search temporarily unavailable');
    });

    it('should handle authentication errors', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Authentication failed'));

      const result = await spotifyMusicService.searchMusic('queen');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Music search temporarily unavailable');
    });

    it('should handle rate limiting errors', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Rate limited'));

      const result = await spotifyMusicService.searchMusic('queen');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Music search temporarily unavailable');
    });
  });
});