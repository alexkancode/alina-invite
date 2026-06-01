import { describe, test, expect, beforeEach, vi } from 'vitest';
import { OverlayImageOptimizer } from '../../../src/lib/overlay/imageOptimizer.js';

describe('OverlayImageOptimizer', () => {
  let optimizer: OverlayImageOptimizer;

  beforeEach(() => {
    optimizer = new OverlayImageOptimizer();
  });

  describe('Format Support Detection', () => {
    test('detects WebP support correctly', () => {
      expect(typeof optimizer.supportsWebP()).toBe('boolean');
    });

    test('detects AVIF support correctly', () => {
      expect(typeof optimizer.supportsAVIF()).toBe('boolean');
    });
  });

  describe('Optimization Configuration', () => {
    test('provides JPEG optimization settings', () => {
      const config = optimizer.getJpegConfig();
      expect(config.quality).toBeGreaterThan(0);
      expect(config.quality).toBeLessThanOrEqual(100);
      expect(config.progressive).toBe(true);
    });

    test('provides WebP optimization settings', () => {
      const config = optimizer.getWebPConfig();
      expect(config.quality).toBeGreaterThan(0);
      expect(config.quality).toBeLessThanOrEqual(100);
    });

    test('provides AVIF optimization settings', () => {
      const config = optimizer.getAVIFConfig();
      expect(config.quality).toBeGreaterThan(0);
      expect(config.quality).toBeLessThanOrEqual(100);
    });
  });

  describe('Output Path Generation', () => {
    test('generates unique output paths', () => {
      const inputPath = '/tmp/test.jpg';
      const outputDir = '/tmp/optimized';

      const path1 = optimizer.generateOutputPath(inputPath, outputDir, 'webp');
      const path2 = optimizer.generateOutputPath(inputPath, outputDir, 'avif');

      expect(path1).toMatch(/\.webp$/);
      expect(path2).toMatch(/\.avif$/);
      expect(path1).not.toBe(path2);
    });

    test('preserves base filename in output', () => {
      const inputPath = '/tmp/my-image.jpg';
      const outputDir = '/tmp/out';

      const outputPath = optimizer.generateOutputPath(inputPath, outputDir, 'webp');
      expect(outputPath).toContain('my-image');
    });

    test('handles paths with special characters', () => {
      const inputPath = '/tmp/image with spaces & symbols.jpg';
      const outputDir = '/tmp/out';

      const outputPath = optimizer.generateOutputPath(inputPath, outputDir, 'webp');
      expect(outputPath).toBeTruthy();
      expect(typeof outputPath).toBe('string');
    });
  });

  describe('Size Optimization Validation', () => {
    test('validates optimization targets meet size requirements', () => {
      const targetSizes = optimizer.getOptimizationTargets();

      expect(targetSizes.jpeg).toBeLessThan(targetSizes.original);
      expect(targetSizes.webp).toBeLessThan(targetSizes.jpeg);
      expect(targetSizes.avif).toBeLessThan(targetSizes.webp);
    });

    test('calculates expected size reductions', () => {
      const originalSize = 1000000; // 1MB
      const reductions = optimizer.calculateSizeReductions(originalSize);

      expect(reductions.webp).toBeGreaterThan(0);
      expect(reductions.webp).toBeLessThan(originalSize);
      expect(reductions.avif).toBeGreaterThan(0);
      expect(reductions.avif).toBeLessThan(reductions.webp);
    });
  });

  describe('File Processing Workflow', () => {
    test('creates processing pipeline configuration', async () => {
      const inputPath = '/tmp/test.jpg';
      const outputDir = '/tmp/out';

      vi.spyOn(optimizer as any, 'validateInputFile').mockResolvedValue(undefined);
      vi.spyOn(optimizer as any, 'validateOutputDirectory').mockResolvedValue(undefined);

      const pipeline = await optimizer.createProcessingPipeline(inputPath, outputDir);

      expect(pipeline.steps).toContain('jpeg');
      expect(pipeline.outputPaths).toHaveProperty('jpeg');

      if (optimizer.supportsWebP()) {
        expect(pipeline.steps).toContain('webp');
        expect(pipeline.outputPaths).toHaveProperty('webp');
      }

      if (optimizer.supportsAVIF()) {
        expect(pipeline.steps).toContain('avif');
        expect(pipeline.outputPaths).toHaveProperty('avif');
      }
    });

    test('validates input file exists in pipeline', async () => {
      const nonExistentPath = '/tmp/does-not-exist.jpg';
      const outputDir = '/tmp/out';

      await expect(
        optimizer.createProcessingPipeline(nonExistentPath, outputDir)
      ).rejects.toThrow();
    });

    test('ensures output directory is accessible', async () => {
      const inputPath = '/tmp/test.jpg';
      const invalidOutputDir = '/invalid/path';

      await expect(
        optimizer.createProcessingPipeline(inputPath, invalidOutputDir)
      ).rejects.toThrow();
    });
  });

  describe('Quality Metrics', () => {
    test('calculates quality score for optimization results', () => {
      const metrics = {
        originalSize: 1000000,
        jpegSize: 800000,
        webpSize: 600000,
        avifSize: 400000,
        processingTime: 500
      };

      const score = optimizer.calculateQualityScore(metrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('penalizes excessive processing time', () => {
      const fastMetrics = {
        originalSize: 1000000,
        jpegSize: 800000,
        webpSize: 600000,
        avifSize: 400000,
        processingTime: 100
      };

      const slowMetrics = {
        ...fastMetrics,
        processingTime: 5000
      };

      const fastScore = optimizer.calculateQualityScore(fastMetrics);
      const slowScore = optimizer.calculateQualityScore(slowMetrics);

      expect(fastScore).toBeGreaterThan(slowScore);
    });
  });
});