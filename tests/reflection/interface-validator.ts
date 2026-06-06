import type { Song, SearchResult } from '../../src/lib/musicSearchService.js';

export class InterfaceValidator {
  static validateSongObject(obj: unknown): obj is Song {
    if (!obj || typeof obj !== 'object') return false;

    const song = obj as Record<string, unknown>;

    // Required fields validation
    const requiredFields = ['id', 'title', 'artist', 'source'] as const;
    for (const field of requiredFields) {
      if (!(field in song) || typeof song[field] !== 'string') {
        return false;
      }
    }

    // Source validation
    const validSources = ['musicbrainz', 'curated', 'spotify'];
    if (!validSources.includes(song.source as string)) {
      return false;
    }

    // Optional field type validation
    if ('year' in song && song.year != null && typeof song.year !== 'number') {
      return false;
    }

    if ('spotifyId' in song && song.spotifyId != null && typeof song.spotifyId !== 'string') {
      return false;
    }

    if ('previewUrl' in song && song.previewUrl != null && typeof song.previewUrl !== 'string') {
      return false;
    }

    if ('popularity' in song && song.popularity != null && typeof song.popularity !== 'number') {
      return false;
    }

    if ('explicit' in song && song.explicit != null && typeof song.explicit !== 'boolean') {
      return false;
    }

    return true;
  }

  static validateSearchResult(obj: unknown): obj is SearchResult {
    if (!obj || typeof obj !== 'object') return false;

    const result = obj as Record<string, unknown>;

    // Required fields validation
    if (typeof result.success !== 'boolean') return false;
    if (!Array.isArray(result.songs)) return false;
    if (typeof result.source !== 'string') return false;

    // Validate all songs in array
    for (const song of result.songs) {
      if (!this.validateSongObject(song)) return false;
    }

    // Validate source values
    const validSources = ['api', 'cache', 'fallback', 'spotify', 'mixed'];
    if (!validSources.includes(result.source as string)) {
      return false;
    }

    // Optional fields validation
    if ('sourcesUsed' in result && result.sourcesUsed != null) {
      if (!Array.isArray(result.sourcesUsed)) return false;
      const validSourceTypes = ['musicbrainz', 'curated', 'spotify'];
      for (const source of result.sourcesUsed) {
        if (!validSourceTypes.includes(source as string)) return false;
      }
    }

    if ('searchStrategy' in result && result.searchStrategy != null) {
      const validStrategies = ['spotify-primary', 'musicbrainz-primary', 'fallback-only'];
      if (!validStrategies.includes(result.searchStrategy as string)) {
        return false;
      }
    }

    return true;
  }

  static getObjectSignature(obj: unknown): string {
    if (!obj || typeof obj !== 'object') return typeof obj;

    const signature = Object.keys(obj as Record<string, unknown>)
      .sort()
      .map(key => {
        const value = (obj as Record<string, unknown>)[key];
        return `${key}:${typeof value}`;
      })
      .join(',');

    return `{${signature}}`;
  }

  static validateFieldTypes(obj: unknown, expectedTypes: Record<string, string>): boolean {
    if (!obj || typeof obj !== 'object') return false;

    const record = obj as Record<string, unknown>;

    for (const [field, expectedType] of Object.entries(expectedTypes)) {
      if (field in record) {
        const actualType = typeof record[field];
        if (actualType !== expectedType) {
          return false;
        }
      }
    }

    return true;
  }
}