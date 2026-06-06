import type { Song, SearchResult, SearchOptions } from '../../src/lib/musicSearchService.js';

// Type-level contract definitions for compile-time validation
export interface SongContractDefinition {
  readonly requiredFields: readonly ['id', 'title', 'artist', 'source'];
  readonly optionalFields: readonly ['year', 'youtubeSearchUrl', 'musicbrainzId', 'spotifyId', 'previewUrl', 'popularity', 'albumArtUrl', 'explicit'];
  readonly stringFields: readonly ['id', 'title', 'artist', 'source', 'youtubeSearchUrl', 'musicbrainzId', 'spotifyId', 'albumArtUrl'];
  readonly numberFields: readonly ['year', 'popularity'];
  readonly booleanFields: readonly ['explicit'];
  readonly sources: readonly ['musicbrainz', 'curated', 'spotify'];
}

export interface SearchResultContractDefinition {
  readonly requiredFields: readonly ['success', 'songs', 'source'];
  readonly optionalFields: readonly ['error', 'totalFound', 'sourcesUsed', 'searchStrategy'];
  readonly songArrayField: 'songs';
  readonly sources: readonly ['api', 'cache', 'fallback', 'spotify', 'mixed'];
  readonly strategies: readonly ['spotify-primary', 'musicbrainz-primary', 'fallback-only'];
}

// Compile-time contract validation using conditional types
export type ValidateSongContract<T> = T extends Song
  ? SongContractDefinition['requiredFields'][number] extends keyof T
    ? T
    : never
  : never;

export type ValidateSearchResultContract<T> = T extends SearchResult
  ? SearchResultContractDefinition['requiredFields'][number] extends keyof T
    ? T
    : never
  : never;