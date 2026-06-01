import sharp from 'sharp';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { getRandomActiveOverlay, getOverlaySettings, recordOverlayUsage, type OverlayImage } from './overlayDatabase';

export interface OverlayProcessingOptions {
  baseImagePath: string;
  outputPath: string;
  tileSize: number;
  sessionId: string;
  tilePosition: number;
  photoId?: string;
}

export interface OverlayResult {
  success: boolean;
  outputPath: string;
  overlayUsed?: OverlayImage;
  processingTime: number;
  error?: string;
}

/**
 * Process a disco ball tile with random overlay
 */
export async function processDiscoBallTileWithOverlay(options: OverlayProcessingOptions): Promise<OverlayResult> {
  const startTime = Date.now();
  const {
    baseImagePath,
    outputPath,
    tileSize,
    sessionId,
    tilePosition,
    photoId
  } = options;

  try {
    // Get overlay settings to determine if we should apply overlay
    const settings = await getOverlaySettings();

    // Check if we should apply overlay based on probability and settings
    const shouldApplyOverlay = Math.random() < settings.overlay_probability;
    const isPhotoTile = !!photoId;
    const shouldProcessThisTileType = isPhotoTile
      ? settings.overlay_on_photos
      : settings.overlay_on_iridescent;

    if (!shouldApplyOverlay || !shouldProcessThisTileType) {
      // Just resize the base image without overlay
      await sharp(baseImagePath)
        .resize(tileSize, tileSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      return {
        success: true,
        outputPath,
        processingTime: Date.now() - startTime
      };
    }

    // Get random overlay
    const overlay = await getRandomActiveOverlay();
    if (!overlay) {
      // No overlays available, process without overlay
      await sharp(baseImagePath)
        .resize(tileSize, tileSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      return {
        success: true,
        outputPath,
        processingTime: Date.now() - startTime
      };
    }

    // Process image with overlay
    const overlayPath = path.join(process.cwd(), 'public', 'admin', 'overlays', overlay.filename);

    // Check if overlay file exists
    try {
      await fs.access(overlayPath);
    } catch {
      console.warn(`Overlay file not found: ${overlayPath}`);
      // Process without overlay if file is missing
      await sharp(baseImagePath)
        .resize(tileSize, tileSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      return {
        success: true,
        outputPath,
        processingTime: Date.now() - startTime
      };
    }

    // Create the composite image with overlay
    const processedImage = await applyOverlayToImage(
      baseImagePath,
      overlayPath,
      {
        tileSize,
        opacity: overlay.opacity,
        blendMode: overlay.blend_mode as any,
        rotationEnabled: settings.overlay_rotation_enabled
      }
    );

    await processedImage.toFile(outputPath);

    // Record usage for analytics (non-blocking)
    recordOverlayUsage(overlay.id, photoId || null, tilePosition, sessionId).catch(console.error);

    return {
      success: true,
      outputPath,
      overlayUsed: overlay,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('Overlay processing error:', error);

    // Fallback: process without overlay
    try {
      await sharp(baseImagePath)
        .resize(tileSize, tileSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      return {
        success: true,
        outputPath,
        processingTime: Date.now() - startTime,
        error: `Overlay failed, processed without overlay: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } catch (fallbackError) {
      return {
        success: false,
        outputPath,
        processingTime: Date.now() - startTime,
        error: `Complete processing failure: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Apply overlay to base image with specified settings
 */
async function applyOverlayToImage(
  baseImagePath: string,
  overlayPath: string,
  options: {
    tileSize: number;
    opacity: number;
    blendMode: string;
    rotationEnabled: boolean;
  }
): Promise<sharp.Sharp> {
  const { tileSize, opacity, blendMode, rotationEnabled } = options;

  // Process base image
  let baseImage = sharp(baseImagePath)
    .resize(tileSize, tileSize, {
      fit: 'cover',
      position: 'center'
    });

  // Process overlay image
  let overlayImage = sharp(overlayPath)
    .resize(tileSize, tileSize, {
      fit: 'cover',
      position: 'center'
    });

  // Apply random rotation if enabled (-15° to +15°)
  if (rotationEnabled) {
    const rotation = (Math.random() - 0.5) * 30; // -15 to +15 degrees
    overlayImage = overlayImage.rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  // Convert overlay to buffer for compositing
  const overlayBuffer = await overlayImage
    .png() // Use PNG to preserve transparency
    .toBuffer();

  // Composite the images
  const compositedImage = baseImage.composite([{
    input: overlayBuffer,
    blend: blendMode as any,
    opacity: Math.round(opacity * 255) // Sharp uses 0-255 range
  }]);

  return compositedImage.jpeg({ quality: 85 });
}

/**
 * Process overlay upload (resize and optimize for disco ball tiles)
 */
export async function processOverlayUpload(
  inputPath: string,
  outputFilename: string
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  try {
    const outputDir = path.join(process.cwd(), 'public', 'admin', 'overlays');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, outputFilename);

    // Process overlay image - resize to standard size and optimize
    await sharp(inputPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 90,
        compressionLevel: 6
      })
      .toFile(outputPath);

    return {
      success: true,
      outputPath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate unique filename for overlay
 */
export function generateOverlayFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `overlay-${timestamp}-${random}.png`;
}

/**
 * Batch process multiple tiles with overlays (for disco ball generation)
 */
export async function batchProcessTilesWithOverlays(
  tileConfigs: Array<{
    baseImagePath: string;
    outputPath: string;
    photoId?: string;
    tilePosition: number;
  }>,
  sessionId: string,
  tileSize: number = 128
): Promise<OverlayResult[]> {
  const results: OverlayResult[] = [];

  // Process tiles in parallel batches of 5 to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < tileConfigs.length; i += batchSize) {
    const batch = tileConfigs.slice(i, i + batchSize);

    const batchPromises = batch.map(config =>
      processDiscoBallTileWithOverlay({
        ...config,
        tileSize,
        sessionId
      })
    );

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          outputPath: '',
          processingTime: 0,
          error: result.reason?.message || 'Unknown batch processing error'
        });
      }
    }
  }

  return results;
}