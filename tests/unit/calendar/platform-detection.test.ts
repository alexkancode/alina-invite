import { describe, it, expect, beforeEach, vi } from 'vitest';

// Platform detection tests for mobile calendar integration
// Ensures accurate device and browser identification for calendar optimization

describe('Platform Detection Service', () => {
  // Mock navigator and window objects for testing
  const mockNavigator = {
    userAgent: '',
    platform: ''
  };

  const mockWindow = {
    innerWidth: 1024
  };

  beforeEach(() => {
    vi.stubGlobal('navigator', mockNavigator);
    vi.stubGlobal('window', mockWindow);
  });

  describe('iOS Safari Detection', () => {
    it('should detect iPhone Safari correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
      mockNavigator.platform = 'iPhone';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.os).toBe('ios');
      expect(result.browser).toBe('safari');
      expect(result.supportsDeepLinking).toBe(true);
      expect(result.requiresSafariOptimizations).toBe(true);
    });

    it('should detect iPad Safari correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
      mockNavigator.platform = 'iPad';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.os).toBe('ios');
      expect(result.browser).toBe('safari');
      expect(result.supportsDeepLinking).toBe(true);
    });
  });

  describe('Android Detection', () => {
    it('should detect Android Chrome correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 12; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36';
      mockNavigator.platform = 'Linux armv81';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.os).toBe('android');
      expect(result.browser).toBe('chrome');
      expect(result.supportsDeepLinking).toBe(true);
      expect(result.requiresIntentHandling).toBe(true);
    });
  });

  describe('Desktop Detection', () => {
    it('should detect desktop browsers correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36';
      mockNavigator.platform = 'Win32';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.os).toBe('desktop');
      expect(result.supportsDeepLinking).toBe(false);
      expect(result.preferStandardDownload).toBe(true);
    });
  });

  describe('Browser Version Detection', () => {
    it('should extract Safari version correctly', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.version).toBe('15.0');
    });

    it('should handle missing version gracefully', () => {
      mockNavigator.userAgent = 'Unknown Browser';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.version).toBe('unknown');
    });
  });

  describe('Feature Support Detection', () => {
    it('should correctly identify deep linking support', () => {
      // iOS case
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
      let result = require('../../../src/lib/platformDetectionService.js').detectPlatform();
      expect(result.supportsDeepLinking).toBe(true);

      // Android case
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36';
      result = require('../../../src/lib/platformDetectionService.js').detectPlatform();
      expect(result.supportsDeepLinking).toBe(true);

      // Desktop case
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      result = require('../../../src/lib/platformDetectionService.js').detectPlatform();
      expect(result.supportsDeepLinking).toBe(false);
    });

    it('should identify Safari-specific optimizations needed', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

      const { detectPlatform } = require('../../../src/lib/platformDetectionService.js');
      const result = detectPlatform();

      expect(result.requiresSafariOptimizations).toBe(true);
      expect(result.avoidTargetBlank).toBe(true);
      expect(result.requiresCursorPointer).toBe(true);
    });
  });
});