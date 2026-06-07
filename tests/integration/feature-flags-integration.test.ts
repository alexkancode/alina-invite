import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { FeatureFlagService } from '../../src/lib/feature-flags/service.js';

describe('Feature Flag Integration Tests', () => {
  const testFilePath = 'test-integration-feature-flags.json';
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

  describe('end-to-end feature toggle workflow', () => {
    it('should enable flag via service and persist correctly', async () => {
      const service = FeatureFlagService.getInstance(testConfig);

      // Initially should use default (enabled)
      expect(await service.isEnabled('musicSearch')).toBe(true);

      // Disable the flag
      await service.setFlag('musicSearch', false);

      // Should be disabled immediately
      expect(await service.isEnabled('musicSearch')).toBe(false);

      // Clear cache and create new instance (simulates app restart)
      FeatureFlagService.clearCache();
      const service2 = FeatureFlagService.getInstance(testConfig);

      // Should still be disabled (persisted)
      expect(await service2.isEnabled('musicSearch')).toBe(false);

      // Re-enable the flag
      await service2.setFlag('musicSearch', true);

      // Should be enabled again
      expect(await service2.isEnabled('musicSearch')).toBe(true);
    });

    it('should handle missing file gracefully and use defaults', async () => {
      const service = FeatureFlagService.getInstance(testConfig);

      // File doesn't exist, should use defaults
      expect(await service.isEnabled('musicSearch')).toBe(true);
      expect(await service.getAllFlags()).toEqual({ musicSearch: true });
    });

    it('should handle corrupted file gracefully', async () => {
      // Write corrupted JSON
      await fs.writeFile(testFilePath, 'invalid json{');

      const service = FeatureFlagService.getInstance(testConfig);

      // Should fall back to defaults
      expect(await service.isEnabled('musicSearch')).toBe(true);
      expect(await service.getAllFlags()).toEqual({ musicSearch: true });

      // Setting flag should work and overwrite corrupted file
      await service.setFlag('musicSearch', false);
      expect(await service.isEnabled('musicSearch')).toBe(false);
    });

    it('should maintain consistency across multiple instances', async () => {
      const service1 = FeatureFlagService.getInstance(testConfig);
      const service2 = FeatureFlagService.getInstance(testConfig);

      // Should be same instance (singleton)
      expect(service1).toBe(service2);

      // Set flag in one instance
      await service1.setFlag('musicSearch', false);

      // Should be reflected in other instance immediately
      expect(await service2.isEnabled('musicSearch')).toBe(false);
    });

    it('should preserve file format for readability', async () => {
      const service = FeatureFlagService.getInstance(testConfig);

      await service.setFlag('musicSearch', false);

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      expect(parsed).toEqual({ musicSearch: false });

      // Should be formatted nicely (with indentation)
      expect(fileContent).toContain('{\n  "musicSearch": false\n}');
    });
  });

  describe('performance and caching', () => {
    it('should cache flags and not re-read file on subsequent calls', async () => {
      const service = FeatureFlagService.getInstance(testConfig);

      // First call loads from file (or uses defaults)
      const result1 = await service.isEnabled('musicSearch');

      // Write different value to file
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: false }));

      // Second call should use cache, not re-read file
      const result2 = await service.isEnabled('musicSearch');

      expect(result1).toBe(result2); // Both should use cached value
    });

    it('should clear cache when setting flags', async () => {
      // Write initial file
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: false }));

      const service = FeatureFlagService.getInstance(testConfig);

      // Load from file
      expect(await service.isEnabled('musicSearch')).toBe(false);

      // Set flag should update cache
      await service.setFlag('musicSearch', true);

      // Should use new cached value
      expect(await service.isEnabled('musicSearch')).toBe(true);
    });
  });
});