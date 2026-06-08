import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SpotifyTrack } from '../../../src/components/spotify-combobox/types.js';

describe('AudioPreviewManager', () => {
  let mockButton: HTMLButtonElement;
  let mockAudio: any;

  beforeEach(() => {
    mockButton = document.createElement('button');
    mockButton.textContent = '▶';

    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    global.Audio = vi.fn(() => mockAudio);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Preview Playback', () => {
    test('should play preview when valid URL provided', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      const previewUrl = 'https://example.com/preview.mp3';

      await manager.playPreview(previewUrl, mockButton);

      expect(global.Audio).toHaveBeenCalledWith(previewUrl);
      expect(mockAudio.play).toHaveBeenCalled();
      expect(mockButton.textContent).toBe('⏸');
    });

    test('should stop current preview before playing new one', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      const firstUrl = 'https://example.com/first.mp3';
      const secondUrl = 'https://example.com/second.mp3';

      const firstButton = document.createElement('button');
      firstButton.textContent = '▶';

      await manager.playPreview(firstUrl, firstButton);

      const firstAudio = mockAudio;
      global.Audio = vi.fn(() => {
        return {
          play: vi.fn().mockResolvedValue(undefined),
          pause: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        };
      });

      await manager.playPreview(secondUrl, mockButton);

      expect(firstAudio.pause).toHaveBeenCalled();
    });

    test('should handle audio playback errors gracefully', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      mockAudio.play.mockRejectedValueOnce(new Error('Playback failed'));

      await expect(manager.playPreview('https://example.com/bad.mp3', mockButton))
        .rejects.toThrow('Preview playback failed');

      expect(mockButton.textContent).toBe('▶');
      expect(mockButton.disabled).toBe(false);
    });

    test('should reset button state when preview ends', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      let endedCallback: () => void = () => {};
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === 'ended') {
          endedCallback = callback;
        }
      });

      await manager.playPreview('https://example.com/preview.mp3', mockButton);

      expect(mockButton.textContent).toBe('⏸');

      endedCallback();

      expect(mockButton.textContent).toBe('▶');
      expect(mockButton.disabled).toBe(false);
    });

    test('should stop current preview when requested', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      await manager.playPreview('https://example.com/preview.mp3', mockButton);

      expect(mockButton.textContent).toBe('⏸');

      manager.stopCurrentPreview();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockButton.textContent).toBe('▶');
      expect(mockButton.disabled).toBe(false);
    });

    test('should handle multiple stop calls safely', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      manager.stopCurrentPreview();
      manager.stopCurrentPreview();

      expect(() => manager.stopCurrentPreview()).not.toThrow();
    });
  });

  describe('Button State Management', () => {
    test('should disable button during loading', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      let playResolve: () => void;
      mockAudio.play.mockImplementation(() => {
        return new Promise(resolve => {
          playResolve = resolve;
        });
      });

      const playPromise = manager.playPreview('https://example.com/preview.mp3', mockButton);

      expect(mockButton.disabled).toBe(true);
      expect(mockButton.textContent).toBe('⏸');

      playResolve!();
      await playPromise;

      expect(mockButton.disabled).toBe(false);
    });

    test('should maintain button reference for cleanup', async () => {
      const { AudioPreviewManager } = await import('../../../src/components/spotify-combobox/AudioPreviewManager.js');
      const manager = new AudioPreviewManager();

      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      button1.textContent = '▶';
      button2.textContent = '▶';

      await manager.playPreview('https://example.com/first.mp3', button1);

      expect(button1.textContent).toBe('⏸');

      await manager.playPreview('https://example.com/second.mp3', button2);

      expect(button1.textContent).toBe('▶');
      expect(button1.disabled).toBe(false);
      expect(button2.textContent).toBe('⏸');
    });
  });
});