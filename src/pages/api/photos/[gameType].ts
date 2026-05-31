import type { APIRoute } from 'astro';
import { GamePhotoManager, GameType } from '../../../lib/gameIntegration.js';

export const prerender = false;

// Fallback photos for graceful degradation
const FALLBACK_PHOTOS = {
  'disco-ball': [
    '/alina/thumbs/IMG_0049.jpeg',
    '/alina/thumbs/IMG_0539.jpeg',
    '/alina/thumbs/IMG_0736.jpeg',
    '/alina/thumbs/IMG_7205.jpeg',
    '/alina/thumbs/IMG_7380.jpeg',
    '/alina/thumbs/IMG_8370.jpeg',
    '/alina/thumbs/IMG_8625.jpeg',
    '/alina/thumbs/IMG_9286.jpeg',
    '/alina/thumbs/IMG_9477.jpeg',
    '/alina/thumbs/IMG_9532.jpeg'
  ],
  'minigame': [
    '/alina/minigame/IMG_0049.jpeg',
    '/alina/minigame/IMG_0539.jpeg',
    '/alina/minigame/IMG_0736.jpeg',
    '/alina/minigame/IMG_7205.jpeg',
    '/alina/minigame/IMG_7380.jpeg',
    '/alina/minigame/IMG_8370.jpeg',
    '/alina/minigame/IMG_8625.jpeg',
    '/alina/minigame/IMG_9286.jpeg',
    '/alina/minigame/IMG_9477.jpeg',
    '/alina/minigame/IMG_9532.jpeg'
  ]
} as const;

/**
 * Adaptive Photo Manager - Industry Standard Pattern
 * Implements Progressive Enhancement with Graceful Degradation
 * Based on Netflix/Spotify dynamic content patterns
 */
class AdaptivePhotoManager {
  private gamePhotoManager: GamePhotoManager;

  constructor() {
    this.gamePhotoManager = new GamePhotoManager();
  }

  async getPhotos(count: number, gameType: GameType, strategy: 'balanced' | 'prefer-user' | 'random' = 'balanced'): Promise<{
    photos: string[];
    metadata: {
      source: 'dynamic' | 'fallback';
      userPhotos: number;
      originalPhotos: number;
      totalAvailable: number;
      strategy: string;
      adminPhotos?: number;
    };
  }> {
    try {
      // Primary: Dynamic selection with sophisticated PhotoSelectionManager
      console.log(`📸 Attempting dynamic photo selection for ${gameType}, count: ${count}`);

      const result = await this.gamePhotoManager.selectPhotosForGame(count, gameType, strategy);

      // Count photo types for metadata
      const userPhotos = result.photos.filter(p => p.isUserPhoto).length;
      const adminPhotos = result.photos.filter(p => p.filename?.startsWith('admin-')).length;
      const originalPhotos = result.photos.length - userPhotos - adminPhotos;

      // Record success metric
      this.recordMetric('dynamic_photo_success', { gameType, count, strategy });

      console.log(`✅ Dynamic photo selection successful: ${userPhotos} user, ${adminPhotos} admin, ${originalPhotos} original`);

      return {
        photos: result.photos.map(p => `${p.path}?v=${Date.now()}`), // Cache-busting
        metadata: {
          source: 'dynamic',
          userPhotos,
          originalPhotos,
          adminPhotos,
          totalAvailable: result.totalAvailable,
          strategy: result.strategy
        }
      };

    } catch (error) {
      // Fallback: Static photos with graceful degradation
      console.warn('⚠️ Dynamic photos failed, using static fallback:', error);

      // Record fallback metric
      this.recordMetric('dynamic_photo_fallback', {
        gameType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const fallbackPhotos = FALLBACK_PHOTOS[gameType] || [];
      const requestedPhotos = fallbackPhotos.slice(0, count);

      return {
        photos: requestedPhotos.map(p => `${p}?v=${Date.now()}`),
        metadata: {
          source: 'fallback',
          userPhotos: 0,
          originalPhotos: requestedPhotos.length,
          totalAvailable: fallbackPhotos.length,
          strategy: 'fallback'
        }
      };
    }
  }

  private recordMetric(event: string, data: Record<string, any>): void {
    // Simple metrics recording - can be enhanced with proper analytics
    console.log(`📊 Metric: ${event}`, data);

    // In production, you'd send this to your analytics service:
    // analytics.track(event, data);
  }

  async close(): Promise<void> {
    await this.gamePhotoManager.close();
  }
}

export const GET: APIRoute = async ({ params, url }) => {
  const gameType = params.gameType as GameType;
  const count = parseInt(url.searchParams.get('count') || '10');
  const strategy = (url.searchParams.get('strategy') || 'balanced') as 'balanced' | 'prefer-user' | 'random';

  // Validate game type
  if (!['disco-ball', 'minigame'].includes(gameType)) {
    return new Response(JSON.stringify({
      error: 'Invalid game type. Must be "disco-ball" or "minigame"',
      validTypes: ['disco-ball', 'minigame']
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate count
  if (count < 1 || count > 100) {
    return new Response(JSON.stringify({
      error: 'Count must be between 1 and 100',
      requested: count
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let photoManager: AdaptivePhotoManager | null = null;

  try {
    photoManager = new AdaptivePhotoManager();
    const result = await photoManager.getPhotos(count, gameType, strategy);

    return new Response(JSON.stringify({
      success: true,
      photos: result.photos,
      metadata: result.metadata,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // Dynamic content shouldn't be cached
      }
    });

  } catch (error) {
    console.error('💥 Photo API error:', error);

    return new Response(JSON.stringify({
      error: 'Photo service temporarily unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });

  } finally {
    if (photoManager) {
      await photoManager.close();
    }
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};