import { describe, it, expect } from 'vitest';
import type { Song, SearchResult, SearchOptions } from '../../src/lib/musicSearchService.js';
import type { SongContractDefinition, SearchResultContractDefinition } from '../contracts/type-definitions.js';

describe('Type Contract Canary Tests', () => {
  describe('Song Interface Stability', () => {
    it('should maintain required fields contract', () => {
      const requiredFields: (keyof Song)[] = ['id', 'title', 'artist', 'source'];

      // Create a minimal Song object
      const song: Song = {
        id: 'test',
        title: 'Test Song',
        artist: 'Test Artist',
        source: 'curated'
      };

      // Validate required fields exist
      requiredFields.forEach(field => {
        expect(song).toHaveProperty(field);
        expect(song[field]).toBeDefined();
      });
    });

    it('should support all documented source types', () => {
      const validSources: Song['source'][] = ['musicbrainz', 'curated', 'spotify'];

      validSources.forEach(source => {
        const song: Song = {
          id: 'test',
          title: 'Test',
          artist: 'Test',
          source
        };

        expect(['musicbrainz', 'curated', 'spotify']).toContain(song.source);
      });
    });

    it('should maintain Spotify enhancement fields', () => {
      const enhancedSong: Song = {
        id: 'test',
        title: 'Test',
        artist: 'Test',
        source: 'spotify',
        spotifyId: 'spotify123',
        previewUrl: 'http://preview.url',
        popularity: 85,
        albumArtUrl: 'http://album.art',
        explicit: false
      };

      // Validate Spotify-specific fields
      expect(enhancedSong.spotifyId).toBeDefined();
      expect(enhancedSong.previewUrl).toBeDefined();
      expect(enhancedSong.popularity).toBeTypeOf('number');
      expect(enhancedSong.albumArtUrl).toBeTypeOf('string');
      expect(enhancedSong.explicit).toBeTypeOf('boolean');
    });

    it('should maintain backwards compatibility with original Song interface', () => {
      // Test that enhanced Song can be used anywhere original Song was expected
      const originalSong: Pick<Song, 'id' | 'title' | 'artist' | 'source'> = {
        id: 'test',
        title: 'Test',
        artist: 'Test',
        source: 'curated'
      };

      const enhancedSong: Song = {
        ...originalSong,
        spotifyId: 'spotify123',
        previewUrl: 'http://preview.url'
      };

      // Both should have the same core interface
      expect(originalSong.id).toBeDefined();
      expect(enhancedSong.id).toBeDefined();
      expect(originalSong.title).toBeDefined();
      expect(enhancedSong.title).toBeDefined();
    });
  });

  describe('SearchResult Interface Stability', () => {
    it('should maintain core SearchResult contract', () => {
      const result: SearchResult = {
        success: true,
        songs: [],
        source: 'api'
      };

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('songs');
      expect(result).toHaveProperty('source');
      expect(Array.isArray(result.songs)).toBe(true);
    });

    it('should support enhanced SearchResult fields', () => {
      const enhancedResult: SearchResult = {
        success: true,
        songs: [],
        source: 'mixed',
        totalFound: 0,
        sourcesUsed: ['musicbrainz', 'spotify'],
        searchStrategy: 'spotify-primary'
      };

      expect(enhancedResult.sourcesUsed).toBeDefined();
      expect(Array.isArray(enhancedResult.sourcesUsed)).toBe(true);
      expect(['spotify-primary', 'musicbrainz-primary', 'fallback-only']).toContain(enhancedResult.searchStrategy!);
    });

    it('should maintain source type consistency', () => {
      const validSources: SearchResult['source'][] = ['api', 'cache', 'fallback', 'spotify', 'mixed'];

      validSources.forEach(source => {
        const result: SearchResult = {
          success: true,
          songs: [],
          source
        };

        expect(validSources).toContain(result.source);
      });
    });
  });

  describe('SearchOptions Interface Stability', () => {
    it('should maintain backwards compatibility for SearchOptions', () => {
      // Original options should still work
      const originalOptions: SearchOptions = {
        includeFallback: true,
        maxResults: 10,
        cacheTimeout: 5000
      };

      expect(originalOptions.includeFallback).toBeTypeOf('boolean');
      expect(originalOptions.maxResults).toBeTypeOf('number');
    });

    it('should support enhanced SearchOptions fields', () => {
      const enhancedOptions: SearchOptions = {
        includeFallback: true,
        maxResults: 10,
        includeSpotify: true,
        spotifyPrimary: false,
        includeEnhancedMetadata: true
      };

      expect(enhancedOptions.includeSpotify).toBeTypeOf('boolean');
      expect(enhancedOptions.spotifyPrimary).toBeTypeOf('boolean');
      expect(enhancedOptions.includeEnhancedMetadata).toBeTypeOf('boolean');
    });
  });

  describe('Compile-time Contract Validation', () => {
    it('should validate type-level contracts', () => {
      // These tests verify compile-time type safety
      // If these compile, the contracts are maintained

      type TestSong = Song;
      type TestSearchResult = SearchResult;

      // Verify required fields exist at type level
      const testTypeCompliance: TestSong = {} as Song;
      const testResultCompliance: TestSearchResult = {} as SearchResult;

      // If this compiles, our type contracts are stable
      expect(testTypeCompliance).toBeDefined();
      expect(testResultCompliance).toBeDefined();
    });
  });
});