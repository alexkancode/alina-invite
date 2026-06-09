import { beforeEach, describe, expect, test } from 'vitest';
import { SpotifyCombobox } from '../../src/components/spotify-combobox/SpotifyCombobox';
import type { SpotifyTrack } from '../../src/components/spotify-combobox/types';

const createDOM = (): HTMLElement => {
  document.body.innerHTML = `
    <div data-testid="spotify-combobox">
      <div class="spotify-dynamic-container">
        <div class="spotify-input-wrapper relative">
          <input type="text" id="spotify-search" role="combobox" />
          <ul id="spotify-results" role="listbox"></ul>
        </div>
        <div class="spotify-selected-container hidden"></div>
        <input type="hidden" name="favoriteSong" id="favoriteSong-value" />
      </div>
    </div>
  `;
  return document.querySelector('[data-testid="spotify-combobox"]') as HTMLElement;
};

const createTrack = (): SpotifyTrack => ({
  id: 'track-1',
  title: 'Dancing Queen',
  artist: 'ABBA',
  year: 1976,
  albumArtUrl: 'https://i.scdn.co/image/cover.jpg',
  spotifyUrl: 'https://open.spotify.com/track/track-1',
  spotifyId: 'track-1'
});

describe('SpotifyCombobox selected state', () => {
  let container: HTMLElement;
  let combobox: SpotifyCombobox;
  let searchInput: HTMLInputElement;
  let hiddenInput: HTMLInputElement;
  let inputWrapper: HTMLElement;
  let selectedContainer: HTMLElement;

  beforeEach(() => {
    container = createDOM();
    combobox = new SpotifyCombobox(container);
    searchInput = container.querySelector('#spotify-search') as HTMLInputElement;
    hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    inputWrapper = container.querySelector('.spotify-input-wrapper') as HTMLElement;
    selectedContainer = container.querySelector('.spotify-selected-container') as HTMLElement;
  });

  describe('selecting a track', () => {
    test('renders the selected card using the dropdown row content', () => {
      combobox.selectTrack(createTrack());

      const card = selectedContainer.querySelector('.spotify-selected-card');
      expect(card).not.toBeNull();
      expect(card!.querySelector('.spotify-result-content')).not.toBeNull();
      expect(card!.textContent).toContain('Dancing Queen');
      expect(card!.textContent).toContain('ABBA');
      expect(card!.textContent).toContain('1976');
      expect(card!.querySelector('img')?.getAttribute('src')).toBe('https://i.scdn.co/image/cover.jpg');
    });

    test('shows the selected container and hides the input wrapper', () => {
      combobox.selectTrack(createTrack());

      expect(selectedContainer.classList.contains('hidden')).toBe(false);
      expect(inputWrapper.classList.contains('hidden')).toBe(true);
    });

    test('renders a clear button', () => {
      combobox.selectTrack(createTrack());

      const clearButton = selectedContainer.querySelector('button[aria-label="Clear selected song"]');
      expect(clearButton).not.toBeNull();
    });

    test('clears the visible search input and stores the track JSON in the hidden field', () => {
      combobox.selectTrack(createTrack());

      expect(searchInput.value).toBe('');
      expect(JSON.parse(hiddenInput.value)).toMatchObject({
        title: 'Dancing Queen',
        artist: 'ABBA',
        year: 1976,
        spotifyUrl: 'https://open.spotify.com/track/track-1',
        spotifyId: 'track-1'
      });
    });

    test('dispatches a bubbling change event for form change detection', () => {
      let changeCount = 0;
      container.addEventListener('change', () => changeCount++);

      combobox.selectTrack(createTrack());

      expect(changeCount).toBe(1);
    });
  });

  describe('clearing the selection', () => {
    beforeEach(() => {
      combobox.selectTrack(createTrack());
    });

    test('clear button returns the combobox to the editable state', () => {
      const clearButton = selectedContainer.querySelector(
        'button[aria-label="Clear selected song"]'
      ) as HTMLButtonElement;
      clearButton.click();

      expect(selectedContainer.classList.contains('hidden')).toBe(true);
      expect(selectedContainer.innerHTML).toBe('');
      expect(inputWrapper.classList.contains('hidden')).toBe(false);
      expect(hiddenInput.value).toBe('');
      expect(searchInput.value).toBe('');
      expect(combobox.getState().selectedTrack).toBeNull();
    });

    test('clear button focuses the restored input', () => {
      const clearButton = selectedContainer.querySelector(
        'button[aria-label="Clear selected song"]'
      ) as HTMLButtonElement;
      clearButton.click();

      expect(document.activeElement).toBe(searchInput);
    });

    test('clear button dispatches a bubbling change event', () => {
      let changeCount = 0;
      container.addEventListener('change', () => changeCount++);

      const clearButton = selectedContainer.querySelector(
        'button[aria-label="Clear selected song"]'
      ) as HTMLButtonElement;
      clearButton.click();

      expect(changeCount).toBe(1);
    });
  });

  describe('highlight navigation DOM reuse', () => {
    const createTracks = (count: number): SpotifyTrack[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `track-${i}`,
        title: `Song ${i}`,
        artist: `Artist ${i}`,
        year: 1970 + i,
        spotifyUrl: `https://open.spotify.com/track/track-${i}`,
        spotifyId: `track-${i}`
      }));

    test('moving the highlight reuses the existing dropdown rows', () => {
      combobox.setState({ results: createTracks(5), isOpen: true, highlightedIndex: 0 });
      const rowsBefore = Array.from(container.querySelectorAll('#spotify-results li'));

      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      const rowsAfter = Array.from(container.querySelectorAll('#spotify-results li'));
      expect(rowsAfter).toHaveLength(5);
      rowsAfter.forEach((row, i) => expect(row).toBe(rowsBefore[i]));
    });

    test('moving the highlight updates the highlighted class and aria-activedescendant', () => {
      combobox.setState({ results: createTracks(5), isOpen: true, highlightedIndex: 0 });

      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      const rows = container.querySelectorAll('#spotify-results li');
      expect(rows[0].classList.contains('spotify-result-highlighted')).toBe(false);
      expect(rows[1].classList.contains('spotify-result-highlighted')).toBe(true);
      expect(searchInput.getAttribute('aria-activedescendant')).toBe('spotify-option-track-1');
    });

    test('new results still trigger a full rebuild', () => {
      combobox.setState({ results: createTracks(5), isOpen: true, highlightedIndex: 0 });
      const rowsBefore = Array.from(container.querySelectorAll('#spotify-results li'));

      combobox.setState({ results: createTracks(3), isOpen: true, highlightedIndex: -1 });

      const rowsAfter = Array.from(container.querySelectorAll('#spotify-results li'));
      expect(rowsAfter).toHaveLength(3);
      expect(rowsAfter[0]).not.toBe(rowsBefore[0]);
    });
  });

  describe('blur race protection', () => {
    test('result item mousedown is default-prevented so the input never blurs mid-click', () => {
      combobox.setState({ results: [createTrack()], isOpen: true });
      const item = container.querySelector('#spotify-results li') as HTMLLIElement;
      expect(item).not.toBeNull();

      const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      item.dispatchEvent(mousedown);

      expect(mousedown.defaultPrevented).toBe(true);
    });
  });
});
