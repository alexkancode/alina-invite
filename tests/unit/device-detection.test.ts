import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeviceDetectionService } from '../../src/lib/spotify/deviceDetection.js';

describe('DeviceDetectionService', () => {
  let service: DeviceDetectionService;
  let originalUserAgent: string;

  beforeEach(() => {
    service = new DeviceDetectionService();
    originalUserAgent = navigator.userAgent;
  });

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: originalUserAgent
    });
  });

  describe('detectDevice', () => {
    it('should detect iOS platform correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      });

      const result = service.detectDevice();

      expect(result.platform).toBe('ios');
      expect(result.isMobile).toBe(true);
      expect(result.preferredStrategy).toBe('web-first');
      expect(result.hasSpotifyApp).toBe('unknown');
    });

    it('should detect Android platform correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36'
      });

      const result = service.detectDevice();

      expect(result.platform).toBe('android');
      expect(result.isMobile).toBe(true);
      expect(result.preferredStrategy).toBe('app-first');
    });

    it('should detect desktop platform correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const result = service.detectDevice();

      expect(result.platform).toBe('desktop');
      expect(result.isMobile).toBe(false);
      expect(result.preferredStrategy).toBe('web-first');
    });

    it('should handle unknown mobile devices as Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0'
      });

      const result = service.detectDevice();

      expect(result.platform).toBe('android');
      expect(result.isMobile).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return default config for Android', () => {
      const config = service.getConfig('android');

      expect(config.timeout).toBe(500);
      expect(config.fallbackDelay).toBe(1000);
      expect(config.retryAttempts).toBe(1);
    });

    it('should return extended timeout for iOS', () => {
      const config = service.getConfig('ios');

      expect(config.timeout).toBe(1000);
      expect(config.fallbackDelay).toBe(1500);
      expect(config.retryAttempts).toBe(1);
    });

    it('should return default config for desktop', () => {
      const config = service.getConfig('desktop');

      expect(config.timeout).toBe(500);
      expect(config.fallbackDelay).toBe(1000);
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle iPad as iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      });

      const result = service.detectDevice();

      expect(result.platform).toBe('ios');
      expect(result.isMobile).toBe(true);
    });

    it('should handle BlackBerry as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+'
      });

      const result = service.detectDevice();

      expect(result.isMobile).toBe(true);
      expect(result.platform).toBe('android');
    });

    it('should handle empty user agent gracefully', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: ''
      });

      const result = service.detectDevice();

      expect(result.platform).toBe('desktop');
      expect(result.isMobile).toBe(false);
      expect(result.preferredStrategy).toBe('web-first');
    });
  });
});