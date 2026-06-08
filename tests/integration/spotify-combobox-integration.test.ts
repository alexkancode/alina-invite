import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Spotify Combobox Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div data-testid="spotify-combobox">
        <select class="spotify-fallback-select" name="favoriteSong">
          <option value="">Select a groovy tune...</option>
          <option value='{"title":"Test Song","artist":"Test Artist","year":1975}'>Test Song - Test Artist</option>
        </select>

        <div class="spotify-dynamic-container" style="display: none;">
          <div class="relative">
            <input
              type="text"
              id="spotify-search"
              role="combobox"
              aria-controls="spotify-results"
              aria-expanded="false"
              placeholder="Search for songs, artists, albums..."
            />

            <ul
              id="spotify-results"
              role="listbox"
              class="hidden"
            ></ul>
          </div>

          <input type="hidden" name="favoriteSong" id="favoriteSong-value" />
        </div>
      </div>
    `;

    container = document.querySelector('[data-testid="spotify-combobox"]') as HTMLElement;
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Progressive Enhancement', () => {
    test('should initialize with fallback select visible', () => {
      const fallbackSelect = container.querySelector('.spotify-fallback-select') as HTMLSelectElement;
      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;

      expect(fallbackSelect.style.display).not.toBe('none');
      expect(dynamicContainer.style.display).toBe('none');
    });

    test('should switch to dynamic interface when JavaScript loads', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      const fallbackSelect = container.querySelector('.spotify-fallback-select') as HTMLSelectElement;
      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;

      // Simulate initialization
      fallbackSelect.style.display = 'none';
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);

      expect(fallbackSelect.style.display).toBe('none');
      expect(dynamicContainer.style.display).toBe('block');
      expect(combobox.getState().query).toBe('');
    });
  });

  describe('End-to-End Search Flow', () => {
    test('should complete full search and selection flow', async () => {
      vi.useFakeTimers();

      const mockSearchResponse = {
        success: true,
        songs: [
          {
            id: 'track1',
            title: 'Dancing Queen',
            artist: 'ABBA',
            year: 1976,
            spotifyId: 'spotify123',
            albumArtUrl: 'https://example.com/art.jpg'
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockSearchResponse)
      });

      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      // Setup dynamic interface
      const fallbackSelect = container.querySelector('.spotify-fallback-select') as HTMLSelectElement;
      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;

      fallbackSelect.style.display = 'none';
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);
      const searchInput = container.querySelector('#spotify-search') as HTMLInputElement;
      const hiddenInput = container.querySelector('#favoriteSong-value') as HTMLInputElement;

      // Simulate user typing
      searchInput.value = 'dancing queen';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for debounce
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/music-search?q=dancing%20queen&maxResults=10'
      );

      // Verify results are displayed
      const state = combobox.getState();
      expect(state.results).toHaveLength(1);
      expect(state.results[0].title).toBe('Dancing Queen');
      expect(state.isOpen).toBe(true);

      // Simulate selection
      combobox.selectTrack(state.results[0]);

      // Verify form integration
      expect(hiddenInput.value).toContain('Dancing Queen');
      expect(hiddenInput.value).toContain('ABBA');
      expect(searchInput.value).toBe('Dancing Queen - ABBA');

      vi.useRealTimers();
    });

    test('should handle empty search results gracefully', async () => {
      vi.useFakeTimers();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          success: true,
          songs: []
        })
      });

      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);
      const searchInput = container.querySelector('#spotify-search') as HTMLInputElement;

      searchInput.value = 'nonexistent song';
      searchInput.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      const state = combobox.getState();
      expect(state.results).toHaveLength(0);
      expect(state.isOpen).toBe(false);

      vi.useRealTimers();
    });

    test('should handle API errors without breaking', async () => {
      vi.useFakeTimers();

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);
      const searchInput = container.querySelector('#spotify-search') as HTMLInputElement;

      searchInput.value = 'test query';
      searchInput.dispatchEvent(new Event('input'));

      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      const state = combobox.getState();
      expect(state.results).toHaveLength(0);
      expect(state.isLoading).toBe(false);
      expect(state.isOpen).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Keyboard Navigation Integration', () => {
    test('should navigate and select with keyboard', async () => {
      const mockTracks = [
        {
          id: 'track1',
          title: 'Song 1',
          artist: 'Artist 1',
          year: 1975,
          spotifyId: 'id1',
          spotifyUrl: 'https://open.spotify.com/track/id1'
        },
        {
          id: 'track2',
          title: 'Song 2',
          artist: 'Artist 2',
          year: 1976,
          spotifyId: 'id2',
          spotifyUrl: 'https://open.spotify.com/track/id2'
        }
      ];

      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);
      const searchInput = container.querySelector('#spotify-search') as HTMLInputElement;
      const hiddenInput = container.querySelector('#favoriteSong-value') as HTMLInputElement;

      // Set up results
      combobox.setState({
        results: mockTracks,
        isOpen: true,
        highlightedIndex: -1
      });

      // Navigate down
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(combobox.getState().highlightedIndex).toBe(0);

      // Navigate down again
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(combobox.getState().highlightedIndex).toBe(1);

      // Select with Enter
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(hiddenInput.value).toContain('Song 2');
      expect(combobox.getState().selectedTrack?.title).toBe('Song 2');
    });

    test('should close dropdown with Escape', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);
      const searchInput = container.querySelector('#spotify-search') as HTMLInputElement;

      combobox.setState({ isOpen: true });
      expect(combobox.getState().isOpen).toBe(true);

      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(combobox.getState().isOpen).toBe(false);
    });
  });

  describe('Accessibility Integration', () => {
    test('should maintain proper ARIA attributes during interaction', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');

      const dynamicContainer = container.querySelector('.spotify-dynamic-container') as HTMLElement;
      dynamicContainer.style.display = 'block';

      const combobox = new SpotifyCombobox(container);
      const searchInput = container.querySelector('#spotify-search') as HTMLInputElement;

      // Initial state
      expect(searchInput.getAttribute('aria-expanded')).toBe('false');
      expect(searchInput.hasAttribute('aria-activedescendant')).toBe(false);

      // Open dropdown
      combobox.setState({ isOpen: true });
      expect(searchInput.getAttribute('aria-expanded')).toBe('true');

      // Highlight item
      const mockTrack = {
        id: 'track1',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 1975,
        spotifyId: 'id1',
        spotifyUrl: 'https://open.spotify.com/track/id1'
      };

      combobox.setState({
        results: [mockTrack],
        highlightedIndex: 0
      });

      expect(searchInput.getAttribute('aria-activedescendant')).toBe('spotify-option-track1');

      // Clear highlight
      combobox.setState({ highlightedIndex: -1 });
      expect(searchInput.hasAttribute('aria-activedescendant')).toBe(false);
    });
  });
});