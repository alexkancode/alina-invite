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

  test('natural completion dispatches a bubbling preview-ended event with reason ended', async () => {
    const reasons: string[] = [];
    document.body.addEventListener('preview-ended', e => reasons.push((e as CustomEvent).detail.reason));

    await manager.playPreview('https://a.example/p.m4a', button);
    FakeAudio.instances[0].emit('ended');

    expect(reasons).toEqual(['ended']);
  });

  test('manual stop dispatches preview-ended with reason stopped', async () => {
    const reasons: string[] = [];
    document.body.addEventListener('preview-ended', e => reasons.push((e as CustomEvent).detail.reason));

    await manager.playPreview('https://a.example/p.m4a', button);
    manager.stopCurrentPreview();

    expect(reasons).toEqual(['stopped']);
  });

  test('a playback error dispatches preview-ended with reason error', async () => {
    const reasons: string[] = [];
    document.body.addEventListener('preview-ended', e => reasons.push((e as CustomEvent).detail.reason));

    await manager.playPreview('https://a.example/p.m4a', button);
    FakeAudio.instances[0].emit('error');

    expect(reasons).toEqual(['error']);
  });

  test('takeover by a second play dispatches stopped on the first button only', async () => {
    const events: Array<{ reason: string; target: EventTarget | null }> = [];
    document.body.addEventListener('preview-ended', e =>
      events.push({ reason: (e as CustomEvent).detail.reason, target: e.target }));

    const second = document.createElement('button');
    second.textContent = '▶';
    document.body.appendChild(second);

    await manager.playPreview('https://a.example/one.m4a', button);
    await manager.playPreview('https://a.example/two.m4a', second);

    expect(events).toHaveLength(1);
    expect(events[0].reason).toBe('stopped');
    expect(events[0].target).toBe(button);
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
