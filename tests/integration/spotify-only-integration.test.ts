import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../../src/pages/api/music-search.js';

// Mock the Spotify client
vi.mock('../../src/lib/spotify/client.js', () => ({
  SpotifyClient: vi.fn().mockImplementation(() => ({
    searchTracks: vi.fn()
  }))
}));

// Mock the feature flag service
vi.mock('../../src/lib/feature-flags/factory.js', () => ({
  createProductionService: vi.fn(() => ({
    isEnabled: vi.fn()
  }))
}));

describe('Spotify-Only Music Search Integration', () => {
  let mockFeatureFlagService: any;
  let mockSpotifyClient: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup feature flag service mock
    const { createProductionService } = await import('../../src/lib/feature-flags/factory.js');
    mockFeatureFlagService = {
      isEnabled: vi.fn()
    };
    vi.mocked(createProductionService).mockReturnValue(mockFeatureFlagService);

    // Setup Spotify client mock
    const { SpotifyClient } = await import('../../src/lib/spotify/client.js');
    mockSpotifyClient = {
      searchTracks: vi.fn()
    };
    vi.mocked(SpotifyClient).mockImplementation(() => mockSpotifyClient);
  });

  describe('Feature Flag Protection', () => {
    it('should return 403 when music search feature is disabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);

      const request = new Request('http://localhost/api/music-search?q=queen');
      const response = await GET(request);

      expect(response.status).toBe(403);

      const result = await response.json();
      expect(result).toEqual({
        error: 'Music search feature is disabled',
        code: 'FEATURE_DISABLED'
      });

      expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('musicSearch');
    });
  });

  describe('Query Validation', () => {
    beforeEach(() => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    });

    it('should return 400 for missing query parameter', async () => {
      const request = new Request('http://localhost/api/music-search');
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toBe('Search query is required');
    });

    it('should return 400 for empty query parameter', async () => {
      const request = new Request('http://localhost/api/music-search?q=');
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toBe('Search query is required');
    });

    it('should return 400 for whitespace-only query parameter', async () => {
      const request = new Request('http://localhost/api/music-search?q=%20%20%20');
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toBe('Search query is required');
    });
  });

  describe('Successful Spotify Search', () => {
    beforeEach(() => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    });

    it('should return Spotify search results for valid query', async () => {
      const mockSongs = [
        {
          id: 'spotify-123',
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          year: 1975,
          source: 'spotify',
          spotifyId: 'spotify-123',
          previewUrl: 'https://example.com/preview.mp3',
          albumArtUrl: 'https://example.com/album.jpg',
          popularity: 90,
          explicit: false
        }
      ];

      mockSpotifyClient.searchTracks.mockResolvedValue(mockSongs);

      const request = new Request('http://localhost/api/music-search?q=bohemian%20rhapsody');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toEqual({
        success: true,
        songs: mockSongs,
        source: 'spotify',
        totalFound: 1,
        cached: false
      });

      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith(
        'bohemian rhapsody year:1970-1979',
        15
      );
    });

    it('should respect maxResults parameter', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      const request = new Request('http://localhost/api/music-search?q=queen&maxResults=5');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith(
        'queen year:1970-1979',
        5
      );
    });

    it('should default to 15 maxResults when parameter not provided', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      const request = new Request('http://localhost/api/music-search?q=queen');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalledWith(
        'queen year:1970-1979',
        15
      );
    });

    it('should handle empty Spotify results gracefully', async () => {
      mockSpotifyClient.searchTracks.mockResolvedValue([]);

      const request = new Request('http://localhost/api/music-search?q=unknown%20song');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toEqual({
        success: true,
        songs: [],
        source: 'spotify',
        totalFound: 0,
        cached: false
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    });

    it('should handle Spotify API errors gracefully', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Spotify API error'));

      const request = new Request('http://localhost/api/music-search?q=queen');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toEqual({
        success: false,
        songs: [],
        source: 'error',
        totalFound: 0,
        error: 'Music search temporarily unavailable',
        cached: false
      });
    });

    it('should handle authentication errors', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Authentication failed'));

      const request = new Request('http://localhost/api/music-search?q=queen');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Music search temporarily unavailable');
    });

    it('should handle network timeout errors', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Network timeout'));

      const request = new Request('http://localhost/api/music-search?q=queen');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Music search temporarily unavailable');
    });
  });

  describe('Parameter Simplification', () => {
    beforeEach(() => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockSpotifyClient.searchTracks.mockResolvedValue([]);
    });

    it('should ignore legacy includeSpotify parameter', async () => {
      const request = new Request('http://localhost/api/music-search?q=queen&includeSpotify=false');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalled();
    });

    it('should ignore legacy spotifyPrimary parameter', async () => {
      const request = new Request('http://localhost/api/music-search?q=queen&spotifyPrimary=false');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalled();
    });

    it('should ignore legacy includeFallback parameter', async () => {
      const request = new Request('http://localhost/api/music-search?q=queen&includeFallback=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSpotifyClient.searchTracks).toHaveBeenCalled();
    });
  });

  describe('Response Format Consistency', () => {
    beforeEach(() => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    });

    it('should maintain consistent response format for success', async () => {
      const mockSongs = [
        {
          id: 'test-id',
          title: 'Test Song',
          artist: 'Test Artist',
          year: 1975,
          source: 'spotify',
          spotifyId: 'test-id'
        }
      ];

      mockSpotifyClient.searchTracks.mockResolvedValue(mockSongs);

      const request = new Request('http://localhost/api/music-search?q=test');
      const response = await GET(request);

      const result = await response.json();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('songs');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('totalFound');
      expect(result).toHaveProperty('cached');

      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.songs)).toBe(true);
      expect(typeof result.source).toBe('string');
      expect(typeof result.totalFound).toBe('number');
      expect(typeof result.cached).toBe('boolean');
    });

    it('should maintain consistent response format for errors', async () => {
      mockSpotifyClient.searchTracks.mockRejectedValue(new Error('Test error'));

      const request = new Request('http://localhost/api/music-search?q=test');
      const response = await GET(request);

      const result = await response.json();

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('songs', []);
      expect(result).toHaveProperty('source', 'error');
      expect(result).toHaveProperty('totalFound', 0);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('cached', false);
    });
  });
});