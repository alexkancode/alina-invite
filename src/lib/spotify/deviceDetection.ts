export interface DeviceInfo {
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  isMobile: boolean;
  hasSpotifyApp: boolean | 'unknown';
  preferredStrategy: 'app-first' | 'web-first' | 'web-only';
}

export interface DeepLinkConfig {
  timeout: number;
  fallbackDelay: number;
  retryAttempts: number;
}

export class DeviceDetectionService {
  private readonly DEFAULT_CONFIG: DeepLinkConfig = {
    timeout: 500,
    fallbackDelay: 1000,
    retryAttempts: 1
  };

  detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = this.detectPlatform(userAgent);
    const isMobile = this.isMobileDevice(userAgent);

    return {
      platform,
      isMobile,
      hasSpotifyApp: 'unknown', // Cannot reliably detect without user interaction
      preferredStrategy: this.getPreferredStrategy(platform, isMobile)
    };
  }

  private detectPlatform(userAgent: string): DeviceInfo['platform'] {
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios';
    }
    if (userAgent.includes('android')) {
      return 'android';
    }
    if (userAgent.includes('blackberry') || userAgent.includes('mobile')) {
      return 'android'; // Assume Android for unknown mobile devices
    }
    return 'desktop';
  }

  private isMobileDevice(userAgent: string): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
  }

  private getPreferredStrategy(platform: DeviceInfo['platform'], isMobile: boolean): DeviceInfo['preferredStrategy'] {
    if (!isMobile) {
      return 'web-first'; // Desktop prefers web player
    }

    switch (platform) {
      case 'android':
        return 'app-first'; // Android deep-linking is reliable
      case 'ios':
        return 'web-first'; // iOS deep-linking shows confirmation dialogs
      default:
        return 'web-only';
    }
  }

  getConfig(platform: DeviceInfo['platform']): DeepLinkConfig {
    const config = { ...this.DEFAULT_CONFIG };

    // iOS needs longer timeout due to confirmation dialogs
    if (platform === 'ios') {
      config.timeout = 1000;
      config.fallbackDelay = 1500;
    }

    return config;
  }
}

export const deviceDetection = new DeviceDetectionService();