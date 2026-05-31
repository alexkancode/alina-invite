/**
 * YouTube Player Service for Music Previews
 *
 * Features:
 * - YouTube IFrame Player API integration
 * - Auto-pause after 30 seconds for previews
 * - Mobile-optimized audio-only mode
 * - Graceful fallback to external links
 * - Error handling for restricted videos
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerOptions {
  containerId: string;
  videoId: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  previewMode?: boolean; // Auto-pause after 30 seconds
  audioOnly?: boolean; // Mobile-optimized audio controls
  onReady?: () => void;
  onError?: (error: YouTubePlayerError) => void;
}

export interface YouTubePlayerError {
  code: number;
  message: string;
  videoId: string;
}

export interface YouTubeSearchResult {
  videoId: string | null;
  embedUrl: string | null;
  searchUrl: string;
}

class YouTubePlayerService {
  private apiReady: boolean = false;
  private apiLoading: boolean = false;
  private readyQueue: (() => void)[] = [];
  private players: Map<string, any> = new Map();
  private previewTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize YouTube IFrame API
   */
  async initializeAPI(): Promise<void> {
    if (this.apiReady) {
      return Promise.resolve();
    }

    if (this.apiLoading) {
      return new Promise(resolve => {
        this.readyQueue.push(resolve);
      });
    }

    this.apiLoading = true;

    return new Promise((resolve) => {
      // Load YouTube IFrame API script
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }

      // Set up API ready callback
      window.onYouTubeIframeAPIReady = () => {
        this.apiReady = true;
        this.apiLoading = false;

        // Resolve main promise
        resolve();

        // Resolve queued promises
        this.readyQueue.forEach(callback => callback());
        this.readyQueue = [];
      };

      // Fallback timeout in case API doesn't load
      setTimeout(() => {
        if (!this.apiReady) {
          console.warn('YouTube API failed to load within timeout');
          this.apiLoading = false;
          resolve();
        }
      }, 10000);
    });
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /youtube\.com\/watch\?v=([^"&?\/\s]{11})/,
      /youtu\.be\/([^"&?\/\s]{11})/,
      /youtube\.com\/embed\/([^"&?\/\s]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Create YouTube search result from song metadata
   */
  createSearchResult(title: string, artist: string): YouTubeSearchResult {
    const query = encodeURIComponent(`${title} ${artist} official`);
    const searchUrl = `https://www.youtube.com/results?search_query=${query}`;

    // For actual video ID, we'd need YouTube Data API or search scraping
    // For now, return search URL for fallback
    return {
      videoId: null,
      embedUrl: null,
      searchUrl
    };
  }

  /**
   * Create YouTube player instance
   */
  async createPlayer(options: YouTubePlayerOptions): Promise<any> {
    await this.initializeAPI();

    if (!this.apiReady || !window.YT?.Player) {
      throw new Error('YouTube API not available');
    }

    if (!options.videoId) {
      throw new Error('Video ID is required');
    }

    // Remove existing player if present
    this.destroyPlayer(options.containerId);

    const playerOptions = {
      height: options.height || (options.audioOnly ? '60' : '200'),
      width: options.width || '100%',
      videoId: options.videoId,
      playerVars: {
        autoplay: options.autoplay ? 1 : 0,
        controls: 1,
        modestbranding: 1, // Reduce YouTube branding
        rel: 0, // Don't show related videos
        enablejsapi: 1, // Enable JavaScript API
        origin: window.location.origin,
        playsinline: 1, // Important for mobile
        start: 0 // Start from beginning
      },
      events: {
        onReady: (event: any) => {
          console.log(`🎵 YouTube player ready for: ${options.videoId}`);
          if (options.onReady) {
            options.onReady();
          }
        },
        onStateChange: (event: any) => {
          this.handleStateChange(event, options);
        },
        onError: (event: any) => {
          this.handleError(event, options);
        }
      }
    };

    try {
      const player = new window.YT.Player(options.containerId, playerOptions);
      this.players.set(options.containerId, player);
      return player;
    } catch (error) {
      console.error('Failed to create YouTube player:', error);
      throw error;
    }
  }

  /**
   * Handle player state changes
   */
  private handleStateChange(event: any, options: YouTubePlayerOptions): void {
    const playerId = options.containerId;
    const player = this.players.get(playerId);

    if (!player) return;

    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        console.log(`🎵 Playing: ${options.videoId}`);

        // Clear any existing timer
        if (this.previewTimers.has(playerId)) {
          clearTimeout(this.previewTimers.get(playerId)!);
        }

        // Set preview timer if in preview mode
        if (options.previewMode) {
          const timer = setTimeout(() => {
            try {
              player.pauseVideo();
              console.log(`⏸️ Auto-paused preview after 30 seconds: ${options.videoId}`);
            } catch (error) {
              console.warn('Failed to auto-pause video:', error);
            }
          }, 30000);

          this.previewTimers.set(playerId, timer);
        }
        break;

      case window.YT.PlayerState.PAUSED:
        console.log(`⏸️ Paused: ${options.videoId}`);
        // Clear timer when manually paused
        if (this.previewTimers.has(playerId)) {
          clearTimeout(this.previewTimers.get(playerId)!);
          this.previewTimers.delete(playerId);
        }
        break;

      case window.YT.PlayerState.ENDED:
        console.log(`🏁 Ended: ${options.videoId}`);
        if (this.previewTimers.has(playerId)) {
          clearTimeout(this.previewTimers.get(playerId)!);
          this.previewTimers.delete(playerId);
        }
        break;
    }
  }

  /**
   * Handle player errors with specific error codes
   */
  private handleError(event: any, options: YouTubePlayerOptions): void {
    const errorMessages: { [key: number]: string } = {
      2: 'Invalid video ID',
      100: 'Video not found or private',
      101: 'Video embedding not allowed by owner',
      150: 'Video embedding not allowed by owner'
    };

    const error: YouTubePlayerError = {
      code: event.data,
      message: errorMessages[event.data] || 'Unknown error',
      videoId: options.videoId
    };

    console.warn(`❌ YouTube player error: ${error.message} (${error.code}) for video: ${options.videoId}`);

    if (options.onError) {
      options.onError(error);
    }
  }

  /**
   * Destroy player and clean up resources
   */
  destroyPlayer(containerId: string): void {
    const player = this.players.get(containerId);

    if (player) {
      try {
        player.destroy();
      } catch (error) {
        console.warn('Error destroying player:', error);
      }
      this.players.delete(containerId);
    }

    // Clear any preview timer
    if (this.previewTimers.has(containerId)) {
      clearTimeout(this.previewTimers.get(containerId)!);
      this.previewTimers.delete(containerId);
    }
  }

  /**
   * Check if device is mobile for audio-only optimization
   */
  isMobile(): boolean {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Get optimal player dimensions for device
   */
  getOptimalDimensions(audioOnly?: boolean): { width: string; height: string } {
    const mobile = this.isMobile();

    if (audioOnly || mobile) {
      return { width: '100%', height: '60px' }; // Audio controls only
    } else {
      return { width: '100%', height: '200px' }; // Full video
    }
  }

  /**
   * Clean up all players and timers
   */
  cleanup(): void {
    // Destroy all players
    this.players.forEach((player, containerId) => {
      this.destroyPlayer(containerId);
    });

    // Clear all timers
    this.previewTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.previewTimers.clear();
  }
}

// Export singleton instance
export const youtubePlayerService = new YouTubePlayerService();

// For testing purposes
export { YouTubePlayerService };