import { describe, expect, test } from 'vitest';
import { renderGuestEntries, type GuestRsvp } from '../../src/components/guest-list/GuestListRenderer';

const render = (rsvps: GuestRsvp[]): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = renderGuestEntries(rsvps);
  return host;
};

const guestWithSong = (overrides: Partial<GuestRsvp> = {}): GuestRsvp => ({
  name: 'Alex',
  attending: 'yes',
  song_title: 'Dancing Queen',
  song_artist: 'ABBA',
  song_spotify_id: 'spotify-123',
  ...overrides
});

describe('renderGuestEntries', () => {
  test('renders name and going status', () => {
    const host = render([{ name: 'Alex', attending: 'yes' }]);

    const entry = host.querySelector('.guest-entry')!;
    expect(entry.querySelector('.guest-name')?.textContent).toBe('Alex');
    expect(entry.querySelector('.guest-status-going')?.textContent).toContain('Going');
  });

  test('renders not-going status', () => {
    const host = render([{ name: 'Sam', attending: 'no' }]);

    expect(host.querySelector('.guest-status-not-going')?.textContent).toBe('Not going');
    expect(host.querySelector('.guest-status-going')).toBeNull();
  });

  test('a guest without a song has no song line and no play button', () => {
    const host = render([{ name: 'Sam', attending: 'yes' }]);

    expect(host.querySelector('.guest-song-line')).toBeNull();
    expect(host.querySelector('.guest-song-play')).toBeNull();
  });

  test('a guest with only a title and no artist gets no song line', () => {
    const host = render([guestWithSong({ song_artist: null })]);

    expect(host.querySelector('.guest-song-line')).toBeNull();
  });

  test('a guest with a song shows the song line and a play button with track data', () => {
    const host = render([guestWithSong()]);

    expect(host.querySelector('.guest-song-line')?.textContent).toContain('Dancing Queen - ABBA');
    const button = host.querySelector('.guest-song-play') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.dataset.trackId).toBe('spotify-123');
    expect(button.dataset.title).toBe('Dancing Queen');
    expect(button.dataset.artist).toBe('ABBA');
    expect(button.textContent?.trim()).toBe('▶');
  });

  test('falls back to a name-derived track id when no spotify id exists', () => {
    const host = render([guestWithSong({ song_spotify_id: null })]);

    const button = host.querySelector('.guest-song-play') as HTMLButtonElement;
    expect(button.dataset.trackId).toBeTruthy();
    expect(button.dataset.trackId).not.toBe('spotify-123');
  });

  test('escapes HTML in the guest name', () => {
    const host = render([{ name: '<img src=x onerror=alert(1)>', attending: 'yes' }]);

    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('.guest-name')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  test('escapes HTML in song fields including attribute values', () => {
    const host = render([guestWithSong({
      song_title: '"><script>alert(1)</script>',
      song_artist: 'A&B "Quotes"'
    })]);

    expect(host.querySelector('script')).toBeNull();
    const button = host.querySelector('.guest-song-play') as HTMLButtonElement;
    expect(button.dataset.title).toBe('"><script>alert(1)</script>');
    expect(button.dataset.artist).toBe('A&B "Quotes"');
  });

  test('renders one entry per rsvp in order', () => {
    const host = render([
      { name: 'First', attending: 'yes' },
      guestWithSong({ name: 'Second' }),
      { name: 'Third', attending: 'no' }
    ]);

    const names = Array.from(host.querySelectorAll('.guest-name')).map(n => n.textContent);
    expect(names).toEqual(['First', 'Second', 'Third']);
    expect(host.querySelectorAll('.guest-song-play')).toHaveLength(1);
  });
});
