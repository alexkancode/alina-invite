import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { savePhotoMetadata } from './photoDatabase.js';

export interface ProcessedPhoto {
  id: string;
  original: Buffer;
  thumb: Buffer;
  minigame: Buffer;
}

export interface PhotoMetadata {
  id: string;
  originalFilename: string;
  fileSize: number;
  uploadIp: string;
}

/**
 * Process an uploaded photo into all required sizes for the application
 * @param fileBuffer - Raw uploaded file buffer
 * @returns Processed photo with all three required sizes
 */
export async function processUploadedPhoto(fileBuffer: Buffer): Promise<ProcessedPhoto> {
  // Generate unique photo ID
  const id = randomBytes(16).toString('hex');

  try {
    // Validate that this is actually an image using Sharp
    const metadata = await sharp(fileBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: missing dimensions');
    }

    // Process all three sizes in parallel for efficiency
    const [original, thumb, minigame] = await Promise.all([
      // Keep original at reasonable size (max 1200px, high quality)
      sharp(fileBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true // Don't upscale small images
        })
        .jpeg({ quality: 90 })
        .toBuffer(),

      // Disco ball thumbnails - small for performance (128x128)
      sharp(fileBuffer)
        .resize(128, 128, {
          fit: 'cover',
          position: 'attention' // Smart cropping focuses on interesting areas
        })
        .jpeg({ quality: 85 })
        .toBuffer(),

      // Minigame tiles - perfect squares as established (256x256)
      sharp(fileBuffer)
        .resize(256, 256, {
          fit: 'cover',
          position: 'attention'
        })
        .jpeg({ quality: 85 })
        .toBuffer()
    ]);

    return { id, original, thumb, minigame };

  } catch (error) {
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save processed photo buffers to the filesystem in the established structure
 * @param processed - Processed photo with all sizes
 */
export async function saveProcessedPhoto(processed: ProcessedPhoto): Promise<void> {
  const { id, original, thumb, minigame } = processed;

  // Validate photo ID to prevent path traversal
  if (!/^[a-f0-9]{32}$/.test(id)) {
    throw new Error('Invalid photo ID format');
  }

  try {
    // Ensure directories exist
    const directories = [
      'public/alina/user-uploads',
      'public/alina/thumbs',
      'public/alina/minigame'
    ];

    for (const dir of directories) {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }

    // Save all files in parallel
    await Promise.all([
      writeFile(`public/alina/user-uploads/user-${id}.jpeg`, original),
      writeFile(`public/alina/thumbs/user-${id}.jpeg`, thumb),
      writeFile(`public/alina/minigame/user-${id}.jpeg`, minigame)
    ]);

  } catch (error) {
    throw new Error(`Failed to save processed photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Complete photo processing workflow: process and save photo with metadata
 * @param fileBuffer - Raw uploaded file buffer
 * @param metadata - Photo metadata for database
 * @returns Photo ID
 */
export async function processAndSavePhoto(
  fileBuffer: Buffer,
  metadata: Omit<PhotoMetadata, 'id'>
): Promise<string> {
  // Process the photo
  const processed = await processUploadedPhoto(fileBuffer);

  // Save to filesystem
  await saveProcessedPhoto(processed);

  // Save metadata to database
  await savePhotoMetadata({
    id: processed.id,
    ...metadata
  });

  return processed.id;
}

/**
 * Validate uploaded file before processing
 * @param file - File object from form upload
 * @returns Validation result
 */
export function validateUploadedFile(file: File): { valid: boolean; error?: string } {
  // Check file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }

  // Check file type - be more permissive with MIME types
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
    return { valid: false, error: 'Invalid file type (only images allowed)' };
  }

  // Check filename length and characters
  if (file.name.length > 255) {
    return { valid: false, error: 'Filename too long' };
  }

  return { valid: true };
}

/**
 * Sanitize filename to prevent security issues
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components and keep only the basename
  const basename = path.basename(filename);

  // Replace dangerous characters with safe ones
  const sanitized = basename
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace special chars with underscore
    .replace(/\.+/g, '.')            // Replace multiple dots with single dot
    .replace(/^\./, '')              // Remove leading dot
    .slice(0, 255);                  // Limit length

  // Ensure it has an extension
  if (!sanitized.includes('.')) {
    return sanitized + '.jpeg';
  }

  return sanitized || 'upload.jpeg'; // Fallback if empty
}