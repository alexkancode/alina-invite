import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ITunesPreviewService } from '../../src/lib/itunesPreviewService';

const itunesResult = (trackName: string, artistName: string, previewUrl: string) => ({
  trackName,
  artistName,
  previewUrl
});

const okResponse = (results: unknown[]) => ({
  ok: true,
  json: () => Promise.resolve({ resultCount: results.length, results })
});

describe('ITunesPreviewService', () => {
  let service: ITunesPreviewService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as never;
    service = new ITunesPreviewService();
  });

  test('queries iTunes with the song term and music entity params', async () => {
    fetchMock.mockResolvedValue(okResponse([]));

    await service.findPreview('Dancing Queen', 'ABBA');

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://itunes.apple.com/search');
    expect(url.searchParams.get('term')).toBe('Dancing Queen ABBA');
    expect(url.searchParams.get('media')).toBe('music');
    expect(url.searchParams.get('entity')).toBe('song');
  });

  test('returns the preview whose artist matches the request over an earlier mismatch', async () => {
    fetchMock.mockResolvedValue(okResponse([
      itunesResult('Dancing Queen', 'Karaoke Stars', 'https://p.example/karaoke.m4a'),
      itunesResult('Dancing Queen', 'ABBA', 'https://p.example/abba.m4a')
    ]));

    const match = await service.findPreview('Dancing Queen', 'ABBA');

    expect(match).toEqual({
      previewUrl: 'https://p.example/abba.m4a',
      matchedTitle: 'Dancing Queen',
      matchedArtist: 'ABBA'
    });
  });

  test('falls back to the first result when no artist matches', async () => {
    fetchMock.mockResolvedValue(okResponse([
      itunesResult('Dancing Queen (Cover)', 'Tribute Band', 'https://p.example/first.m4a'),
      itunesResult('Dancing Queen (Live)', 'Other Band', 'https://p.example/second.m4a')
    ]));

    const match = await service.findPreview('Dancing Queen', 'ABBA');

    expect(match?.previewUrl).toBe('https://p.example/first.m4a');
  });

  test('ignores candidates without a previewUrl', async () => {
    fetchMock.mockResolvedValue(okResponse([
      { trackName: 'Dancing Queen', artistName: 'ABBA' },
      itunesResult('Dancing Queen', 'ABBA', 'https://p.example/playable.m4a')
    ]));

    const match = await service.findPreview('Dancing Queen', 'ABBA');

    expect(match?.previewUrl).toBe('https://p.example/playable.m4a');
  });

  test('returns null when iTunes has no results', async () => {
    fetchMock.mockResolvedValue(okResponse([]));

    expect(await service.findPreview('zzz no such song', 'nobody')).toBeNull();
  });

  test('returns null on a non-OK response without throwing', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    expect(await service.findPreview('Dancing Queen', 'ABBA')).toBeNull();
  });

  test('returns null on a network failure without throwing', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(await service.findPreview('Dancing Queen', 'ABBA')).toBeNull();
  });

  test('caches a found preview so a repeat lookup makes no second request', async () => {
    fetchMock.mockResolvedValue(okResponse([
      itunesResult('Dancing Queen', 'ABBA', 'https://p.example/abba.m4a')
    ]));

    const first = await service.findPreview('Dancing Queen', 'ABBA');
    const second = await service.findPreview('dancing queen', 'abba');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  test('caches a miss so unknown songs are not re-queried', async () => {
    fetchMock.mockResolvedValue(okResponse([]));

    await service.findPreview('zzz', 'nobody');
    await service.findPreview('zzz', 'nobody');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
