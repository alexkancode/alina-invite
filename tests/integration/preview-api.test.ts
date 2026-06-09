import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/pages/api/preview.js';
import { itunesPreviewService } from '../../src/lib/itunesPreviewService.js';
import { createProductionService } from '../../src/lib/feature-flags/factory.js';

vi.mock('../../src/lib/itunesPreviewService.js', () => ({
  itunesPreviewService: {
    findPreview: vi.fn()
  }
}));

vi.mock('../../src/lib/feature-flags/factory.js', () => ({
  createProductionService: vi.fn()
}));

const findPreviewMock = vi.mocked(itunesPreviewService.findPreview);

const previewMatch = {
  previewUrl: 'https://audio.example/preview.m4a',
  matchedTitle: 'Dancing Queen',
  matchedArtist: 'ABBA'
};

describe('Preview API route', () => {
  let featureFlagService: { isEnabled: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    featureFlagService = { isEnabled: vi.fn().mockResolvedValue(true) };
    vi.mocked(createProductionService).mockReturnValue(featureFlagService as never);
  });

  it('returns 403 when the musicSearch flag is disabled and never calls the service', async () => {
    featureFlagService.isEnabled.mockResolvedValue(false);

    const response = await GET(
      new Request('http://localhost/api/preview?title=Dancing%20Queen&artist=ABBA')
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'Music search feature is disabled',
      code: 'FEATURE_DISABLED'
    });
    expect(findPreviewMock).not.toHaveBeenCalled();
  });

  it.each([
    ['missing title', 'http://localhost/api/preview?artist=ABBA'],
    ['blank title', 'http://localhost/api/preview?title=%20&artist=ABBA'],
    ['missing artist', 'http://localhost/api/preview?title=Dancing%20Queen'],
    ['blank artist', 'http://localhost/api/preview?title=Dancing%20Queen&artist=']
  ])('returns 400 for %s', async (_label, url) => {
    const response = await GET(new Request(url));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Title and artist are required');
    expect(findPreviewMock).not.toHaveBeenCalled();
  });

  it('returns the preview match for a found song', async () => {
    findPreviewMock.mockResolvedValue(previewMatch);

    const response = await GET(
      new Request('http://localhost/api/preview?title=Dancing%20Queen&artist=ABBA')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, preview: previewMatch });
    expect(findPreviewMock).toHaveBeenCalledWith('Dancing Queen', 'ABBA');
  });

  it('returns success false when no preview exists', async () => {
    findPreviewMock.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost/api/preview?title=zzz&artist=nobody')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: false, preview: null });
  });

  it('maps an unexpected service throw to success false, never a 500', async () => {
    findPreviewMock.mockRejectedValue(new Error('boom'));

    const response = await GET(
      new Request('http://localhost/api/preview?title=Dancing%20Queen&artist=ABBA')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: false, preview: null });
  });
});
