import { describe, it, expect, vi } from 'vitest';
import { musicSearchService } from '../../src/lib/musicSearchService.js';
import { InterfaceValidator } from '../reflection/interface-validator.js';

// Property-based test utilities
function generateRandomQuery(): string {
  const words = ['test', 'song', 'music', 'band', 'artist', 'album', 'rock', 'pop', 'jazz'];
  const length = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
}

function generateSearchOptions() {
  return {
    includeSpotify: Math.random() > 0.5,
    spotifyPrimary: Math.random() > 0.5,
    maxResults: Math.floor(Math.random() * 20) + 1,
    includeFallback: Math.random() > 0.3
  };
}

function generateMalformedQuery(): string {
  const malformedInputs = [
    '', '   ', '\n\t', '🎵🎶🎵', 'a'.repeat(1000),
    'test\0null', 'test\x00\x01\x02', '  test  ',
    '\'DROP TABLE songs;--', '<script>alert("xss")</script>',
    '../../etc/passwd', 'null', 'undefined', 'NaN'
  ];
  return malformedInputs[Math.floor(Math.random() * malformedInputs.length)];
}

describe('Property-Based Search Tests', () => {
  describe('Search Invariants', () => {
    it('should never crash regardless of input', async () => {
      // Property: Search function should never throw
      const testCases = 50;

      for (let i = 0; i < testCases; i++) {
        const query = Math.random() > 0.7 ? generateMalformedQuery() : generateRandomQuery();
        const options = generateSearchOptions();

        // This should never throw
        const result = await musicSearchService.search70sSongs(query, options);

        // Basic invariants
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.songs)).toBe(true);
      }
    });

    it('should always return valid SearchResult objects', async () => {
      const testCases = 30;

      for (let i = 0; i < testCases; i++) {
        const query = generateRandomQuery();
        const options = generateSearchOptions();

        const result = await musicSearchService.search70sSongs(query, options);

        // Property: result must always be valid SearchResult
        expect(InterfaceValidator.validateSearchResult(result)).toBe(true);

        // Property: all songs must be valid Song objects
        result.songs.forEach(song => {
          expect(InterfaceValidator.validateSongObject(song)).toBe(true);
        });
      }
    });

    it('should respect maxResults property', async () => {
      const testCases = 15;

      for (let i = 0; i < testCases; i++) {
        const maxResults = Math.floor(Math.random() * 10) + 1;
        const result = await musicSearchService.search70sSongs('bohemian', {
          maxResults,
          includeFallback: true
        });

        // Property: result count should never exceed maxResults
        expect(result.songs.length).toBeLessThanOrEqual(maxResults);
      }
    });

    it('should maintain source attribution consistency', async () => {
      const testCases = 20;

      for (let i = 0; i < testCases; i++) {
        const query = generateRandomQuery();
        const options = generateSearchOptions();

        const result = await musicSearchService.search70sSongs(query, options);

        if (result.songs.length > 0) {
          // Property: all songs should have valid source attribution
          const sources = result.songs.map(song => song.source);
          const validSources = ['musicbrainz', 'curated', 'spotify'];

          sources.forEach(source => {
            expect(validSources).toContain(source);
          });

          // Property: sourcesUsed should reflect actual sources in songs
          if (result.sourcesUsed) {
            const uniqueSources = [...new Set(sources)];
            uniqueSources.forEach(source => {
              expect(result.sourcesUsed).toContain(source);
            });
          }
        }
      }
    });

    it('should maintain search strategy contract', async () => {
      const testCases = 25;

      for (let i = 0; i < testCases; i++) {
        const options = generateSearchOptions();
        const result = await musicSearchService.search70sSongs('test', options);

        if (result.searchStrategy) {
          const validStrategies = ['spotify-primary', 'musicbrainz-primary', 'fallback-only'];
          expect(validStrategies).toContain(result.searchStrategy);

          // Property: strategy should match the options provided
          if (options.spotifyPrimary && options.includeSpotify) {
            expect(result.searchStrategy).toBe('spotify-primary');
          } else if (!options.includeSpotify) {
            expect(['musicbrainz-primary', 'fallback-only']).toContain(result.searchStrategy);
          }
        }
      }
    });
  });

  describe('Error Handling Properties', () => {
    it('should handle malformed inputs gracefully', async () => {
      const testCases = 20;

      for (let i = 0; i < testCases; i++) {
        const malformedQuery = generateMalformedQuery();

        const result = await musicSearchService.search70sSongs(malformedQuery);

        // Property: should never crash on malformed input
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.songs)).toBe(true);

        // Property: malformed queries should still return valid interface
        expect(InterfaceValidator.validateSearchResult(result)).toBe(true);
      }
    });

    it('should maintain performance characteristics', async () => {
      const testCases = 10;
      const performanceResults: number[] = [];

      for (let i = 0; i < testCases; i++) {
        const query = generateRandomQuery();
        const options = generateSearchOptions();

        const startTime = Date.now();
        await musicSearchService.search70sSongs(query, options);
        const duration = Date.now() - startTime;

        performanceResults.push(duration);
      }

      // Property: performance should be consistent (no extreme outliers)
      const avgDuration = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
      const maxDuration = Math.max(...performanceResults);

      // No single request should be more than 5x the average
      expect(maxDuration).toBeLessThan(avgDuration * 5);

      // All requests should complete in reasonable time
      performanceResults.forEach(duration => {
        expect(duration).toBeLessThan(10000); // 10 seconds max
      });
    });
  });

  describe('Data Integrity Properties', () => {
    it('should maintain consistent field types across results', async () => {
      const testCases = 15;

      for (let i = 0; i < testCases; i++) {
        const result = await musicSearchService.search70sSongs('bohemian', {
          includeFallback: true
        });

        if (result.songs.length > 0) {
          const firstSong = result.songs[0];
          const expectedTypes: Record<string, string> = {
            id: 'string',
            title: 'string',
            artist: 'string',
            source: 'string'
          };

          // Property: all songs should have consistent field types
          result.songs.forEach(song => {
            expect(InterfaceValidator.validateFieldTypes(song, expectedTypes)).toBe(true);

            // Property: optional fields, when present, should have correct types
            if ('year' in song && song.year != null) {
              expect(typeof song.year).toBe('number');
            }
            if ('popularity' in song && song.popularity != null) {
              expect(typeof song.popularity).toBe('number');
              expect(song.popularity).toBeGreaterThanOrEqual(0);
              expect(song.popularity).toBeLessThanOrEqual(100);
            }
          });
        }
      }
    });

    it('should maintain caching consistency', async () => {
      const testCases = 10;

      for (let i = 0; i < testCases; i++) {
        const query = generateRandomQuery();
        const options = generateSearchOptions();

        // Make the same request twice
        const result1 = await musicSearchService.search70sSongs(query, options);
        const result2 = await musicSearchService.search70sSongs(query, options);

        // Property: cached results should be identical
        expect(result1.songs.length).toBe(result2.songs.length);

        if (result1.songs.length > 0 && result2.songs.length > 0) {
          // Results should be structurally equivalent
          expect(result1.songs[0].title).toBe(result2.songs[0].title);
          expect(result1.songs[0].artist).toBe(result2.songs[0].artist);
        }
      }
    });
  });

  describe('Boundary Condition Properties', () => {
    it('should handle edge case search parameters', async () => {
      const edgeCases = [
        { maxResults: 1 },
        { maxResults: 100 },
        { cacheTimeout: 0 },
        { cacheTimeout: 1000000 },
        { includeSpotify: true, spotifyPrimary: true, includeFallback: false },
        { includeSpotify: false, spotifyPrimary: false, includeFallback: true }
      ];

      for (const edgeCase of edgeCases) {
        const result = await musicSearchService.search70sSongs('test', edgeCase);

        // Property: edge cases should not break basic contracts
        expect(InterfaceValidator.validateSearchResult(result)).toBe(true);
        expect(result.songs.length).toBeLessThanOrEqual(edgeCase.maxResults || 15);
      }
    });
  });
});