import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MusicSearchService, type Song, type SearchResult } from '../../src/lib/musicSearchService.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('MusicSearchService', () => {
  let musicService: MusicSearchService;

  beforeEach(() => {
    musicService = new MusicSearchService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('search70sSongs', () => {

    it('should return songs from MusicBrainz API', async () => {
      // Arrange: Mock successful API response
      const mockMBResponse = {
        recordings: [
          {
            id: '1234-5678',
            title: 'Bohemian Rhapsody',
            'artist-credit': [{ artist: { name: 'Queen' } }],
            'first-release-date': '1975-10-31'
          },
          {
            id: '2345-6789',
            title: 'Stairway to Heaven',
            'artist-credit': [{ artist: { name: 'Led Zeppelin' } }],
            'first-release-date': '1971-11-08'
          }
        ]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMBResponse)
      } as Response);

      // Act
      const results = await musicService.search70sSongs('bohemian');

      // Assert
      expect(results.success).toBe(true);
      expect(results.songs).toHaveLength(2);
      expect(results.songs[0]).toEqual({
        id: '1234-5678',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        year: 1975,
        source: 'musicbrainz',
        musicbrainzId: '1234-5678',
        youtubeSearchUrl: 'https://www.youtube.com/results?search_query=Bohemian%20Rhapsody%20Queen%20official'
      });
      expect(results.songs[1]).toEqual({
        id: '2345-6789',
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        year: 1971,
        source: 'musicbrainz',
        musicbrainzId: '2345-6789',
        youtubeSearchUrl: 'https://www.youtube.com/results?search_query=Stairway%20to%20Heaven%20Led%20Zeppelin%20official'
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange: Mock API failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      // Act
      const results = await musicService.search70sSongs('test');

      // Assert
      expect(results.success).toBe(false);
      expect(results.error).toBe('Failed to search MusicBrainz API');
      expect(results.songs).toHaveLength(0);
    });

    it('should fall back to curated songs when API fails', async () => {
      // Arrange: Mock API failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      // Act
      const results = await musicService.search70sSongs('bohemian', { includeFallback: true });

      // Assert
      expect(results.success).toBe(true);
      expect(results.songs.length).toBeGreaterThan(0);
      expect(results.songs.some(song => song.source === 'curated')).toBe(true);
    });

    it('should filter songs to 70s decade only', async () => {
      // Arrange: Mock response with mixed decades
      const mockMBResponse = {
        recordings: [
          {
            id: '1',
            title: '70s Song',
            'artist-credit': [{ artist: { name: 'Artist 1' } }],
            'first-release-date': '1975-01-01'
          },
          {
            id: '2',
            title: '80s Song',
            'artist-credit': [{ artist: { name: 'Artist 2' } }],
            'first-release-date': '1985-01-01'
          },
          {
            id: '3',
            title: 'No Date Song',
            'artist-credit': [{ artist: { name: 'Artist 3' } }]
          }
        ]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMBResponse)
      } as Response);

      // Act
      const results = await musicService.search70sSongs('test');

      // Assert: Should include 70s song and no-date song, but filter out 80s song
      expect(results.songs).toHaveLength(2);
      expect(results.songs.find(s => s.title === '70s Song')).toBeDefined();
      expect(results.songs.find(s => s.title === 'No Date Song')).toBeDefined();
      expect(results.songs.find(s => s.title === '80s Song')).toBeUndefined();
    });

    it('should respect rate limiting', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ recordings: [] })
      } as Response);

      // Act: Make multiple requests quickly
      const promise1 = musicService.search70sSongs('query1');
      const promise2 = musicService.search70sSongs('query2');

      // Fast-forward time to trigger rate limiting
      vi.advanceTimersByTime(1500);

      await Promise.all([promise1, promise2]);

      // Assert: Should have made requests with proper delays
      expect(fetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should cache repeated searches', async () => {
      // Arrange
      const mockResponse = {
        recordings: [{
          id: '1',
          title: 'Cached Song',
          'artist-credit': [{ artist: { name: 'Cached Artist' } }],
          'first-release-date': '1975-01-01'
        }]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      // Act: Search twice with same query
      const results1 = await musicService.search70sSongs('cached');
      const results2 = await musicService.search70sSongs('cached');

      // Assert: Should only make one API call due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(results1.songs).toEqual(results2.songs);
      expect(results1.source).toBe('api');
      expect(results2.source).toBe('cache');
    });

    it('should generate YouTube preview URLs', async () => {
      // Arrange
      const mockResponse = {
        recordings: [{
          id: '1',
          title: 'Hotel California',
          'artist-credit': [{ artist: { name: 'Eagles' } }],
          'first-release-date': '1976-12-08'
        }]
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      // Act
      const results = await musicService.search70sSongs('hotel california');

      // Assert
      expect(results.songs[0]).toHaveProperty('youtubeSearchUrl');
      expect(results.songs[0].youtubeSearchUrl).toContain('youtube.com');
      expect(results.songs[0].youtubeSearchUrl).toContain('Hotel%20California');
      expect(results.songs[0].youtubeSearchUrl).toContain('Eagles');
    });

  });

  describe('getCuratedSongs', () => {

    it('should return curated 70s songs', () => {
      // Act
      const songs = musicService.getCuratedSongs();

      // Assert
      expect(songs.length).toBeGreaterThan(0);
      expect(songs.every(song => song.year >= 1970 && song.year <= 1979)).toBe(true);
      expect(songs.every(song => song.source === 'curated')).toBe(true);
    });

    it('should include classic 70s hits', () => {
      // Act
      const songs = musicService.getCuratedSongs();

      // Assert
      const titles = songs.map(s => s.title);
      expect(titles).toContain('Bohemian Rhapsody');
      expect(titles).toContain('Stairway to Heaven');
      expect(titles).toContain('Hotel California');
    });

  });

  describe('searchSongs', () => {

    it('should search curated songs by title', () => {
      // Act
      const results = musicService.searchCuratedSongs('bohemian');

      // Assert
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title.toLowerCase()).toContain('bohemian');
    });

    it('should search curated songs by artist', () => {
      // Act
      const results = musicService.searchCuratedSongs('queen');

      // Assert
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].artist.toLowerCase()).toContain('queen');
    });

    it('should return empty array for no matches', () => {
      // Act
      const results = musicService.searchCuratedSongs('nonexistentsong');

      // Assert
      expect(results).toEqual([]);
    });

  });

  describe('formatSongDisplay', () => {

    it('should format song with year', () => {
      // Arrange
      const song: Song = {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 1975,
        source: 'curated'
      };

      // Act
      const formatted = musicService.formatSongDisplay(song);

      // Assert
      expect(formatted).toBe('Test Song - Test Artist (1975)');
    });

    it('should format song without year', () => {
      // Arrange
      const song: Song = {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
        year: undefined,
        source: 'curated'
      };

      // Act
      const formatted = musicService.formatSongDisplay(song);

      // Assert
      expect(formatted).toBe('Test Song - Test Artist');
    });

  });

});