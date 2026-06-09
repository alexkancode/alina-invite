import type { PreviewPlaybackController } from '../spotify-combobox/PreviewPlaybackController.js';

type EndReason = 'ended' | 'stopped' | 'error';

export class PlayAllController {
  private container: HTMLElement;
  private trigger: HTMLButtonElement;
  private playbackController: PreviewPlaybackController;
  private idleLabel: string;
  private queue: HTMLButtonElement[] = [];
  private current: HTMLButtonElement | null = null;

  constructor(
    container: HTMLElement,
    trigger: HTMLButtonElement,
    playbackController: PreviewPlaybackController
  ) {
    this.container = container;
    this.trigger = trigger;
    this.playbackController = playbackController;
    this.idleLabel = trigger.textContent || 'Play all';
    this.trigger.dataset.playlistState = 'idle';
    this.container.addEventListener('preview-ended', this.handlePreviewEnded.bind(this) as EventListener);
  }

  toggle(): void {
    if (this.trigger.dataset.playlistState === 'running') {
      this.stop();
      return;
    }
    this.start();
  }

  private start(): void {
    this.queue = Array.from(this.container.querySelectorAll<HTMLButtonElement>('.guest-song-play'));
    if (this.queue.length === 0) {
      return;
    }
    this.trigger.dataset.playlistState = 'running';
    this.trigger.textContent = 'Stop';
    void this.playNext();
  }

  private async playNext(): Promise<void> {
    const next = this.queue.shift();
    if (!next) {
      this.reset();
      return;
    }

    this.current = next;
    await this.playbackController.handlePlayClick(next);

    if (this.trigger.dataset.playlistState !== 'running') {
      return;
    }
    if (next.dataset.previewState !== 'playing') {
      this.current = null;
      void this.playNext();
    }
  }

  private handlePreviewEnded(event: Event): void {
    if (this.trigger.dataset.playlistState !== 'running') {
      return;
    }
    if (event.target !== this.current) {
      return;
    }

    const { reason } = (event as CustomEvent<{ reason: EndReason }>).detail;
    this.current = null;

    if (reason === 'stopped') {
      this.reset();
      return;
    }
    void this.playNext();
  }

  private stop(): void {
    const playing = this.current;
    this.reset();
    if (playing && playing.dataset.previewState === 'playing') {
      void this.playbackController.handlePlayClick(playing);
    }
  }

  private reset(): void {
    this.queue = [];
    this.current = null;
    this.trigger.dataset.playlistState = 'idle';
    this.trigger.textContent = this.idleLabel;
  }
}
