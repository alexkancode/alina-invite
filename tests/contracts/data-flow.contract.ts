import { describe, it, expect, vi } from 'vitest';
import { musicSearchService } from '../../src/lib/musicSearchService.js';
import { InterfaceValidator } from '../reflection/interface-validator.js';

describe('Data Flow Contract Tests', () => {
  describe('MusicSearchService Contract Validation', () => {
    it('should always return valid SearchResult objects', async () => {
      const testQueries = ['bohemian', 'test', 'queen', ''];

      for (const query of testQueries) {
        const result = await musicSearchService.search70sSongs(query, {
          includeFallback: true,
          includeSpotify: false // Use original functionality
        });

        // Contract: result must always be valid SearchResult
        expect(InterfaceValidator.validateSearchResult(result)).toBe(true);

        // Contract: all songs must be valid Song objects
        result.songs.forEach(song => {
          expect(InterfaceValidator.validateSongObject(song)).toBe(true);
        });
      }
    });

    it('should maintain backwards compatibility', async () => {
      const result = await musicSearchService.search70sSongs('bohemian', {
        includeFallback: true,
        includeSpotify: false
      });

      // Contract: original interface fields must be present
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('songs');
      expect(result).toHaveProperty('source');
      expect(Array.isArray(result.songs)).toBe(true);

      if (result.songs.length > 0) {
        const song = result.songs[0];
        expect(song).toHaveProperty('id');
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('artist');
        expect(song).toHaveProperty('source');
      }
    });

    it('should maintain enhanced interface contracts when Spotify enabled', async () => {
      const result = await musicSearchService.search70sSongs('bohemian', {
        includeFallback: true,
        includeSpotify: true,
        spotifyPrimary: false
      });

      // Contract: enhanced fields should be available
      expect(result).toHaveProperty('sourcesUsed');
      expect(result).toHaveProperty('searchStrategy');

      if (result.sourcesUsed) {
        expect(Array.isArray(result.sourcesUsed)).toBe(true);
        const validSources = ['musicbrainz', 'curated', 'spotify'];
        result.sourcesUsed.forEach(source => {
          expect(validSources).toContain(source);
        });
      }

      if (result.searchStrategy) {
        const validStrategies = ['spotify-primary', 'musicbrainz-primary', 'fallback-only'];
        expect(validStrategies).toContain(result.searchStrategy);
      }
    });

    it('should validate source attribution contracts', async () => {
      const result = await musicSearchService.search70sSongs('bohemian', {
        includeFallback: true,
        includeSpotify: false
      });

      // Contract: source attribution must be consistent
      if (result.songs.length > 0) {
        result.songs.forEach(song => {
          const validSources = ['musicbrainz', 'curated', 'spotify'];
          expect(validSources).toContain(song.source);
        });

        // Contract: sourcesUsed should reflect actual song sources
        if (result.sourcesUsed) {
          const actualSources = [...new Set(result.songs.map(song => song.source))];
          actualSources.forEach(source => {
            expect(result.sourcesUsed).toContain(source);
          });
        }
      }
    });

    it('should maintain error handling contracts', async () => {
      // Test various error scenarios
      const errorQueries = ['', '   ', 'nonexistent12345'];

      for (const query of errorQueries) {
        const result = await musicSearchService.search70sSongs(query, {
          includeFallback: true
        });

        // Contract: should never throw, always return valid structure
        expect(InterfaceValidator.validateSearchResult(result)).toBe(true);
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.songs)).toBe(true);
      }
    });

    it('should validate maxResults contract', async () => {
      const limits = [1, 5, 10, 20];

      for (const limit of limits) {
        const result = await musicSearchService.search70sSongs('bohemian', {
          maxResults: limit,
          includeFallback: true
        });

        // Contract: should never exceed maxResults
        expect(result.songs.length).toBeLessThanOrEqual(limit);
      }
    });

    it('should maintain performance contracts', async () => {
      const startTime = Date.now();
      const result = await musicSearchService.search70sSongs('bohemian', {
        includeFallback: true
      });
      const duration = Date.now() - startTime;

      // Contract: should complete in reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max for tests

      // Contract: should return valid result regardless of timing
      expect(InterfaceValidator.validateSearchResult(result)).toBe(true);
    });
  });

  describe('Interface Contract Validation', () => {
    it('should validate Song interface contracts', () => {
      // Test minimal Song object
      const minimalSong = {
        id: 'test',
        title: 'Test Song',
        artist: 'Test Artist',
        source: 'curated'
      };

      expect(InterfaceValidator.validateSongObject(minimalSong)).toBe(true);

      // Test enhanced Song object
      const enhancedSong = {
        ...minimalSong,
        year: 1975,
        spotifyId: 'spotify123',
        previewUrl: 'http://preview.mp3',
        popularity: 85,
        albumArtUrl: 'http://album.jpg',
        explicit: false
      };

      expect(InterfaceValidator.validateSongObject(enhancedSong)).toBe(true);
    });

    it('should validate SearchResult interface contracts', () => {
      // Test minimal SearchResult
      const minimalResult = {
        success: true,
        songs: [],
        source: 'api'
      };

      expect(InterfaceValidator.validateSearchResult(minimalResult)).toBe(true);

      // Test enhanced SearchResult
      const enhancedResult = {
        ...minimalResult,
        totalFound: 0,
        sourcesUsed: ['curated'],
        searchStrategy: 'fallback-only'
      };

      expect(InterfaceValidator.validateSearchResult(enhancedResult)).toBe(true);
    });

    it('should reject invalid Song objects', () => {
      const invalidSongs = [
        null,
        undefined,
        {},
        { id: 'test' }, // missing required fields
        { id: 'test', title: 'Test', artist: 'Test', source: 'invalid' }, // invalid source
        { id: 123, title: 'Test', artist: 'Test', source: 'curated' }, // wrong type
      ];

      invalidSongs.forEach(invalidSong => {
        expect(InterfaceValidator.validateSongObject(invalidSong)).toBe(false);
      });
    });

    it('should reject invalid SearchResult objects', () => {
      const invalidResults = [
        null,
        undefined,
        {},
        { success: true }, // missing required fields
        { success: true, songs: 'not-array', source: 'api' }, // wrong type
        { success: true, songs: [], source: 'invalid' }, // invalid source
      ];

      invalidResults.forEach(invalidResult => {
        expect(InterfaceValidator.validateSearchResult(invalidResult)).toBe(false);
      });
    });
  });
});