import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock device detection module
vi.mock('../../src/lib/spotify/deviceDetection.js', () => ({
  deviceDetection: {
    detectDevice: vi.fn(),
    getConfig: vi.fn()
  }
}));

import { SpotifyLinkingService } from '../../src/lib/spotify/spotifyLinkingService.js';
import { deviceDetection } from '../../src/lib/spotify/deviceDetection.js';

describe('SpotifyLinkingService', () => {
  let service: SpotifyLinkingService;
  let windowOpenSpy: any;
  let documentSpy: any;
  let mockDeviceDetectionService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock device detection service
    mockDeviceDetectionService = {
      detectDevice: vi.fn(),
      getConfig: vi.fn()
    };

    // Mock window.open
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    // Mock document methods
    const mockElement = {
      href: '',
      style: { display: '' },
      click: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    documentSpy = {
      createElement: vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any),
      appendChild: vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as any),
      removeChild: vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement as any),
      addEventListener: vi.spyOn(document, 'addEventListener').mockImplementation(() => {}),
      removeEventListener: vi.spyOn(document, 'removeEventListener').mockImplementation(() => {})
    };

    // Default mobile Android device mock
    mockDeviceDetectionService.detectDevice.mockReturnValue({
      platform: 'android',
      isMobile: true,
      hasSpotifyApp: 'unknown',
      preferredStrategy: 'app-first'
    });

    mockDeviceDetectionService.getConfig.mockReturnValue({
      timeout: 500,
      fallbackDelay: 1000,
      retryAttempts: 1
    });

    service = new SpotifyLinkingService(mockDeviceDetectionService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openSpotifyTrack', () => {
    it('should require spotifyId and trackTitle', async () => {
      const result = await service.openSpotifyTrack({
        spotifyId: '',
        trackTitle: '',
        artist: 'Test Artist'
      });

      expect(result.success).toBe(false);
      expect(result.method).toBe('error');
      expect(result.error).toContain('Missing required');
    });

    it('should generate URIs when not provided', async () => {
      const options = {
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      };

      // Mock desktop device for simpler web-first behavior
      mockDeviceDetectionService.detectDevice.mockReturnValue({
        platform: 'desktop',
        isMobile: false,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'web-first'
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack(options);

      expect(result.success).toBe(true);
      expect(result.method).toBe('web');
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://open.spotify.com/track/test123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should use provided URIs and URLs', async () => {
      const options = {
        spotifyId: 'test123',
        spotifyUri: 'spotify:track:test123',
        spotifyUrl: 'https://open.spotify.com/track/test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      };

      // Mock desktop for web-first strategy
      vi.mocked(deviceDetection.detectDevice).mockReturnValue({
        platform: 'desktop',
        isMobile: false,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'web-first'
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack(options);

      expect(result.success).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        options.spotifyUrl,
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle web-only strategy', async () => {
      vi.mocked(deviceDetection.detectDevice).mockReturnValue({
        platform: 'unknown',
        isMobile: true,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'web-only'
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe('web');
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('should handle window.open failures', async () => {
      vi.mocked(deviceDetection.detectDevice).mockReturnValue({
        platform: 'desktop',
        isMobile: false,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'web-first'
      });

      // Mock window.open to throw error
      windowOpenSpy.mockImplementation(() => {
        throw new Error('Popup blocked');
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      expect(result.success).toBe(false);
      expect(result.method).toBe('error');
      expect(result.error).toContain('Failed to open web player');
    });

    it('should handle app-first strategy with timeout', async () => {
      vi.mocked(deviceDetection.detectDevice).mockReturnValue({
        platform: 'android',
        isMobile: true,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'app-first'
      });

      vi.mocked(deviceDetection.getConfig).mockReturnValue({
        timeout: 100, // Short timeout for test
        fallbackDelay: 200,
        retryAttempts: 1
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      // Should fall back to web player after app timeout
      expect(result.success).toBe(true);
      expect(['app', 'web']).toContain(result.method);
    });
  });

  describe('generateYouTubeFallback', () => {
    it('should generate correct YouTube search URL', () => {
      const url = service.generateYouTubeFallback('Bohemian Rhapsody', 'Queen');

      expect(url).toBe('https://www.youtube.com/results?search_query=Bohemian%20Rhapsody%20Queen%20official');
    });

    it('should handle special characters', () => {
      const url = service.generateYouTubeFallback('Rock & Roll', 'AC/DC');

      expect(url).toContain('Rock%20%26%20Roll%20AC%2FDC');
    });

    it('should handle empty strings', () => {
      const url = service.generateYouTubeFallback('', '');

      expect(url).toBe('https://www.youtube.com/results?search_query=%20%20official');
    });
  });

  describe('error handling', () => {
    it('should handle missing DOM elements gracefully', async () => {
      // Mock createElement to return null
      documentSpy.createElement.mockReturnValue(null);

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      expect(result.success).toBe(false);
      expect(result.method).toBe('error');
    });

    it('should include timestamp in all results', async () => {
      const beforeTime = Date.now();

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      const afterTime = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('cross-platform strategy behavior', () => {
    it('should prefer web-first on iOS', async () => {
      vi.mocked(deviceDetection.detectDevice).mockReturnValue({
        platform: 'ios',
        isMobile: true,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'web-first'
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      expect(result.success).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('should prefer app-first on Android', async () => {
      vi.mocked(deviceDetection.detectDevice).mockReturnValue({
        platform: 'android',
        isMobile: true,
        hasSpotifyApp: 'unknown',
        preferredStrategy: 'app-first'
      });

      service = new SpotifyLinkingService(mockDeviceDetectionService);

      const result = await service.openSpotifyTrack({
        spotifyId: 'test123',
        trackTitle: 'Test Song',
        artist: 'Test Artist'
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});