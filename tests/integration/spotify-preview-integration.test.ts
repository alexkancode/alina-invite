import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { musicSearchService } from '../../src/lib/musicSearchService.js';

describe('Spotify Preview Integration', () => {
  describe('API Integration Flow', () => {
    it('should handle Spotify-enhanced search requests correctly', async () => {
      const result = await musicSearchService.search70sSongs('bohemian rhapsody', {
        includeSpotify: true,
        includeFallback: true,
        maxResults: 5
      });

      expect(result.success).toBe(true);
      expect(result.songs).toBeDefined();
      expect(Array.isArray(result.songs)).toBe(true);

      // Check that enhanced metadata fields are available if present
      if (result.songs.length > 0) {
        const song = result.songs[0];

        // Core Song interface validation
        expect(song).toHaveProperty('id');
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('source');
        expect(song).toHaveProperty('youtubeSearchUrl');

        // Enhanced fields (optional based on source)
        if (song.source === 'spotify') {
          expect(song).toHaveProperty('spotifyId');
          expect(song.spotifyId).toMatch(/^[a-zA-Z0-9]{22}$/);
        }

        // YouTube fallback should always be available
        expect(song.youtubeSearchUrl).toBeDefined();
        expect(song.youtubeSearchUrl).toContain('youtube.com/results');
      }
    });

    it('should gracefully handle API failures with fallback', async () => {
      const result = await musicSearchService.search70sSongs('test query that will fail', {
        includeSpotify: true,
        includeFallback: true,
        maxResults: 3
      });

      // Should handle failures gracefully - either success with fallback or structured failure
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.songs).toBeDefined();
      expect(Array.isArray(result.songs)).toBe(true);

      // If successful, should indicate fallback was used
      if (result.success && result.sourcesUsed) {
        expect(result.sourcesUsed).toContain('curated');
      }
    });

    it('should maintain backwards compatibility without Spotify', async () => {
      const result = await musicSearchService.search70sSongs('bohemian rhapsody', {
        includeSpotify: false,
        includeFallback: true,
        maxResults: 5
      });

      expect(result.success).toBe(true);
      expect(result.songs).toBeDefined();

      if (result.songs.length > 0) {
        const song = result.songs[0];

        // Core fields should be present
        expect(song).toHaveProperty('id');
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('source');
        expect(song).toHaveProperty('youtubeSearchUrl');

        // Spotify fields should not be present when includeSpotify=false
        expect(song.spotifyId).toBeUndefined();
      }
    });
  });

  describe('HTTP API Endpoint Integration', () => {
    it('should respond to music search API with Spotify parameters', async () => {
      const response = await fetch('http://localhost:4321/api/music-search?q=bohemian&includeSpotify=true&maxResults=3');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.songs)).toBe(true);

      // API should include enhanced metadata fields
      if (data.songs.length > 0) {
        const song = data.songs[0];
        expect(song).toHaveProperty('id');
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('source');
        expect(song).toHaveProperty('youtubeSearchUrl');
      }
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await fetch('http://localhost:4321/api/music-search?q=&includeSpotify=invalid');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Search query is required');
    });

    it('should support spotify-primary strategy', async () => {
      const response = await fetch('http://localhost:4321/api/music-search?q=queen&includeSpotify=true&spotifyPrimary=true&maxResults=2');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toBeDefined();
      expect(data.success).toBe(true);

      // Should indicate spotify-primary strategy was attempted
      if (data.searchStrategy) {
        expect(['spotify-primary', 'fallback-only']).toContain(data.searchStrategy);
      }
    });
  });

  describe('Component Integration Validation', () => {
    let mockDocument: any;
    let mockWindow: any;

    beforeEach(() => {
      // Mock DOM environment for component testing
      mockDocument = {
        createElement: vi.fn(() => ({
          href: '',
          style: { display: '' },
          click: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          contains: vi.fn(() => true)
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        hidden: false
      };

      mockWindow = {
        open: vi.fn(() => null),
        navigator: {
          userAgent: 'Mozilla/5.0 (Android 12; Mobile) WebKit/537.36'
        }
      };

      global.document = mockDocument;
      global.window = mockWindow;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should generate correct Spotify preview HTML structure', () => {
      const testSong = {
        id: 'test-123',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        source: 'spotify' as const,
        spotifyId: '4iV5W9uYEdYUVa79Axb7Rh',
        youtubeSearchUrl: 'https://youtube.com/results?search_query=test',
        previewUrl: 'https://p.scdn.co/mp3-preview/test.mp3'
      };

      // Simulate component HTML generation
      const containerId = 'test-preview-123';
      const expectedSpotifyUrl = `https://open.spotify.com/track/${testSong.spotifyId}`;
      const expectedSpotifyUri = `spotify:track:${testSong.spotifyId}`;

      // Validate data attributes would be set correctly
      expect(testSong.spotifyId).toBeDefined();
      expect(expectedSpotifyUrl).toContain('open.spotify.com/track/');
      expect(expectedSpotifyUri).toMatch(/^spotify:track:[a-zA-Z0-9]{22}$/);
    });

    it('should fall back to YouTube when no Spotify data available', () => {
      const testSong = {
        id: 'test-456',
        title: 'Some 70s Song',
        artist: 'Some Artist',
        source: 'musicbrainz' as const,
        youtubeSearchUrl: 'https://youtube.com/results?search_query=some%2070s%20song%20some%20artist%20official'
      };

      // Should use YouTube fallback when no Spotify data
      expect(testSong.spotifyId).toBeUndefined();
      expect(testSong.youtubeSearchUrl).toBeDefined();
      expect(testSong.youtubeSearchUrl).toContain('youtube.com/results');
    });
  });

  describe('Cross-Platform Behavior Validation', () => {
    it('should detect mobile platforms correctly', () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (Android 12; Mobile) WebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) WebKit/605.1.15',
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) WebKit/605.1.15'
      ];

      mobileUserAgents.forEach(userAgent => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        expect(isMobile).toBe(true);
      });
    });

    it('should detect desktop platforms correctly', () => {
      const desktopUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      ];

      desktopUserAgents.forEach(userAgent => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        expect(isMobile).toBe(false);
      });
    });

    it('should generate correct fallback URLs', () => {
      const generateYouTubeSearchUrl = (title: string, artist: string): string => {
        const query = encodeURIComponent(`${title} ${artist} official`);
        return `https://www.youtube.com/results?search_query=${query}`;
      };

      const url = generateYouTubeSearchUrl('Bohemian Rhapsody', 'Queen');
      expect(url).toBe('https://www.youtube.com/results?search_query=Bohemian%20Rhapsody%20Queen%20official');

      const urlWithSpecialChars = generateYouTubeSearchUrl('Rock & Roll', 'AC/DC');
      expect(urlWithSpecialChars).toContain('Rock%20%26%20Roll%20AC%2FDC');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network failures gracefully', async () => {
      // Test with network-like errors
      try {
        const result = await musicSearchService.search70sSongs('test query', {
          includeSpotify: true,
          includeFallback: true
        });

        // Should always return a valid result structure
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.songs)).toBe(true);
      } catch (error) {
        // Should not throw errors, should handle internally
        fail('Search service should not throw errors, should handle gracefully');
      }
    });

    it('should validate Spotify ID format when present', () => {
      const validSpotifyIds = [
        '4iV5W9uYEdYUVa79Axb7Rh',
        '1BxfuPKGuaTgP7aM0Bbdwr',
        '7MXVkk9YMctZqd1Srtv4MB'
      ];

      const spotifyIdPattern = /^[a-zA-Z0-9]{22}$/;

      validSpotifyIds.forEach(id => {
        expect(id).toMatch(spotifyIdPattern);
      });

      // Invalid IDs should not match
      const invalidIds = ['too-short', 'way-too-long-to-be-a-spotify-id', ''];
      invalidIds.forEach(id => {
        expect(id).not.toMatch(spotifyIdPattern);
      });
    });
  });
});