import type { PreviewResolver } from './PreviewResolver.js';
import type { AudioPreviewManager } from './AudioPreviewManager.js';

const UNAVAILABLE_CLASS = 'spotify-preview-unavailable';
const PLAYING_GLYPH = '⏸';

export class PreviewPlaybackController {
  private resolver: PreviewResolver;
  private audioManager: AudioPreviewManager;

  constructor(resolver: PreviewResolver, audioManager: AudioPreviewManager) {
    this.resolver = resolver;
    this.audioManager = audioManager;
  }

  async handlePlayClick(button: HTMLButtonElement): Promise<void> {
    if (button.classList.contains(UNAVAILABLE_CLASS)) {
      return;
    }

    if (button.textContent?.trim() === PLAYING_GLYPH) {
      this.audioManager.stopCurrentPreview();
      return;
    }

    const previewUrl = await this.resolvePreviewUrl(button);
    if (!previewUrl) {
      this.markUnavailable(button);
      return;
    }

    try {
      await this.audioManager.playPreview(previewUrl, button);
    } catch {
      button.disabled = false;
    }
  }

  private async resolvePreviewUrl(button: HTMLButtonElement): Promise<string | null> {
    if (button.dataset.previewUrl) {
      return button.dataset.previewUrl;
    }

    const { trackId, title, artist } = button.dataset;
    if (!trackId || !title || !artist) {
      return null;
    }

    button.disabled = true;
    const previewUrl = await this.resolver.resolve(trackId, title, artist);
    button.disabled = false;

    if (previewUrl) {
      button.dataset.previewUrl = previewUrl;
    }
    return previewUrl;
  }

  private markUnavailable(button: HTMLButtonElement): void {
    button.classList.add(UNAVAILABLE_CLASS);
    button.disabled = true;
  }
}
