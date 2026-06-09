import type { PreviewMatch } from '../../lib/itunesPreviewService.js';

interface PreviewResponse {
  success: boolean;
  preview: PreviewMatch | null;
}

export class PreviewResolver {
  private cache = new Map<string, string | null>();

  async resolve(trackId: string, title: string, artist: string): Promise<string | null> {
    if (this.cache.has(trackId)) {
      return this.cache.get(trackId) as string | null;
    }

    const previewUrl = await this.requestPreview(title, artist);
    this.cache.set(trackId, previewUrl);
    return previewUrl;
  }

  private async requestPreview(title: string, artist: string): Promise<string | null> {
    try {
      const response = await fetch(
        `/api/preview?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
      );
      if (!response.ok) {
        return null;
      }

      const data: PreviewResponse = await response.json();
      return data.success && data.preview ? data.preview.previewUrl : null;
    } catch {
      return null;
    }
  }
}
