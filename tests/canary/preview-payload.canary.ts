import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { PreviewMatch } from '../../src/lib/itunesPreviewService';
import { PreviewResolver } from '../../src/components/spotify-combobox/PreviewResolver';

const serverMatch: PreviewMatch = {
  previewUrl: 'https://audio.example/preview.m4a',
  matchedTitle: 'Dancing Queen',
  matchedArtist: 'ABBA'
};

describe('Preview payload contract canary', () => {
  beforeEach(() => {
    global.fetch = vi.fn() as never;
  });

  test('the exact body the route serializes is what the client resolver consumes', async () => {
    const routeBody = JSON.stringify({ success: true, preview: serverMatch });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(JSON.parse(routeBody))
    } as never);

    const resolver = new PreviewResolver();
    const url = await resolver.resolve('t1', 'Dancing Queen', 'ABBA');

    expect(url).toBe(serverMatch.previewUrl);
  });

  test('the not-found body resolves to null on the client', async () => {
    const routeBody = JSON.stringify({ success: false, preview: null });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(JSON.parse(routeBody))
    } as never);

    const resolver = new PreviewResolver();

    expect(await resolver.resolve('t2', 'zzz', 'nobody')).toBeNull();
  });

  test('PreviewMatch requires the fields the play flow depends on', () => {
    const required: Array<keyof PreviewMatch> = ['previewUrl', 'matchedTitle', 'matchedArtist'];

    expect(Object.keys(serverMatch).sort()).toEqual([...required].sort());
    expect(typeof serverMatch.previewUrl).toBe('string');
  });
});
