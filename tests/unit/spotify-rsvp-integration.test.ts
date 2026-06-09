import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SpotifyCombobox } from '../../src/components/spotify-combobox/SpotifyCombobox';
import type { SpotifyTrack } from '../../src/components/spotify-combobox/types';

// Mock DOM elements
const createMockDOM = () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <div data-testid="spotify-combobox">
      <div class="spotify-input-wrapper relative">
        <input type="text" id="spotify-search" role="combobox" />
        <div id="spotify-results" role="listbox"></div>
      </div>
      <div class="spotify-selected-container hidden"></div>
      <input type="hidden" name="favoriteSong" id="favoriteSong-value" />
    </div>
  `;
  document.body.appendChild(container);
  return container;
};

const createMockTrack = (): SpotifyTrack => ({
  id: 'test-track-id',
  title: 'Dancing Queen',
  artist: 'ABBA',
  year: 1976,
  albumArtUrl: 'https://i.scdn.co/image/test.jpg',
  previewUrl: 'https://preview.spotify.com/test.mp3',
  spotifyUrl: 'https://open.spotify.com/track/test-track-id',
  spotifyId: 'test-track-id'
});

describe('SpotifyCombobox RSVP Integration', () => {
  let container: HTMLElement;
  let combobox: SpotifyCombobox;
  let hiddenInput: HTMLInputElement;
  let searchInput: HTMLInputElement;

  beforeEach(() => {
    // Clear any existing DOM
    document.body.innerHTML = '';

    // Create fresh DOM
    container = createMockDOM();

    // Get elements
    hiddenInput = container.querySelector('[name="favoriteSong"]') as HTMLInputElement;
    searchInput = container.querySelector('#spotify-search') as HTMLInputElement;

    // Initialize combobox
    combobox = new SpotifyCombobox(container.querySelector('[data-testid="spotify-combobox"]') as HTMLElement);
  });

  describe('Song Selection', () => {
    test('selectTrack should update hidden field with complete song data', () => {
      const track = createMockTrack();

      combobox.selectTrack(track);

      const hiddenValue = hiddenInput.value;
      expect(hiddenValue).toBeTruthy();

      const parsedData = JSON.parse(hiddenValue);
      expect(parsedData.title).toBe('Dancing Queen');
      expect(parsedData.artist).toBe('ABBA');
      expect(parsedData.year).toBe(1976);
      expect(parsedData.spotifyId).toBe('test-track-id');
    });

    test('selectTrack should include Spotify URL in saved data', () => {
      const track = createMockTrack();

      combobox.selectTrack(track);

      const parsedData = JSON.parse(hiddenInput.value);
      expect(parsedData.spotifyUrl).toBe('https://open.spotify.com/track/test-track-id');
    });

    test('selectTrack should render the selected card instead of input text', () => {
      const track = createMockTrack();

      combobox.selectTrack(track);

      expect(searchInput.value).toBe('');
      const card = container.querySelector('.spotify-selected-card');
      expect(card).not.toBeNull();
      expect(card!.textContent).toContain('Dancing Queen');
      expect(card!.textContent).toContain('ABBA');
    });

    test('selectTrack should dispatch change event on hidden field', () => {
      const track = createMockTrack();
      const changeListener = vi.fn();
      hiddenInput.addEventListener('change', changeListener);

      combobox.selectTrack(track);

      expect(changeListener).toHaveBeenCalled();
    });

    test('clicking result item should trigger selection', () => {
      const track = createMockTrack();

      // Create a result item (simplified version of the actual method)
      const resultItem = document.createElement('li');
      resultItem.className = 'spotify-result-item';
      resultItem.innerHTML = `<div>${track.title} - ${track.artist}</div>`;
      resultItem.addEventListener('click', () => {
        combobox.selectTrack(track);
      });

      // Simulate click
      resultItem.click();

      // Verify selection occurred
      expect(hiddenInput.value).toContain(track.title);
      expect(container.querySelector('.spotify-selected-card')?.textContent).toContain(track.title);
    });
  });

  describe('Clear Selection', () => {
    test('selectTrack with null should clear hidden field', () => {
      // First select a track
      const track = createMockTrack();
      combobox.selectTrack(track);
      expect(hiddenInput.value).toBeTruthy();

      // Then clear it
      combobox.selectTrack(null);

      expect(hiddenInput.value).toBe('');
      expect(searchInput.value).toBe('');
    });
  });

  describe('Data Validation', () => {
    test('should handle tracks with missing optional fields', () => {
      const incompleteTrack: SpotifyTrack = {
        id: 'incomplete-track',
        title: 'Test Song',
        artist: 'Test Artist',
        year: 2023,
        albumArtUrl: '',
        previewUrl: '',
        spotifyUrl: 'https://open.spotify.com/track/incomplete-track',
        spotifyId: 'incomplete-track'
      };

      combobox.selectTrack(incompleteTrack);

      const parsedData = JSON.parse(hiddenInput.value);
      expect(parsedData.title).toBe('Test Song');
      expect(parsedData.artist).toBe('Test Artist');
      expect(parsedData.spotifyUrl).toBe('https://open.spotify.com/track/incomplete-track');
    });

    test('saved JSON should be parseable', () => {
      const track = createMockTrack();

      combobox.selectTrack(track);

      expect(() => {
        JSON.parse(hiddenInput.value);
      }).not.toThrow();
    });
  });
});