import { describe, expect, test } from 'vitest';
import { isDeferredGuest, renderGuestEntries, type GuestRsvp } from '../../src/components/guest-list/GuestListRenderer';

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
  song_album_art_url: null,
  ...overrides
});

describe('renderGuestEntries', () => {
  test('renders the name with an inline check mark for a going guest', () => {
    const host = render([{ name: 'Alex', attending: 'yes' }]);

    const row = host.querySelector('.guest-name-row')!;
    expect(row.querySelector('.guest-name')?.textContent).toBe('Alex');
    const mark = row.querySelector('.guest-status-mark')!;
    expect(mark.classList.contains('guest-status-going')).toBe(true);
    expect(mark.textContent).toBe('✓');
  });

  test('renders the name with an inline x mark for a not-going guest', () => {
    const host = render([{ name: 'Sam', attending: 'no' }]);

    const mark = host.querySelector('.guest-status-mark')!;
    expect(mark.classList.contains('guest-status-not-going')).toBe(true);
    expect(mark.textContent).toBe('✗');
  });

  test('no standalone status line text remains', () => {
    const host = render([
      { name: 'Alex', attending: 'yes' },
      { name: 'Sam', attending: 'no' }
    ]);

    expect(host.textContent).not.toContain('Going');
    expect(host.textContent).not.toContain('Not going');
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

  test('a guest with a song shows the title-only song line and a play button with track data', () => {
    const host = render([guestWithSong()]);

    expect(host.querySelector('.guest-song-line')?.textContent).toContain('Dancing Queen');
    expect(host.querySelector('.guest-song-line')?.textContent).not.toContain('ABBA');
    const button = host.querySelector('.guest-song-play') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.dataset.trackId).toBe('spotify-123');
    expect(button.dataset.title).toBe('Dancing Queen');
    expect(button.dataset.artist).toBe('ABBA');
    expect(button.textContent?.trim()).toBe('▶');
  });

  test('a verbose title displays succinct while data-title keeps the full string', () => {
    const host = render([guestWithSong({ song_title: 'Bohemian Rhapsody - Remastered 2011' })]);

    expect(host.querySelector('.guest-song-line')?.textContent?.trim()).toBe('♪ Bohemian Rhapsody');
    const button = host.querySelector('.guest-song-play') as HTMLButtonElement;
    expect(button.dataset.title).toBe('Bohemian Rhapsody - Remastered 2011');
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

  describe('album art background', () => {
    test('an entry with art gets the art class and custom property', () => {
      const host = render([guestWithSong({ song_album_art_url: 'https://i.scdn.co/image/cover.jpg' })]);

      const entry = host.querySelector('.guest-entry') as HTMLElement;
      expect(entry.classList.contains('guest-entry-art')).toBe(true);
      expect(entry.getAttribute('style')).toContain('--album-art: url("https://i.scdn.co/image/cover.jpg")');
    });

    test('an entry without art has neither the class nor the property', () => {
      const host = render([guestWithSong()]);

      const entry = host.querySelector('.guest-entry') as HTMLElement;
      expect(entry.classList.contains('guest-entry-art')).toBe(false);
      expect(entry.getAttribute('style')).toBeNull();
    });

    test('an art url with quotes cannot break out into extra declarations', () => {
      const host = render([guestWithSong({ song_album_art_url: 'https://x.example/a.jpg"); background: red; --x: url("' })]);

      const entry = host.querySelector('.guest-entry') as HTMLElement;
      expect(entry.style.getPropertyValue('background')).toBe('');
      expect(entry.style.getPropertyValue('--album-art')).toBeTruthy();
    });
  });

  describe('not-going deferral', () => {
    test.each([
      ['going without a song', { name: 'A', attending: 'yes' }, false],
      ['going with a song', guestWithSong({ name: 'B' }), false],
      ['not going with a song', guestWithSong({ name: 'C', attending: 'no' }), false],
      ['not going without a song', { name: 'D', attending: 'no' }, true]
    ] as Array<[string, GuestRsvp, boolean]>)('classifies %s', (_label, guest, expectedDeferred) => {
      expect(isDeferredGuest(guest)).toBe(expectedDeferred);
    });

    test('only the not-going songless entry carries the deferred class', () => {
      const host = render([
        { name: 'Going Plain', attending: 'yes' },
        guestWithSong({ name: 'Going Song' }),
        guestWithSong({ name: 'NotGoing Song', attending: 'no' }),
        { name: 'NotGoing Plain', attending: 'no' }
      ]);

      const deferred = Array.from(host.querySelectorAll('.guest-entry-deferred .guest-name'))
        .map(n => n.textContent);
      expect(deferred).toEqual(['NotGoing Plain']);
    });
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
