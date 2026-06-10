import { describe, expect, test } from 'vitest';
import { renderGuestEntries } from '../../src/components/guest-list/GuestListRenderer';

const exactListApiRow = {
  name: 'Smoke Happy',
  message: 'groovy',
  attending: 'yes',
  timestamp: '2026-06-09T19:14:21.789Z',
  song_title: 'Le Freak',
  song_artist: 'CHIC',
  song_year: 1978,
  song_spotify_url: 'https://open.spotify.com/track/abc',
  song_spotify_id: 'abc'
};

describe('Guest list payload contract canary', () => {
  test('a row shaped exactly like the RSVP list GET renders the song and play button', () => {
    const host = document.createElement('div');
    host.innerHTML = renderGuestEntries([exactListApiRow]);

    expect(host.querySelector('.guest-song-line')?.textContent).toContain('Le Freak');
    expect(host.querySelector('.guest-song-line')?.textContent).not.toContain('CHIC');
    const button = host.querySelector('.guest-song-play') as HTMLButtonElement;
    expect(button?.dataset.trackId).toBe('abc');
    expect(button?.dataset.title).toBe('Le Freak');
    expect(button?.dataset.artist).toBe('CHIC');
  });

  test('the renderer keys off the post-migration column names, not the legacy ones', () => {
    const legacyRow = {
      name: 'Legacy Guest',
      attending: 'yes',
      favorite_song_title: 'Dancing Queen',
      favorite_song_artist: 'ABBA'
    };

    const host = document.createElement('div');
    host.innerHTML = renderGuestEntries([legacyRow as never]);

    expect(host.querySelector('.guest-song-line')).toBeNull();
    expect(host.querySelector('.guest-name')?.textContent).toBe('Legacy Guest');
  });
});
