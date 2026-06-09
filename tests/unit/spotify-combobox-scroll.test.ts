import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Spotify Combobox Auto-scroll Behavior', () => {
  let container: HTMLElement;
  let searchInput: HTMLInputElement;
  let resultsList: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div data-testid="spotify-combobox">
        <select class="spotify-fallback-select" name="favoriteSong">
          <option value="">Select a groovy tune...</option>
        </select>
        <div class="spotify-dynamic-container" style="display: none;">
          <div class="spotify-input-wrapper relative">
          <input
            type="text"
            id="spotify-search"
            role="combobox"
            aria-controls="spotify-results"
            class="spotify-search-input"
          />
          <ul
            id="spotify-results"
            role="listbox"
            class="spotify-results-dropdown"
          ></ul>
          </div>
          <div class="spotify-selected-container hidden"></div>
          <input type="hidden" name="favoriteSong" />
        </div>
      </div>
    `;

    container = document.querySelector('[data-testid="spotify-combobox"]') as HTMLElement;
    searchInput = document.getElementById('spotify-search') as HTMLInputElement;
    resultsList = document.getElementById('spotify-results') as HTMLElement;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  test('should scroll results to top when new search results are populated', async () => {
    const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
    const combobox = new SpotifyCombobox(container);

    // Mock scrollTop property with tracking
    let currentScrollTop = 100; // Simulate scrolled down
    const scrollTopSetter = vi.fn((value) => { currentScrollTop = value; });

    Object.defineProperty(resultsList, 'scrollTop', {
      get: () => currentScrollTop,
      set: scrollTopSetter,
      configurable: true
    });

    const mockTracks = [
      { id: 'track-1', title: 'Song 1', artist: 'Artist 1', spotifyUrl: '', spotifyId: '1' },
      { id: 'track-2', title: 'Song 2', artist: 'Artist 2', spotifyUrl: '', spotifyId: '2' },
      { id: 'track-3', title: 'Song 3', artist: 'Artist 3', spotifyUrl: '', spotifyId: '3' }
    ];

    // Set initial results and scroll position
    combobox.setState({
      isOpen: true,
      results: mockTracks
    });

    // Verify auto-scroll was called
    expect(scrollTopSetter).toHaveBeenCalledWith(0);
    expect(currentScrollTop).toBe(0);
  });

  test('should not interfere with keyboard navigation scrolling', async () => {
    const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
    const combobox = new SpotifyCombobox(container);

    // Mock scrollTop property
    let currentScrollTop = 0;
    Object.defineProperty(resultsList, 'scrollTop', {
      get: vi.fn(() => currentScrollTop),
      set: vi.fn((value) => { currentScrollTop = value; }),
      configurable: true
    });

    const mockTracks = [
      { id: 'track-1', title: 'Song 1', artist: 'Artist 1', spotifyUrl: '', spotifyId: '1' },
      { id: 'track-2', title: 'Song 2', artist: 'Artist 2', spotifyUrl: '', spotifyId: '2' }
    ];

    combobox.setState({
      isOpen: true,
      results: mockTracks
    });

    // Verify initial scroll to top
    expect(currentScrollTop).toBe(0);

    // Simulate user manually scrolling
    currentScrollTop = 50;

    // Navigate with keyboard (should not trigger auto-scroll)
    combobox.setState({ highlightedIndex: 1 });

    // Should not have reset scroll position
    expect(currentScrollTop).toBe(50);
  });

  test('should auto-scroll only when results array changes, not on other state updates', async () => {
    const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
    const combobox = new SpotifyCombobox(container);

    const scrollSpy = vi.fn();
    Object.defineProperty(resultsList, 'scrollTop', {
      get: vi.fn(() => 0),
      set: scrollSpy,
      configurable: true
    });

    const mockTracks = [
      { id: 'track-1', title: 'Song 1', artist: 'Artist 1', spotifyUrl: '', spotifyId: '1' }
    ];

    // Set initial results
    combobox.setState({
      isOpen: true,
      results: mockTracks
    });

    scrollSpy.mockClear();

    // Change highlighted index (should not trigger scroll)
    combobox.setState({ highlightedIndex: 0 });
    expect(scrollSpy).not.toHaveBeenCalled();

    // Change loading state (should not trigger scroll)
    combobox.setState({ isLoading: true });
    expect(scrollSpy).not.toHaveBeenCalled();

    // Change results (should trigger scroll)
    const newTracks = [
      { id: 'track-2', title: 'Song 2', artist: 'Artist 2', spotifyUrl: '', spotifyId: '2' }
    ];
    combobox.setState({ results: newTracks });
    expect(scrollSpy).toHaveBeenCalledWith(0);
  });

  test('should handle results list with no scrollHeight gracefully', async () => {
    const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
    const combobox = new SpotifyCombobox(container);

    // Mock empty results list
    Object.defineProperty(resultsList, 'scrollTop', {
      get: vi.fn(() => 0),
      set: vi.fn(),
      configurable: true
    });

    // Should not throw error with empty results
    expect(() => {
      combobox.setState({
        isOpen: true,
        results: []
      });
    }).not.toThrow();
  });

  test('should preserve scroll position when dropdown is closed and reopened without new search', async () => {
    const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
    const combobox = new SpotifyCombobox(container);

    let currentScrollTop = 0;
    Object.defineProperty(resultsList, 'scrollTop', {
      get: vi.fn(() => currentScrollTop),
      set: vi.fn((value) => { currentScrollTop = value; }),
      configurable: true
    });

    const mockTracks = [
      { id: 'track-1', title: 'Song 1', artist: 'Artist 1', spotifyUrl: '', spotifyId: '1' },
      { id: 'track-2', title: 'Song 2', artist: 'Artist 2', spotifyUrl: '', spotifyId: '2' }
    ];

    // Set results and simulate user scroll
    combobox.setState({
      isOpen: true,
      results: mockTracks
    });
    currentScrollTop = 30; // User scrolled down

    // Close dropdown
    combobox.setState({ isOpen: false });

    // Reopen with same results (e.g., focus event)
    combobox.setState({ isOpen: true });

    // Should not auto-scroll since results didn't change
    expect(currentScrollTop).toBe(30);
  });
});