import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PreviewResolver } from '../../src/components/spotify-combobox/PreviewResolver';
import { PreviewPlaybackController } from '../../src/components/spotify-combobox/PreviewPlaybackController';

describe('PreviewResolver', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let resolver: PreviewResolver;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as never;
    resolver = new PreviewResolver();
  });

  test('requests the preview endpoint with encoded title and artist', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, preview: { previewUrl: 'https://a.example/p.m4a' } })
    });

    await resolver.resolve('t1', "Stayin' Alive", 'Bee Gees');

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe(`/api/preview?title=${encodeURIComponent("Stayin' Alive")}&artist=${encodeURIComponent('Bee Gees')}`);
  });

  test('returns the preview url on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, preview: { previewUrl: 'https://a.example/p.m4a' } })
    });

    expect(await resolver.resolve('t1', 'Dancing Queen', 'ABBA')).toBe('https://a.example/p.m4a');
  });

  test('returns null when the endpoint reports no preview', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, preview: null })
    });

    expect(await resolver.resolve('t1', 'zzz', 'nobody')).toBeNull();
  });

  test('returns null on a failed request without throwing', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(await resolver.resolve('t1', 'Dancing Queen', 'ABBA')).toBeNull();
  });

  test('caches results per track id, including misses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, preview: { previewUrl: 'https://a.example/p.m4a' } })
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, preview: null })
    });

    await resolver.resolve('hit', 'Dancing Queen', 'ABBA');
    await resolver.resolve('hit', 'Dancing Queen', 'ABBA');
    await resolver.resolve('miss', 'zzz', 'nobody');
    await resolver.resolve('miss', 'zzz', 'nobody');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('PreviewPlaybackController', () => {
  let resolver: { resolve: ReturnType<typeof vi.fn> };
  let audioManager: { playPreview: ReturnType<typeof vi.fn>; stopCurrentPreview: ReturnType<typeof vi.fn> };
  let controller: PreviewPlaybackController;
  let button: HTMLButtonElement;

  const createButton = () => {
    const el = document.createElement('button');
    el.className = 'spotify-play-button';
    el.dataset.trackId = 't1';
    el.dataset.title = 'Dancing Queen';
    el.dataset.artist = 'ABBA';
    el.textContent = '▶';
    document.body.appendChild(el);
    return el;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    resolver = { resolve: vi.fn() };
    audioManager = { playPreview: vi.fn().mockResolvedValue(undefined), stopCurrentPreview: vi.fn() };
    controller = new PreviewPlaybackController(resolver as never, audioManager as never);
    button = createButton();
  });

  test('resolves and plays on first click', async () => {
    resolver.resolve.mockResolvedValue('https://a.example/p.m4a');

    await controller.handlePlayClick(button);

    expect(resolver.resolve).toHaveBeenCalledWith('t1', 'Dancing Queen', 'ABBA');
    expect(audioManager.playPreview).toHaveBeenCalledWith('https://a.example/p.m4a', button);
  });

  test('disables the button while resolving and re-enables after', async () => {
    let observedDisabled = false;
    resolver.resolve.mockImplementation(async () => {
      observedDisabled = button.disabled;
      return 'https://a.example/p.m4a';
    });

    await controller.handlePlayClick(button);

    expect(observedDisabled).toBe(true);
    expect(button.disabled).toBe(false);
  });

  test('plays directly from data-preview-url without resolving', async () => {
    button.dataset.previewUrl = 'https://a.example/known.m4a';

    await controller.handlePlayClick(button);

    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(audioManager.playPreview).toHaveBeenCalledWith('https://a.example/known.m4a', button);
  });

  test('stores the resolved url on the button for later clicks', async () => {
    resolver.resolve.mockResolvedValue('https://a.example/p.m4a');

    await controller.handlePlayClick(button);

    expect(button.dataset.previewUrl).toBe('https://a.example/p.m4a');
  });

  test('marks the button unavailable when no preview exists', async () => {
    resolver.resolve.mockResolvedValue(null);

    await controller.handlePlayClick(button);

    expect(button.classList.contains('spotify-preview-unavailable')).toBe(true);
    expect(button.disabled).toBe(true);
    expect(audioManager.playPreview).not.toHaveBeenCalled();
  });

  test('an unavailable button ignores further clicks', async () => {
    resolver.resolve.mockResolvedValue(null);
    await controller.handlePlayClick(button);

    await controller.handlePlayClick(button);

    expect(resolver.resolve).toHaveBeenCalledTimes(1);
  });

  test('clicking a playing button stops playback instead of replaying', async () => {
    button.dataset.previewUrl = 'https://a.example/p.m4a';
    button.textContent = '⏸';

    await controller.handlePlayClick(button);

    expect(audioManager.stopCurrentPreview).toHaveBeenCalled();
    expect(audioManager.playPreview).not.toHaveBeenCalled();
  });

  test('a playback error leaves the button usable', async () => {
    resolver.resolve.mockResolvedValue('https://a.example/p.m4a');
    audioManager.playPreview.mockRejectedValue(new Error('autoplay blocked'));

    await controller.handlePlayClick(button);

    expect(button.disabled).toBe(false);
    expect(button.classList.contains('spotify-preview-unavailable')).toBe(false);
  });
});
