import type { SpotifyTrack } from '../components/spotify-combobox/types.js';

export type RsvpSong = Pick<SpotifyTrack, 'title' | 'artist'> &
  Partial<Pick<SpotifyTrack, 'id' | 'year' | 'spotifyUrl' | 'spotifyId'>>;

export function parseRsvpSong(value: unknown): RsvpSong | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.title !== 'string' || typeof candidate.artist !== 'string') {
    return null;
  }

  return {
    title: candidate.title,
    artist: candidate.artist,
    id: typeof candidate.id === 'string' ? candidate.id : undefined,
    year: typeof candidate.year === 'number' ? candidate.year : undefined,
    spotifyUrl: typeof candidate.spotifyUrl === 'string' ? candidate.spotifyUrl : undefined,
    spotifyId: typeof candidate.spotifyId === 'string' ? candidate.spotifyId : undefined
  };
}
