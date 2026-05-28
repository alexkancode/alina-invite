import { describe, it, expect, beforeAll } from 'vitest';
import { processUploadedPhoto, saveProcessedPhoto } from '../src/lib/photoProcessor.js';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Unit tests for Sharp image processing logic
describe('Photo Processing Library', () => {
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // Load test image (using one of the existing Alina photos)
    testImageBuffer = await readFile('public/alina/IMG_0049.jpeg');
  });

  describe('processUploadedPhoto', () => {
    it('should process a photo and return all three required sizes', async () => {
      const result = await processUploadedPhoto(testImageBuffer);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('thumb');
      expect(result).toHaveProperty('minigame');

      expect(result.id).toMatch(/^[a-f0-9]{32}$/); // 32 char hex string
      expect(result.original).toBeInstanceOf(Buffer);
      expect(result.thumb).toBeInstanceOf(Buffer);
      expect(result.minigame).toBeInstanceOf(Buffer);
    });

    it('should create thumbnails with correct dimensions and quality', async () => {
      const result = await processUploadedPhoto(testImageBuffer);

      // Use Sharp to verify output dimensions
      const sharp = await import('sharp');

      const thumbMeta = await sharp.default(result.thumb).metadata();
      const minigameMeta = await sharp.default(result.minigame).metadata();

      expect(thumbMeta.width).toBe(128);
      expect(thumbMeta.height).toBe(128);
      expect(thumbMeta.format).toBe('jpeg');

      expect(minigameMeta.width).toBe(256);
      expect(minigameMeta.height).toBe(256);
      expect(minigameMeta.format).toBe('jpeg');
    });

    it('should handle oversized images by resizing original', async () => {
      const result = await processUploadedPhoto(testImageBuffer);
      const sharp = await import('sharp');

      const originalMeta = await sharp.default(result.original).metadata();

      // Should be constrained to max 1200px
      expect(originalMeta.width).toBeLessThanOrEqual(1200);
      expect(originalMeta.height).toBeLessThanOrEqual(1200);
    });

    it('should compress files to reasonable sizes', async () => {
      const result = await processUploadedPhoto(testImageBuffer);

      // Thumbnails should be small for performance
      expect(result.thumb.length).toBeLessThan(15000); // < 15KB
      expect(result.minigame.length).toBeLessThan(30000); // < 30KB

      // Original should be reasonable quality
      expect(result.original.length).toBeLessThan(200000); // < 200KB for web
    });

    it('should handle corrupted image data gracefully', async () => {
      const corruptedBuffer = Buffer.from('not-an-image');

      await expect(processUploadedPhoto(corruptedBuffer))
        .rejects
        .toThrow();
    });

    it('should handle very small images without upscaling', async () => {
      const sharp = await import('sharp');

      // Create a tiny 50x50 test image
      const tinyBuffer = await sharp.default({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).jpeg().toBuffer();

      const result = await processUploadedPhoto(tinyBuffer);
      const originalMeta = await sharp.default(result.original).metadata();

      // Should not upscale beyond original size
      expect(originalMeta.width).toBeLessThanOrEqual(50);
      expect(originalMeta.height).toBeLessThanOrEqual(50);
    });
  });

  describe('saveProcessedPhoto', () => {
    it('should save processed photo to correct filesystem locations', async () => {
      const result = await processUploadedPhoto(testImageBuffer);

      await saveProcessedPhoto(result);

      // Check files exist
      expect(existsSync(`public/alina/user-uploads/user-${result.id}.jpeg`)).toBe(true);
      expect(existsSync(`public/alina/thumbs/user-${result.id}.jpeg`)).toBe(true);
      expect(existsSync(`public/alina/minigame/user-${result.id}.jpeg`)).toBe(true);

      // Cleanup after test
      await cleanup(result.id);
    });

    it('should save photos with correct file sizes', async () => {
      const result = await processUploadedPhoto(testImageBuffer);
      await saveProcessedPhoto(result);

      const savedThumb = await readFile(`public/alina/thumbs/user-${result.id}.jpeg`);
      const savedMinigame = await readFile(`public/alina/minigame/user-${result.id}.jpeg`);

      expect(savedThumb.length).toBe(result.thumb.length);
      expect(savedMinigame.length).toBe(result.minigame.length);

      // Cleanup
      await cleanup(result.id);
    });

    it('should handle filesystem errors gracefully', async () => {
      const result = await processUploadedPhoto(testImageBuffer);

      // Create result with invalid path
      result.id = '../../../etc/passwd'; // Path traversal attempt

      await expect(saveProcessedPhoto(result))
        .rejects
        .toThrow();
    });
  });

  // Helper function for test cleanup
  async function cleanup(photoId: string) {
    try {
      await unlink(`public/alina/user-uploads/user-${photoId}.jpeg`);
      await unlink(`public/alina/thumbs/user-${photoId}.jpeg`);
      await unlink(`public/alina/minigame/user-${photoId}.jpeg`);
    } catch {
      // Ignore cleanup errors
    }
  }
});