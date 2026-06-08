export class AudioPreviewManager {
  private currentAudio: HTMLAudioElement | null = null;
  private playButton: HTMLButtonElement | null = null;

  async playPreview(previewUrl: string, button: HTMLButtonElement): Promise<void> {
    try {
      this.stopCurrentPreview();

      this.currentAudio = new Audio(previewUrl);
      this.playButton = button;

      button.textContent = '⏸';
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

    if (this.playButton) {
      this.playButton.textContent = '▶';
      this.playButton.disabled = false;
      this.playButton = null;
    }
  }

  private handlePreviewEnd(): void {
    this.stopCurrentPreview();
  }

  private handlePreviewError(): void {
    if (this.playButton) {
      this.playButton.textContent = '▶';
      this.playButton.disabled = false;
    }

    this.currentAudio = null;
    this.playButton = null;
  }
}