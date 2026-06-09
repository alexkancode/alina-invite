import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Spotify Combobox Styling Integration', () => {
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
            class="spotify-search-input w-full px-phi-md py-phi-sm rounded-lg text-phi-base text-warm-cream"
            style="background: rgba(255,255,255,0.06); border: 2px solid hsl(270, 30%, 40%);"
          />
          <ul
            id="spotify-results"
            role="listbox"
            class="spotify-results-dropdown hidden"
            style="background: rgba(255,255,255,0.06); border: 2px solid hsl(270, 30%, 40%);"
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

  describe('Dropdown Container Styling', () => {
    test('should use consistent background with input fields', () => {
      const dropdownBg = window.getComputedStyle(resultsList).background;
      const inputBg = window.getComputedStyle(searchInput).background;

      expect(resultsList.style.background).toMatch(/rgba\(255,\s*255,\s*255,\s*0\.06\)/);
      expect(searchInput.style.background).toMatch(/rgba\(255,\s*255,\s*255,\s*0\.06\)/);
    });

    test('should use consistent border styling with input fields', () => {
      const dropdownBorder = resultsList.style.border;
      const inputBorder = searchInput.style.border;

      // HSL values get converted to RGB by browsers
      expect(dropdownBorder).toMatch(/2px solid/);
      expect(inputBorder).toMatch(/2px solid/);

      // Both should have the same computed color (converted from HSL)
      const dropdownColor = window.getComputedStyle(resultsList).borderColor;
      const inputColor = window.getComputedStyle(searchInput).borderColor;
      expect(dropdownColor).toBe(inputColor);
    });

    test('should have proper z-index for layering', () => {
      expect(resultsList.classList.contains('z-50')).toBe(false);
      expect(resultsList.className).toContain('spotify-results-dropdown');
    });
  });

  describe('Result Item Styling', () => {
    test('should create result items with consistent hover styling', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      const mockTrack = {
        id: 'test-track',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 1975,
        spotifyUrl: 'https://open.spotify.com/track/test',
        spotifyId: 'spotify-test',
        albumArtUrl: 'https://example.com/art.jpg'
      };

      combobox.setState({
        isOpen: true,
        results: [mockTrack]
      });

      const resultItem = resultsList.querySelector('.spotify-result-item');
      const resultContent = resultItem?.querySelector('.spotify-result-content');

      expect(resultContent?.classList.contains('hover:bg-white/5')).toBe(true);
      expect(resultContent?.classList.contains('transition-colors')).toBe(true);
      expect(resultContent?.classList.contains('px-phi-md')).toBe(true);
      expect(resultContent?.classList.contains('py-phi-sm')).toBe(true);
    });

    test('should create album art placeholder with dark theme colors', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      const mockTrackNoArt = {
        id: 'test-track-no-art',
        title: 'Test Song No Art',
        artist: 'Test Artist',
        year: 1975,
        spotifyUrl: 'https://open.spotify.com/track/test',
        spotifyId: 'spotify-test'
      };

      combobox.setState({
        isOpen: true,
        results: [mockTrackNoArt]
      });

      const placeholder = resultsList.querySelector('.bg-white\\/10');

      expect(placeholder).toBeTruthy();
      expect(placeholder?.classList.contains('text-warm-cream/50')).toBe(true);
      expect(placeholder?.textContent).toContain('🎵');
    });

    test('should apply highlighted state correctly', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      const mockTracks = [
        {
          id: 'track-1',
          title: 'Track 1',
          artist: 'Artist 1',
          spotifyUrl: 'https://open.spotify.com/track/1',
          spotifyId: 'spotify-1'
        },
        {
          id: 'track-2',
          title: 'Track 2',
          artist: 'Artist 2',
          spotifyUrl: 'https://open.spotify.com/track/2',
          spotifyId: 'spotify-2'
        }
      ];

      combobox.setState({
        isOpen: true,
        results: mockTracks,
        highlightedIndex: 1
      });

      const highlightedItem = resultsList.querySelector('.spotify-result-highlighted');
      const nonHighlightedItem = resultsList.querySelector('.spotify-result-item:not(.spotify-result-highlighted)');

      expect(highlightedItem).toBeTruthy();
      expect(nonHighlightedItem).toBeTruthy();
      expect(highlightedItem?.getAttribute('data-track-id')).toBe('track-2');
    });
  });

  describe('Text and Color Consistency', () => {
    test('should use warm-cream for primary text', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      const mockTrack = {
        id: 'text-test',
        title: 'Text Test Song',
        artist: 'Text Test Artist',
        year: 1976,
        spotifyUrl: 'https://open.spotify.com/track/test',
        spotifyId: 'spotify-test'
      };

      combobox.setState({
        isOpen: true,
        results: [mockTrack]
      });

      const titleArtist = resultsList.querySelector('.spotify-track-title-artist');
      const year = resultsList.querySelector('.spotify-track-year');

      expect(titleArtist?.classList.contains('text-warm-cream')).toBe(true);
      expect(year?.classList.contains('text-metallic-silver/70')).toBe(true);
    });

    test('should maintain proper spacing patterns', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      const mockTrack = {
        id: 'spacing-test',
        title: 'Spacing Test',
        artist: 'Test',
        spotifyUrl: 'https://open.spotify.com/track/test',
        spotifyId: 'spotify-test'
      };

      combobox.setState({
        isOpen: true,
        results: [mockTrack]
      });

      const resultContent = resultsList.querySelector('.spotify-result-content');

      expect(resultContent?.classList.contains('gap-phi-md')).toBe(true);
      expect(resultContent?.classList.contains('px-phi-md')).toBe(true);
      expect(resultContent?.classList.contains('py-phi-sm')).toBe(true);
    });
  });

  describe('Accessibility and Focus States', () => {
    test('should maintain accessibility attributes with new styling', () => {
      expect(searchInput.getAttribute('role')).toBe('combobox');
      expect(resultsList.getAttribute('role')).toBe('listbox');
      expect(searchInput.getAttribute('aria-controls')).toBe('spotify-results');
    });

    test('should handle keyboard navigation with visual feedback', async () => {
      const { SpotifyCombobox } = await import('../../src/components/spotify-combobox/SpotifyCombobox.js');
      const combobox = new SpotifyCombobox(container);

      const mockTracks = [
        { id: '1', title: 'Song 1', artist: 'Artist 1', spotifyUrl: '', spotifyId: '1' },
        { id: '2', title: 'Song 2', artist: 'Artist 2', spotifyUrl: '', spotifyId: '2' }
      ];

      combobox.setState({
        isOpen: true,
        results: mockTracks,
        highlightedIndex: 0
      });

      expect(searchInput.getAttribute('aria-activedescendant')).toBe('spotify-option-1');

      combobox.setState({ highlightedIndex: 1 });

      expect(searchInput.getAttribute('aria-activedescendant')).toBe('spotify-option-2');
    });
  });
});