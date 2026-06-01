import { randomBytes } from 'crypto';
import { batchProcessTilesWithOverlays } from './overlayProcessor';
import { getGamePhotos, type GamePhotoManager, type PhotoInfo } from './gameIntegration';
import { getOverlaySettings } from './overlayDatabase';

export interface DiscoBallTileData {
  id: string;
  type: 'photo' | 'iridescent';
  imagePath: string;
  photoInfo?: PhotoInfo;
  position: number;
  overlayApplied?: boolean;
  overlayId?: string;
}

export interface DiscoBallConfig {
  radius: number;
  tileSize: number;
  gameType: string;
  enableOverlays: boolean;
  sessionId?: string;
}

export interface DiscoBallGenerationResult {
  tiles: DiscoBallTileData[];
  sessionId: string;
  overlaysProcessed: number;
  processingTime: number;
  cacheKey: string;
}

/**
 * Generate disco ball tiles with overlay support
 * Integrates with existing photo selection system from gameIntegration.ts
 */
export async function generateDiscoBallWithOverlays(
  config: DiscoBallConfig
): Promise<DiscoBallGenerationResult> {
  const startTime = Date.now();
  const sessionId = config.sessionId || randomBytes(16).toString('hex');
  const { radius, tileSize, gameType, enableOverlays } = config;

  try {
    // Calculate number of tiles using existing disco ball geometry
    const tileCount = calculateDiscoBallTileCount(radius, tileSize);

    // Get photos using existing photo selection system
    const gamePhotoManager = new GamePhotoManager(gameType);
    const photoData = await getGamePhotos(gamePhotoManager, tileCount);

    // Generate tile configurations
    const tiles: DiscoBallTileData[] = [];
    const tileConfigs: Array<{
      baseImagePath: string;
      outputPath: string;
      photoId?: string;
      tilePosition: number;
    }> = [];

    for (let i = 0; i < tileCount; i++) {
      const tileId = `${sessionId}-tile-${i}`;
      const isPhotoTile = Math.random() < 0.7; // 70% photos, 30% iridescent

      let tile: DiscoBallTileData;

      if (isPhotoTile && photoData.photos.length > 0) {
        // Use photo tile
        const photo = photoData.photos[i % photoData.photos.length];
        const imagePath = `/public/${gameType}/photos/${photo.filename}`;
        const outputPath = `/public/${gameType}/disco-tiles/${tileId}.jpg`;

        tile = {
          id: tileId,
          type: 'photo',
          imagePath: outputPath,
          photoInfo: photo,
          position: i
        };

        if (enableOverlays) {
          tileConfigs.push({
            baseImagePath: imagePath,
            outputPath: outputPath,
            photoId: photo.filename,
            tilePosition: i
          });
        }
      } else {
        // Use iridescent tile
        const outputPath = `/public/${gameType}/disco-tiles/${tileId}.jpg`;

        tile = {
          id: tileId,
          type: 'iridescent',
          imagePath: outputPath,
          position: i
        };

        if (enableOverlays) {
          // Generate iridescent base image
          const iridescentPath = await generateIridescentTile(tileSize, tileId);
          tileConfigs.push({
            baseImagePath: iridescentPath,
            outputPath: outputPath,
            tilePosition: i
          });
        }
      }

      tiles.push(tile);
    }

    let overlaysProcessed = 0;

    if (enableOverlays && tileConfigs.length > 0) {
      // Get overlay settings to check if overlays are enabled
      const settings = await getOverlaySettings();

      if (settings.overlay_probability > 0) {
        // Process tiles with overlays in batches
        const overlayResults = await batchProcessTilesWithOverlays(
          tileConfigs,
          sessionId,
          tileSize
        );

        // Update tile data with overlay information
        for (let i = 0; i < overlayResults.length; i++) {
          const result = overlayResults[i];
          if (result.success && result.overlayUsed) {
            tiles[i].overlayApplied = true;
            tiles[i].overlayId = result.overlayUsed.id;
            overlaysProcessed++;
          }
        }
      }
    }

    const cacheKey = generateCacheKey(config, overlaysProcessed);

    return {
      tiles,
      sessionId,
      overlaysProcessed,
      processingTime: Date.now() - startTime,
      cacheKey
    };

  } catch (error) {
    console.error('Disco ball generation with overlays failed:', error);
    throw error;
  }
}

/**
 * Calculate number of tiles for disco ball geometry
 * Based on existing disco ball implementation
 */
function calculateDiscoBallTileCount(radius: number, tileSize: number): number {
  const gapFactor = 1.2;
  let totalTiles = 0;

  // Calculate latitude rings (matching existing disco ball algorithm)
  const numLatRings = Math.floor((Math.PI * radius) / (tileSize * gapFactor));
  const latStep = Math.PI / numLatRings;

  for (let i = 0; i < numLatRings; i++) {
    const phi = latStep / 2 + i * latStep;
    const ringRadius = radius * Math.sin(phi);
    const numTilesInRing = Math.max(2, Math.floor((2 * Math.PI * ringRadius) / (tileSize * gapFactor)));
    totalTiles += numTilesInRing;
  }

  return totalTiles;
}

/**
 * Generate iridescent tile base image
 */
async function generateIridescentTile(tileSize: number, tileId: string): Promise<string> {
  // This would generate a gradient or iridescent pattern
  // For now, return a placeholder path that should be implemented
  // based on your existing iridescent tile generation logic

  const colors = [
    '#ff6b9d', '#c44569', '#f8b500', '#f18701',
    '#3742fa', '#2f3542', '#ff3838', '#ff9ff3',
    '#7bed9f', '#70a1ff', '#5352ed', '#ff4757'
  ];

  const color = colors[Math.floor(Math.random() * colors.length)];
  const outputPath = `/tmp/iridescent-${tileId}.jpg`;

  // TODO: Implement actual iridescent tile generation
  // This should create a gradient or pattern image
  // For now, this is a placeholder

  return outputPath;
}

/**
 * Generate cache key for disco ball configuration
 */
function generateCacheKey(config: DiscoBallConfig, overlaysProcessed: number): string {
  const configString = JSON.stringify({
    radius: config.radius,
    tileSize: config.tileSize,
    gameType: config.gameType,
    enableOverlays: config.enableOverlays,
    overlaysProcessed
  });

  return Buffer.from(configString).toString('base64').slice(0, 16);
}

/**
 * Create disco ball tiles for frontend rendering
 * Converts tile data to format expected by existing disco ball JS
 */
export function createDiscoBallTileElements(
  tiles: DiscoBallTileData[],
  radius: number,
  tileSize: number
): Array<{
  element: string;
  transform: string;
  background: string;
  overlayClass?: string;
}> {
  const elements: Array<{
    element: string;
    transform: string;
    background: string;
    overlayClass?: string;
  }> = [];

  // Calculate tile positions using existing disco ball geometry
  const gapFactor = 1.2;
  const numLatRings = Math.floor((Math.PI * radius) / (tileSize * gapFactor));
  const latStep = Math.PI / numLatRings;

  let tileIndex = 0;

  for (let latRing = 0; latRing < numLatRings && tileIndex < tiles.length; latRing++) {
    const phi = latStep / 2 + latRing * latStep;
    const ringRadius = radius * Math.sin(phi);
    const numTilesInRing = Math.max(2, Math.floor((2 * Math.PI * ringRadius) / (tileSize * gapFactor)));
    const lonStep = (2 * Math.PI) / numTilesInRing;

    for (let ringTile = 0; ringTile < numTilesInRing && tileIndex < tiles.length; ringTile++) {
      const tile = tiles[tileIndex];
      const theta = ringTile * lonStep;

      // Calculate 3D transform (matching existing disco ball implementation)
      const rotateY = (theta * 180) / Math.PI;
      const rotateX = (phi * 180) / Math.PI - 90;
      const translateZ = radius;

      const transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(${translateZ}px)`;
      const background = `url('${tile.imagePath}')`;
      const overlayClass = tile.overlayApplied ? 'disco-tile-overlay-applied' : undefined;

      elements.push({
        element: `<div class="disco-tile ${tile.type}-tile ${overlayClass || ''}" data-tile-id="${tile.id}"></div>`,
        transform,
        background,
        overlayClass
      });

      tileIndex++;
    }
  }

  return elements;
}

/**
 * Preload disco ball images for smooth rendering
 */
export async function preloadDiscoBallImages(tiles: DiscoBallTileData[]): Promise<void> {
  const imagePromises = tiles.map(tile => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load ${tile.imagePath}`));
      img.src = tile.imagePath;
    });
  });

  try {
    await Promise.all(imagePromises);
  } catch (error) {
    console.warn('Some disco ball images failed to preload:', error);
    // Continue anyway - images will load on demand
  }
}