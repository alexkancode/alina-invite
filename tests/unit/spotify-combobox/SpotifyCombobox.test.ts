import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SpotifyTrack, SearchState } from '../../../src/components/spotify-combobox/types.js';

// Mock DOM elements and APIs
const mockElement = (tagName: string, id?: string) => {
  const element = document.createElement(tagName);
  if (id) element.id = id;
  return element;
};

describe('SpotifyCombobox', () => {
  let container: HTMLDivElement;
  let searchInput: HTMLInputElement;
  let resultsList: HTMLUListElement;
  let hiddenInput: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    container = mockElement('div', 'spotify-combobox') as HTMLDivElement;
    searchInput = mockElement('input', 'spotify-search') as HTMLInputElement;
    resultsList = mockElement('ul', 'spotify-results') as HTMLUListElement;
    hiddenInput = mockElement('input', 'spotify-value') as HTMLInputElement;

    searchInput.setAttribute('role', 'combobox');
    searchInput.setAttribute('aria-controls', 'spotify-results');
    searchInput.setAttribute('aria-expanded', 'false');

    resultsList.setAttribute('role', 'listbox');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'favoriteSong';

    const inputWrapper = mockElement('div') as HTMLDivElement;
    inputWrapper.className = 'spotify-input-wrapper relative';
    const selectedContainer = mockElement('div') as HTMLDivElement;
    selectedContainer.className = 'spotify-selected-container hidden';

    inputWrapper.appendChild(searchInput);
    inputWrapper.appendChild(resultsList);
    container.appendChild(inputWrapper);
    container.appendChild(selectedContainer);
    container.appendChild(hiddenInput);
    document.body.appendChild(container);

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', async () => {
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      expect(combobox.getState().query).toBe('');
      expect(combobox.getState().results).toEqual([]);
      expect(combobox.getState().isLoading).toBe(false);
      expect(combobox.getState().isOpen).toBe(false);
      expect(combobox.getState().highlightedIndex).toBe(-1);
      expect(combobox.getState().selectedTrack).toBeNull();
    });

    test('should bind event listeners on initialization', async () => {
      const addEventListenerSpy = vi.spyOn(searchInput, 'addEventListener');
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');

      new SpotifyCombobox(container);

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    test('should setup ARIA attributes correctly', async () => {
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      new SpotifyCombobox(container);

      expect(searchInput.getAttribute('role')).toBe('combobox');
      expect(searchInput.getAttribute('aria-controls')).toBe('spotify-results');
      expect(searchInput.getAttribute('aria-expanded')).toBe('false');
      expect(searchInput.getAttribute('aria-autocomplete')).toBe('list');
    });
  });

  describe('Search Functionality', () => {
    test('should trigger search after debounce delay', async () => {
      vi.useFakeTimers();

      const mockSearchResponse: SpotifyTrack[] = [
        {
          id: 'track1',
          title: 'Dancing Queen',
          artist: 'ABBA',
          year: 1976,
          spotifyUrl: 'https://open.spotify.com/track/123',
          spotifyId: '123',
          albumArtUrl: 'https://example.com/art.jpg'
        }
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          songs: mockSearchResponse.map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            year: track.year,
            spotifyId: track.spotifyId,
            albumArtUrl: track.albumArtUrl
          }))
        })
      });

      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      searchInput.value = 'dancing queen';
      searchInput.dispatchEvent(new Event('input'));

      expect(combobox.getState().isLoading).toBe(false);

      vi.advanceTimersByTime(200);

      expect(combobox.getState().isLoading).toBe(true);

      await vi.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/music-search?q=dancing%20queen&maxResults=10'
      );

      vi.useRealTimers();
    });

    test('should handle search errors gracefully', async () => {
      vi.useFakeTimers();

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      expect(combobox.getState().results).toEqual([]);
      expect(combobox.getState().isLoading).toBe(false);

      vi.useRealTimers();
    });

    test('should prevent race conditions with concurrent searches', async () => {
      vi.useFakeTimers();

      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
      const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

      global.fetch = vi.fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      searchInput.value = 'first query';
      searchInput.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      searchInput.value = 'second query';
      searchInput.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      resolveFirst({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          songs: [{ id: '1', title: 'First Result' }]
        })
      });

      resolveSecond({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          songs: [{ id: '2', title: 'Second Result' }]
        })
      });

      await vi.runAllTimersAsync();

      expect(combobox.getState().results[0].title).toBe('Second Result');

      vi.useRealTimers();
    });
  });

  describe('Selection Handling', () => {
    test('should update form value when track is selected', async () => {
      const track: SpotifyTrack = {
        id: 'track1',
        title: 'Dancing Queen',
        artist: 'ABBA',
        year: 1976,
        spotifyUrl: 'https://open.spotify.com/track/123',
        spotifyId: '123'
      };

      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      combobox.selectTrack(track);

      expect(hiddenInput.value).toBe(JSON.stringify({
        id: track.id,
        title: track.title,
        artist: track.artist,
        year: track.year,
        spotifyUrl: track.spotifyUrl,
        spotifyId: track.spotifyId
      }));

      expect(searchInput.value).toBe('');
      expect(container.querySelector('.spotify-selected-card')?.textContent).toContain(track.title);
      expect(combobox.getState().selectedTrack).toEqual(track);
    });

    test('should clear form value when selection is cleared', async () => {
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      combobox.selectTrack(null);

      expect(hiddenInput.value).toBe('');
      expect(searchInput.value).toBe('');
      expect(combobox.getState().selectedTrack).toBeNull();
    });

    test('should dispatch change event when selection changes', async () => {
      const changeHandler = vi.fn();
      hiddenInput.addEventListener('change', changeHandler);

      const track: SpotifyTrack = {
        id: 'track1',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 1975,
        spotifyUrl: 'https://open.spotify.com/track/123',
        spotifyId: '123'
      };

      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      combobox.selectTrack(track);

      expect(changeHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'change',
        target: hiddenInput
      }));
    });
  });

  describe('Keyboard Navigation', () => {
    let combobox: any;
    const mockTracks: SpotifyTrack[] = [
      {
        id: 'track1',
        title: 'Song 1',
        artist: 'Artist 1',
        year: 1975,
        spotifyUrl: 'https://open.spotify.com/track/1',
        spotifyId: '1'
      },
      {
        id: 'track2',
        title: 'Song 2',
        artist: 'Artist 2',
        year: 1976,
        spotifyUrl: 'https://open.spotify.com/track/2',
        spotifyId: '2'
      }
    ];

    beforeEach(async () => {
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      combobox = new SpotifyCombobox(container);
      combobox.setState({ results: mockTracks, isOpen: true });
    });

    test('should navigate to next item with ArrowDown', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      searchInput.dispatchEvent(keyEvent);

      expect(combobox.getState().highlightedIndex).toBe(0);
    });

    test('should navigate to previous item with ArrowUp', () => {
      combobox.setState({ highlightedIndex: 1 });

      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      searchInput.dispatchEvent(keyEvent);

      expect(combobox.getState().highlightedIndex).toBe(0);
    });

    test('should select highlighted item with Enter', () => {
      combobox.setState({ highlightedIndex: 0 });

      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      searchInput.dispatchEvent(keyEvent);

      expect(combobox.getState().selectedTrack).toEqual(mockTracks[0]);
    });

    test('should close dropdown with Escape', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      searchInput.dispatchEvent(keyEvent);

      expect(combobox.getState().isOpen).toBe(false);
    });

    test('should wrap to beginning when navigating past end', () => {
      combobox.setState({ highlightedIndex: 1 });

      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      searchInput.dispatchEvent(keyEvent);

      expect(combobox.getState().highlightedIndex).toBe(0);
    });
  });

  describe('ARIA Accessibility', () => {
    test('should update aria-expanded when dropdown opens', async () => {
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      combobox.setState({ isOpen: true });

      expect(searchInput.getAttribute('aria-expanded')).toBe('true');
    });

    test('should update aria-activedescendant when highlighting changes', async () => {
      const mockTracks: SpotifyTrack[] = [{
        id: 'track1',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 1975,
        spotifyUrl: 'https://open.spotify.com/track/1',
        spotifyId: '1'
      }];

      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      combobox.setState({ results: mockTracks, highlightedIndex: 0 });

      expect(searchInput.getAttribute('aria-activedescendant')).toBe('spotify-option-track1');
    });

    test('should clear aria-activedescendant when no item highlighted', async () => {
      const { SpotifyCombobox } = await import('../../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      combobox.setState({ highlightedIndex: -1 });

      expect(searchInput.hasAttribute('aria-activedescendant')).toBe(false);
    });
  });
});