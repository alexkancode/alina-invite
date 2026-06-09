import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../../src/pages/api/music-search.js';
import { spotifyMusicService } from '../../src/lib/spotifyMusicService.js';
import { createProductionService } from '../../src/lib/feature-flags/factory.js';
import { SpotifyClient } from '../../src/lib/spotify/client.js';

vi.mock('../../src/lib/spotifyMusicService.js', () => ({
  spotifyMusicService: {
    searchMusic: vi.fn()
  }
}));

vi.mock('../../src/lib/feature-flags/factory.js', () => ({
  createProductionService: vi.fn()
}));

vi.mock('../../src/lib/spotify/client.js', () => ({
  SpotifyClient: vi.fn()
}));

const searchMusicMock = vi.mocked(spotifyMusicService.searchMusic);

const successResult = {
  success: true,
  songs: [
    {
      id: 'spotify-123',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      year: 1975,
      source: 'spotify',
      spotifyId: 'spotify-123',
      previewUrl: 'https://example.com/preview.mp3',
      albumArtUrl: 'https://example.com/album.jpg'
    }
  ],
  source: 'spotify',
  totalFound: 1,
  cached: false
};

describe('Music search route', () => {
  let featureFlagService: { isEnabled: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    featureFlagService = { isEnabled: vi.fn().mockResolvedValue(true) };
    vi.mocked(createProductionService).mockReturnValue(featureFlagService as never);
  });

  describe('feature flag protection', () => {
    it('returns 403 when music search is disabled and never calls the service', async () => {
      featureFlagService.isEnabled.mockResolvedValue(false);

      const response = await GET(new Request('http://localhost/api/music-search?q=queen'));

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: 'Music search feature is disabled',
        code: 'FEATURE_DISABLED'
      });
      expect(featureFlagService.isEnabled).toHaveBeenCalledWith('musicSearch');
      expect(searchMusicMock).not.toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    it.each([
      ['missing', 'http://localhost/api/music-search'],
      ['empty', 'http://localhost/api/music-search?q='],
      ['whitespace-only', 'http://localhost/api/music-search?q=%20%20%20']
    ])('returns 400 for a %s query parameter', async (_label, url) => {
      const response = await GET(new Request(url));

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe('Search query is required');
      expect(searchMusicMock).not.toHaveBeenCalled();
    });
  });

  describe('search delegation', () => {
    it('returns the service result verbatim for a valid query', async () => {
      searchMusicMock.mockResolvedValue(successResult as never);

      const response = await GET(
        new Request('http://localhost/api/music-search?q=bohemian%20rhapsody')
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(successResult);
      expect(searchMusicMock).toHaveBeenCalledWith('bohemian rhapsody', 15);
    });

    it('passes an explicit maxResults through to the service', async () => {
      searchMusicMock.mockResolvedValue(successResult as never);

      await GET(new Request('http://localhost/api/music-search?q=queen&maxResults=5'));

      expect(searchMusicMock).toHaveBeenCalledWith('queen', 5);
    });

    it.each([
      ['includeSpotify', 'q=queen&includeSpotify=false'],
      ['spotifyPrimary', 'q=queen&spotifyPrimary=false'],
      ['includeFallback', 'q=queen&includeFallback=true']
    ])('ignores the legacy %s parameter', async (_param, queryString) => {
      searchMusicMock.mockResolvedValue(successResult as never);

      const response = await GET(
        new Request(`http://localhost/api/music-search?${queryString}`)
      );

      expect(response.status).toBe(200);
      expect(searchMusicMock).toHaveBeenCalledTimes(1);
      expect(searchMusicMock).toHaveBeenCalledWith('queen', 15);
    });
  });

  describe('error handling', () => {
    it('maps an unexpected service throw to a stable error body', async () => {
      searchMusicMock.mockRejectedValue(new Error('boom'));

      const response = await GET(new Request('http://localhost/api/music-search?q=queen'));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: false,
        songs: [],
        error: 'Search service temporarily unavailable',
        source: 'error'
      });
    });
  });
});

describe('SpotifyMusicService', () => {
  type ServiceModule = typeof import('../../src/lib/spotifyMusicService.js');

  let searchTracks: ReturnType<typeof vi.fn>;

  const createService = async () => {
    const { SpotifyMusicService } =
      await vi.importActual<ServiceModule>('../../src/lib/spotifyMusicService.js');
    return new SpotifyMusicService('client-id', 'client-secret');
  };

  const errorWithCode = (code: string) => {
    const error = new Error(code) as Error & { code: string };
    error.code = code;
    return error;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    searchTracks = vi.fn();
    vi.mocked(SpotifyClient).mockImplementation(() => ({ searchTracks }) as never);
  });

  it('passes the query through unscoped with the default maxResults', async () => {
    searchTracks.mockResolvedValue([]);
    const service = await createService();

    await service.searchMusic('queen');

    expect(searchTracks).toHaveBeenCalledWith('queen', 15);
  });

  it('passes an explicit maxResults to the client', async () => {
    searchTracks.mockResolvedValue([]);
    const service = await createService();

    await service.searchMusic('queen', 5);

    expect(searchTracks).toHaveBeenCalledWith('queen', 5);
  });

  it('returns tracks from any era without filtering', async () => {
    searchTracks.mockResolvedValue([
      { id: '1', title: 'Seventies', artist: 'A', year: 1975 },
      { id: '2', title: 'Sixties', artist: 'B', year: 1969 },
      { id: '3', title: 'Modern', artist: 'C', year: 2024 },
      { id: '4', title: 'No Year', artist: 'D' }
    ]);
    const service = await createService();

    const result = await service.searchMusic('test');

    expect(result.success).toBe(true);
    expect(result.songs.map(s => s.id)).toEqual(['1', '2', '3', '4']);
    expect(result.totalFound).toBe(4);
  });

  it('rejects a blank query without calling the client', async () => {
    const service = await createService();

    const result = await service.searchMusic('   ');

    expect(result).toMatchObject({ success: false, source: 'error', error: 'Search query is required' });
    expect(searchTracks).not.toHaveBeenCalled();
  });

  it.each([
    ['AUTH_FAILED', 'Music search authentication failed'],
    ['MAX_RETRIES_EXCEEDED', 'Music search service temporarily unavailable'],
    ['MISSING_CLIENT_ID', 'Music search not configured - missing credentials'],
    ['ANYTHING_ELSE', 'Music search temporarily unavailable']
  ])('maps a %s client failure to its error message', async (code, message) => {
    searchTracks.mockRejectedValue(errorWithCode(code));
    const service = await createService();

    const result = await service.searchMusic('queen');

    expect(result).toEqual({
      success: false,
      songs: [],
      source: 'error',
      totalFound: 0,
      error: message,
      cached: false
    });
  });

  it('serves a repeated query from cache without a second client call', async () => {
    searchTracks.mockResolvedValue([
      { id: '1', title: 'Cached Song', artist: 'A', year: 1975 }
    ]);
    const service = await createService();

    const first = await service.searchMusic('queen', 10);
    const second = await service.searchMusic('queen', 10);

    expect(searchTracks).toHaveBeenCalledTimes(1);
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.songs).toEqual(first.songs);
  });
});
