import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AudioPreviewManager } from '../../src/components/spotify-combobox/AudioPreviewManager';

class FakeAudio {
  static instances: FakeAudio[] = [];
  listeners = new Map<string, () => void>();
  paused = false;
  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
  addEventListener(event: string, handler: () => void) {
    this.listeners.set(event, handler);
  }
  play() {
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  emit(event: string) {
    this.listeners.get(event)?.();
  }
}

describe('AudioPreviewManager preview state attribute', () => {
  let manager: AudioPreviewManager;
  let button: HTMLButtonElement;

  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio);
    manager = new AudioPreviewManager();
    button = document.createElement('button');
    button.textContent = '▶';
    document.body.appendChild(button);
  });

  test('playing marks the button with data-preview-state=playing', async () => {
    await manager.playPreview('https://a.example/p.m4a', button);

    expect(button.dataset.previewState).toBe('playing');
    expect(button.textContent).toBe('⏸');
  });

  test('stopping resets the state to idle and the glyph to play', async () => {
    await manager.playPreview('https://a.example/p.m4a', button);

    manager.stopCurrentPreview();

    expect(button.dataset.previewState).toBe('idle');
    expect(button.textContent).toBe('▶');
  });

  test('the preview ending resets the state to idle', async () => {
    await manager.playPreview('https://a.example/p.m4a', button);

    FakeAudio.instances[0].emit('ended');

    expect(button.dataset.previewState).toBe('idle');
  });

  test('a playback error resets the state to idle', async () => {
    await manager.playPreview('https://a.example/p.m4a', button);

    FakeAudio.instances[0].emit('error');

    expect(button.dataset.previewState).toBe('idle');
  });

  test('playing a second button idles the first', async () => {
    const second = document.createElement('button');
    second.textContent = '▶';
    document.body.appendChild(second);

    await manager.playPreview('https://a.example/one.m4a', button);
    await manager.playPreview('https://a.example/two.m4a', second);

    expect(button.dataset.previewState).toBe('idle');
    expect(second.dataset.previewState).toBe('playing');
  });
});
