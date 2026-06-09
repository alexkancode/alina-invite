export class AudioPreviewManager {
  private currentAudio: HTMLAudioElement | null = null;
  private playButton: HTMLButtonElement | null = null;

  async playPreview(previewUrl: string, button: HTMLButtonElement): Promise<void> {
    try {
      this.stopCurrentPreview();

      this.currentAudio = new Audio(previewUrl);
      this.playButton = button;

      button.textContent = '⏸';
      button.dataset.previewState = 'playing';
      button.disabled = true;

      this.currentAudio.addEventListener('ended', () => this.handlePreviewEnd());
      this.currentAudio.addEventListener('error', () => this.handlePreviewError());

      await this.currentAudio.play();
      button.disabled = false;

    } catch (error) {
      this.handlePreviewError();
      throw new Error('Preview playback failed');
    }
  }

  stopCurrentPreview(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    this.release('stopped');
  }

  private handlePreviewEnd(): void {
    this.currentAudio = null;
    this.release('ended');
  }

  private handlePreviewError(): void {
    this.currentAudio = null;
    this.release('error');
  }

  private release(reason: 'ended' | 'stopped' | 'error'): void {
    if (!this.playButton) {
      return;
    }

    const button = this.playButton;
    this.playButton = null;
    button.textContent = '▶';
    button.dataset.previewState = 'idle';
    button.disabled = false;
    button.dispatchEvent(new CustomEvent('preview-ended', { bubbles: true, detail: { reason } }));
  }
}

export const audioPreviewManager = new AudioPreviewManager();