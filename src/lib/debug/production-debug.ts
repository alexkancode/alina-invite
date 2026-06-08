export class ProductionDebugger {
  private static debugMode = false;

  static enableDebug() {
    this.debugMode = typeof window !== 'undefined' &&
      (window.location.search.includes('debug=true') ||
       localStorage.getItem('spotify-debug') === 'true');
    return this.debugMode;
  }

  static log(component: string, message: string, data?: any) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[SPOTIFY-DEBUG ${timestamp}] ${component}: ${message}`, data || '');
    }
  }

  static logElementState(element: Element | null, description: string) {
    if (this.debugMode && element) {
      this.log('DOM', `${description}`, {
        exists: !!element,
        display: (element as HTMLElement).style.display,
        className: element.className,
        id: element.id
      });
    }
  }

  static logFeatureFlag(flagName: string, value: boolean) {
    if (this.debugMode) {
      this.log('FeatureFlag', `${flagName} = ${value}`);
    }
  }

  static logEnvironmentCheck() {
    if (this.debugMode) {
      this.log('Environment', 'Checking Spotify environment variables', {
        hasSpotifyClientId: !!import.meta.env.PUBLIC_SPOTIFY_CLIENT_ID,
        hasSpotifyClientSecret: !!import.meta.env.SPOTIFY_CLIENT_SECRET
      });
    }
  }
}