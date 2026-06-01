import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { OverlaySecurityValidator } from '../../src/lib/overlay/securityValidator.js';
import { OverlayImageOptimizer } from '../../src/lib/overlay/imageOptimizer.js';

describe('Tile Overlay System Integration', () => {
  let validator: OverlaySecurityValidator;
  let optimizer: OverlayImageOptimizer;

  beforeEach(() => {
    validator = new OverlaySecurityValidator();
    optimizer = new OverlayImageOptimizer();
  });

  describe('Complete Upload Workflow', () => {
    test('validates and processes valid image upload', async () => {
      const mockJpegFile = new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])], 'test.jpg', {
        type: 'image/jpeg'
      });

      mockJpegFile.arrayBuffer = vi.fn().mockResolvedValue(
        new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]).buffer
      );

      const validationResult = await validator.validateUpload(mockJpegFile);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.contentType).toBe('image/jpeg');
      expect(validationResult.securityHash).toMatch(/^[a-f0-9]{64}$/);

      vi.spyOn(optimizer as any, 'validateInputFile').mockResolvedValue(undefined);
      vi.spyOn(optimizer as any, 'validateOutputDirectory').mockResolvedValue(undefined);

      const pipeline = await optimizer.createProcessingPipeline('/tmp/test.jpg', '/tmp/out');

      expect(pipeline.steps).toContain('jpeg');
      expect(pipeline.outputPaths).toHaveProperty('jpeg');
    });

    test('rejects malicious file uploads', async () => {
      const maliciousFile = new File([new Uint8Array([0x00, 0x00, 0x00, 0x00])], 'malware.exe', {
        type: 'application/exe'
      });

      maliciousFile.arrayBuffer = vi.fn().mockResolvedValue(
        new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer
      );

      const validationResult = await validator.validateUpload(maliciousFile);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Invalid file extension');
      expect(validationResult.errors).toContain('Invalid file signature');
    });

    test('enforces file size limits', async () => {
      const oversizedFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      const validationResult = await validator.validateUpload(oversizedFile);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('File size exceeds limit');
    });
  });

  describe('Security Hash Consistency', () => {
    test('generates consistent hashes for identical files', async () => {
      const fileData = new Uint8Array([1, 2, 3, 4, 5]);

      const hash1 = await validator.generateSecurityHash(fileData);
      const hash2 = await validator.generateSecurityHash(fileData);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    test('detects file tampering through hash changes', async () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5]);
      const tamperedData = new Uint8Array([1, 2, 3, 4, 6]);

      const originalHash = await validator.generateSecurityHash(originalData);
      const tamperedHash = await validator.generateSecurityHash(tamperedData);

      expect(originalHash).not.toBe(tamperedHash);
    });
  });

  describe('Image Optimization Pipeline', () => {
    test('calculates appropriate size reductions', () => {
      const originalSize = 1000000; // 1MB
      const reductions = optimizer.calculateSizeReductions(originalSize);

      expect(reductions.webp).toBeLessThan(originalSize);
      expect(reductions.avif).toBeLessThan(reductions.webp);
      expect(reductions.webp).toBeGreaterThan(0);
      expect(reductions.avif).toBeGreaterThan(0);
    });

    test('provides consistent optimization configurations', () => {
      const jpegConfig = optimizer.getJpegConfig();
      const webpConfig = optimizer.getWebPConfig();
      const avifConfig = optimizer.getAVIFConfig();

      expect(jpegConfig.quality).toBeGreaterThan(0);
      expect(jpegConfig.quality).toBeLessThanOrEqual(100);
      expect(jpegConfig.progressive).toBe(true);

      expect(webpConfig.quality).toBeGreaterThan(0);
      expect(webpConfig.quality).toBeLessThanOrEqual(100);
      expect(webpConfig.quality).toBeLessThan(jpegConfig.quality);

      expect(avifConfig.quality).toBeGreaterThan(0);
      expect(avifConfig.quality).toBeLessThanOrEqual(100);
      expect(avifConfig.quality).toBeLessThan(webpConfig.quality);
    });
  });

  describe('Performance Quality Metrics', () => {
    test('calculates quality scores correctly', () => {
      const goodMetrics = {
        originalSize: 1000000,
        jpegSize: 800000,
        webpSize: 600000,
        avifSize: 400000,
        processingTime: 100
      };

      const poorMetrics = {
        originalSize: 1000000,
        jpegSize: 950000,
        webpSize: 900000,
        avifSize: 850000,
        processingTime: 5000
      };

      const goodScore = optimizer.calculateQualityScore(goodMetrics);
      const poorScore = optimizer.calculateQualityScore(poorMetrics);

      expect(goodScore).toBeGreaterThan(poorScore);
      expect(goodScore).toBeGreaterThan(70);
      expect(poorScore).toBeLessThan(30);
    });

    test('validates performance targets are achievable', () => {
      const targets = optimizer.getOptimizationTargets();

      expect(targets.jpeg).toBeLessThan(targets.original);
      expect(targets.webp).toBeLessThan(targets.jpeg);
      expect(targets.avif).toBeLessThan(targets.webp);

      expect(targets.avif).toBeGreaterThan(0.3);
      expect(targets.jpeg).toBeLessThan(1.0);
    });
  });

  describe('File Format Detection Accuracy', () => {
    test('accurately identifies JPEG signatures', async () => {
      const jpegSignatures = [
        new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]),  // JPEG/JFIF
        new Uint8Array([0xFF, 0xD8, 0xFF, 0xE1]),  // JPEG/Exif
        new Uint8Array([0xFF, 0xD8, 0xFF, 0xDB])   // JPEG raw
      ];

      for (const signature of jpegSignatures) {
        const result = await validator.validateFileSignature(signature);
        expect(result.isValid).toBe(true);
        expect(result.contentType).toBe('image/jpeg');
      }
    });

    test('accurately identifies PNG signatures', async () => {
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = await validator.validateFileSignature(pngSignature);

      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe('image/png');
    });

    test('accurately identifies WebP signatures', async () => {
      const webpSignature = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x00, 0x00, 0x00, 0x00, // File size placeholder
        0x57, 0x45, 0x42, 0x50  // "WEBP"
      ]);

      const result = await validator.validateFileSignature(webpSignature);
      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe('image/webp');
    });

    test('rejects invalid file signatures', async () => {
      const invalidSignatures = [
        new Uint8Array([0x00, 0x00, 0x00, 0x00]),  // Null bytes
        new Uint8Array([0x50, 0x4B, 0x03, 0x04]),  // ZIP file
        new Uint8Array([0x25, 0x50, 0x44, 0x46])   // PDF file
      ];

      for (const signature of invalidSignatures) {
        const result = await validator.validateFileSignature(signature);
        expect(result.isValid).toBe(false);
        expect(result.contentType).toBe('');
      }
    });
  });

  describe('Edge Case Handling', () => {
    test('handles zero-byte files gracefully', () => {
      expect(validator.validateFileSize(0)).toBe(false);
    });

    test('handles files exactly at size limit', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      expect(validator.validateFileSize(maxSize)).toBe(true);
      expect(validator.validateFileSize(maxSize + 1)).toBe(false);
    });

    test('handles files with no extensions', () => {
      expect(validator.validateExtension('filename')).toBe(false);
      expect(validator.validateExtension('')).toBe(false);
      expect(validator.validateExtension('.')).toBe(false);
    });

    test('handles files with multiple extensions', () => {
      expect(validator.validateExtension('file.backup.jpg')).toBe(true);
      expect(validator.validateExtension('file.backup.exe')).toBe(false);
    });
  });
});