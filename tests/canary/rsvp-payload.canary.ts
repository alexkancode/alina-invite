import { describe, expect, test } from 'vitest';
import type { SpotifyTrack } from '../../src/components/spotify-combobox/types';
import { parseRsvpSong, type RsvpSong } from '../../src/lib/rsvpSong';

const track: SpotifyTrack = {
  id: 'canary-1',
  title: 'Stayin\' Alive',
  artist: 'Bee Gees',
  year: 1977,
  spotifyUrl: 'https://open.spotify.com/track/canary-1',
  spotifyId: 'canary-1'
};

const hiddenFieldJson = JSON.stringify({
  id: track.id,
  title: track.title,
  artist: track.artist,
  year: track.year,
  spotifyUrl: track.spotifyUrl,
  spotifyId: track.spotifyId
});

describe('RSVP payload contract canary', () => {
  test('the exact object the combobox writes survives the wire and the server parser', () => {
    const wirePayload = JSON.parse(hiddenFieldJson);
    const parsed = parseRsvpSong(wirePayload);

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      title: track.title,
      artist: track.artist,
      year: track.year,
      spotifyUrl: track.spotifyUrl,
      spotifyId: track.spotifyId
    });
  });

  test('RsvpSong stays assignable from SpotifyTrack fields', () => {
    const song: RsvpSong = {
      title: track.title,
      artist: track.artist,
      year: track.year,
      spotifyUrl: track.spotifyUrl,
      spotifyId: track.spotifyId
    };

    expect(song.title).toBe(track.title);
    expect(song.artist).toBe(track.artist);
  });

  test('malformed payloads degrade to null instead of crashing the RSVP', () => {
    expect(parseRsvpSong(undefined)).toBeNull();
    expect(parseRsvpSong(null)).toBeNull();
    expect(parseRsvpSong('a plain string')).toBeNull();
    expect(parseRsvpSong(42)).toBeNull();
    expect(parseRsvpSong({ artist: 'no title' })).toBeNull();
    expect(parseRsvpSong({ title: 'no artist' })).toBeNull();
  });
});
