import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { FeatureFlagService } from '../../src/lib/feature-flags/service.js';
import type { FeatureFlags } from '../../src/lib/feature-flags/types.js';

describe('FeatureFlagService - Simple Integration Tests', () => {
  const testFilePath = 'test-feature-flags-simple.json';
  const testConfig = {
    filePath: testFilePath,
    defaults: { musicSearch: true }
  };

  beforeEach(async () => {
    FeatureFlagService.clearCache();

    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    FeatureFlagService.clearCache();

    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  describe('basic functionality', () => {
    it('should return default values when file does not exist', async () => {
      const service = FeatureFlagService.getInstance(testConfig);
      const isEnabled = await service.isEnabled('musicSearch');

      expect(isEnabled).toBe(true); // Default value
    });

    it('should persist and read flag values', async () => {
      const service = FeatureFlagService.getInstance(testConfig);

      // Set flag to false
      await service.setFlag('musicSearch', false);

      // Clear cache and create new instance
      FeatureFlagService.clearCache();
      const service2 = FeatureFlagService.getInstance(testConfig);

      // Should read false from file
      const isEnabled = await service2.isEnabled('musicSearch');
      expect(isEnabled).toBe(false);
    });

    it('should cache values correctly', async () => {
      // Write initial file
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: false }));

      const service = FeatureFlagService.getInstance(testConfig);

      // First read
      const isEnabled1 = await service.isEnabled('musicSearch');

      // Change file externally
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: true }));

      // Second read should use cache (still false)
      const isEnabled2 = await service.isEnabled('musicSearch');

      expect(isEnabled1).toBe(false);
      expect(isEnabled2).toBe(false); // Cached value
    });

    it('should handle all flags correctly', async () => {
      const service = FeatureFlagService.getInstance(testConfig);

      await service.setFlag('musicSearch', false);

      const allFlags = await service.getAllFlags();
      expect(allFlags).toEqual({ musicSearch: false });
    });

    it('should handle corrupted JSON gracefully', async () => {
      // Write invalid JSON
      await fs.writeFile(testFilePath, 'invalid json{');

      const service = FeatureFlagService.getInstance(testConfig);
      const isEnabled = await service.isEnabled('musicSearch');

      expect(isEnabled).toBe(true); // Falls back to default
    });
  });

  describe('singleton behavior', () => {
    it('should maintain singleton pattern', () => {
      const service1 = FeatureFlagService.getInstance(testConfig);
      const service2 = FeatureFlagService.getInstance(testConfig);

      expect(service1).toBe(service2);
    });
  });
});