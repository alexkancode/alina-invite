import { deviceDetection, type DeviceInfo, type DeepLinkConfig } from './deviceDetection.js';

export interface SpotifyLinkOptions {
  spotifyId: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  trackTitle: string;
  artist: string;
}

export interface SpotifyLinkResult {
  success: boolean;
  method: 'app' | 'web' | 'fallback' | 'error';
  url?: string;
  error?: string;
  timestamp: number;
}

export class SpotifyLinkingService {
  private deviceInfo: DeviceInfo;
  private config: DeepLinkConfig;

  constructor(deviceDetectionService = deviceDetection) {
    this.deviceInfo = deviceDetectionService.detectDevice();
    this.config = deviceDetectionService.getConfig(this.deviceInfo.platform);
  }

  async openSpotifyTrack(options: SpotifyLinkOptions): Promise<SpotifyLinkResult> {
    const timestamp = Date.now();

    try {
      // Validate required data
      if (!options.spotifyId || !options.trackTitle) {
        throw new Error('Missing required Spotify track data');
      }

      // Generate URLs if not provided
      const spotifyUri = options.spotifyUri || `spotify:track:${options.spotifyId}`;
      const spotifyUrl = options.spotifyUrl || `https://open.spotify.com/track/${options.spotifyId}`;

      // Execute strategy based on device capabilities
      switch (this.deviceInfo.preferredStrategy) {
        case 'app-first':
          return await this.tryAppFirst(spotifyUri, spotifyUrl, timestamp);
        case 'web-first':
          return await this.tryWebFirst(spotifyUrl, spotifyUri, timestamp);
        case 'web-only':
          return await this.openWebPlayer(spotifyUrl, timestamp);
        default:
          throw new Error('Unknown linking strategy');
      }
    } catch (error) {
      return {
        success: false,
        method: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      };
    }
  }

  private async tryAppFirst(spotifyUri: string, fallbackUrl: string, timestamp: number): Promise<SpotifyLinkResult> {
    try {
      // Attempt app deep-link
      const appResult = await this.attemptAppOpen(spotifyUri);
      if (appResult.success) {
        return { ...appResult, timestamp };
      }

      // Fallback to web player
      return await this.openWebPlayer(fallbackUrl, timestamp);
    } catch (error) {
      // Ultimate fallback
      return await this.openWebPlayer(fallbackUrl, timestamp);
    }
  }

  private async tryWebFirst(spotifyUrl: string, spotifyUri: string, timestamp: number): Promise<SpotifyLinkResult> {
    try {
      return await this.openWebPlayer(spotifyUrl, timestamp);
    } catch (error) {
      // Fallback to app if web fails
      const appResult = await this.attemptAppOpen(spotifyUri);
      return { ...appResult, timestamp };
    }
  }

  private async attemptAppOpen(spotifyUri: string): Promise<SpotifyLinkResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let resolved = false;

      // Create invisible link element
      const link = document.createElement('a');
      if (!link) {
        resolve({
          success: false,
          method: 'app',
          error: 'Failed to create link element'
        });
        return;
      }

      link.href = spotifyUri;
      link.style.display = 'none';
      document.body.appendChild(link);

      // Track page visibility changes (app opened if page becomes hidden)
      const handleVisibilityChange = () => {
        if (document.hidden && !resolved) {
          resolved = true;
          cleanup();
          resolve({
            success: true,
            method: 'app',
            url: spotifyUri
          });
        }
      };

      // Cleanup function
      const cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (link && document.body.contains(link)) {
          document.body.removeChild(link);
        }
        clearTimeout(timeoutId);
      };

      // Set timeout for fallback
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            success: false,
            method: 'app',
            error: 'App open timeout'
          });
        }
      }, this.config.timeout);

      // Listen for visibility change (indicates app opened)
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Trigger deep-link
      try {
        link.click();
      } catch (error) {
        resolved = true;
        cleanup();
        resolve({
          success: false,
          method: 'app',
          error: 'Deep-link failed'
        });
      }
    });
  }

  private async openWebPlayer(spotifyUrl: string, timestamp: number): Promise<SpotifyLinkResult> {
    try {
      window.open(spotifyUrl, '_blank', 'noopener,noreferrer');

      return {
        success: true,
        method: 'web',
        url: spotifyUrl,
        timestamp
      };
    } catch (error) {
      throw new Error(`Failed to open web player: ${error}`);
    }
  }

  // Utility method to generate fallback YouTube URL
  generateYouTubeFallback(trackTitle: string, artist: string): string {
    const query = encodeURIComponent(`${trackTitle} ${artist} official`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }
}

// Export factory function to create instance when needed
export const createSpotifyLinkingService = () => new SpotifyLinkingService();

// Default instance for convenience (lazy-loaded)
let defaultInstance: SpotifyLinkingService | null = null;
export const spotifyLinking = {
  getInstance: () => {
    if (!defaultInstance) {
      defaultInstance = new SpotifyLinkingService();
    }
    return defaultInstance;
  }
};