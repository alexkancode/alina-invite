export interface PreviewMatch {
  previewUrl: string;
  matchedTitle: string;
  matchedArtist: string;
}

interface ITunesTrack {
  trackName?: string;
  artistName?: string;
  previewUrl?: string;
}

interface CacheEntry {
  data: PreviewMatch | null;
  timestamp: number;
}

export interface ITunesPreviewOptions {
  cacheTimeout?: number;
}

export class ITunesPreviewService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TIMEOUT_MS: number;
  private readonly SEARCH_URL = 'https://itunes.apple.com/search';

  constructor(options: ITunesPreviewOptions = {}) {
    this.CACHE_TIMEOUT_MS = options.cacheTimeout || 60 * 60 * 1000;
  }

  async findPreview(title: string, artist: string): Promise<PreviewMatch | null> {
    const cacheKey = this.cacheKey(title, artist);
    const cached = this.getFromCache(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const match = await this.lookup(title, artist);
    this.cache.set(cacheKey, { data: match, timestamp: Date.now() });
    return match;
  }

  private async lookup(title: string, artist: string): Promise<PreviewMatch | null> {
    try {
      const params = new URLSearchParams({
        term: `${title} ${artist}`,
        media: 'music',
        entity: 'song',
        limit: '5'
      });

      const response = await fetch(`${this.SEARCH_URL}?${params}`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.pickBestMatch(data.results || [], artist);
    } catch {
      return null;
    }
  }

  private pickBestMatch(results: ITunesTrack[], artist: string): PreviewMatch | null {
    const playable = results.filter(r => typeof r.previewUrl === 'string' && r.previewUrl);
    if (playable.length === 0) {
      return null;
    }

    const requested = this.normalize(artist);
    const artistMatch = playable.find(r => {
      const candidate = this.normalize(r.artistName || '');
      return candidate.includes(requested) || requested.includes(candidate);
    });

    const best = artistMatch || playable[0];
    return {
      previewUrl: best.previewUrl as string,
      matchedTitle: best.trackName || '',
      matchedArtist: best.artistName || ''
    };
  }

  private cacheKey(title: string, artist: string): string {
    return `${this.normalize(title)}|${this.normalize(artist)}`;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private getFromCache(key: string): PreviewMatch | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.CACHE_TIMEOUT_MS) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }
}

export const itunesPreviewService = new ITunesPreviewService();
