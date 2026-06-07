import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { createProductionService, createTestService, resetProductionSingleton } from '../../src/lib/feature-flags/factory.js';
import { MockFileSystemAdapter } from '../../src/lib/feature-flags/adapters/__mocks__/MockFileSystemAdapter.js';
import { FileStorage } from '../../src/lib/feature-flags/adapters/FileStorage.js';
import { isFeatureEnabled } from '../../src/lib/feature-flags/astro-helper.js';
import type { FeatureFlags } from '../../src/lib/feature-flags/types.js';

describe('Testable Feature Flags Integration', () => {
  const testFilePath = 'integration-test-flags.json';

  beforeEach(() => {
    resetProductionSingleton();
  });

  afterEach(async () => {
    resetProductionSingleton();
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File may not exist
    }
  });

  describe('End-to-End Service Integration', () => {
    it('should work with production service and real files', async () => {
      const service = createProductionService({
        filePath: testFilePath,
        defaults: { musicSearch: true }
      });

      // Initial state should use defaults
      expect(await service.isEnabled('musicSearch')).toBe(true);

      // Set flag should persist to file
      await service.setFlag('musicSearch', false);

      // Create new service instance to verify persistence
      resetProductionSingleton();
      const service2 = createProductionService({
        filePath: testFilePath,
        defaults: { musicSearch: true }
      });

      // Should read persisted value from file
      expect(await service2.isEnabled('musicSearch')).toBe(false);
    });

    it('should work with test service and mocks', async () => {
      const mockAdapter = new MockFileSystemAdapter();
      const storage = new FileStorage(mockAdapter, testFilePath, { musicSearch: true });
      const service = createTestService(storage);

      // Should use defaults initially
      expect(await service.isEnabled('musicSearch')).toBe(true);

      // Should save to mock storage
      await service.setFlag('musicSearch', false);

      // Should read from mock storage
      expect(await service.isEnabled('musicSearch')).toBe(false);

      // Verify mock was called
      expect(mockAdapter.getCallCount('writeFile')).toBe(1);
    });
  });

  describe('Astro Helper Integration', () => {
    it('should work with production service by default', async () => {
      // Write test flag file
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: false }), 'utf-8');

      const isEnabled = await isFeatureEnabled('musicSearch');

      // Should use default production service
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should work with injected test service', async () => {
      const mockStorage: any = {
        load: async () => ({ musicSearch: false }),
        save: async () => {},
      };
      const testService = createTestService(mockStorage);

      const isEnabled = await isFeatureEnabled('musicSearch', testService);

      expect(isEnabled).toBe(false);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache flags properly across calls', async () => {
      const mockAdapter = new MockFileSystemAdapter();
      mockAdapter.setFileContent(testFilePath, JSON.stringify({ musicSearch: true }));

      const storage = new FileStorage(mockAdapter, testFilePath, { musicSearch: false });
      const service = createTestService(storage);

      // Multiple calls should only load once
      await service.isEnabled('musicSearch');
      await service.isEnabled('musicSearch');
      await service.getAllFlags();

      // Should only load from file once due to caching
      expect(mockAdapter.getCallCount('readFile')).toBe(1);
    });

    it('should clear cache when setting flags', async () => {
      const mockAdapter = new MockFileSystemAdapter();
      mockAdapter.setFileContent(testFilePath, JSON.stringify({ musicSearch: true }));

      const storage = new FileStorage(mockAdapter, testFilePath, { musicSearch: false });
      const service = createTestService(storage);

      // Load initial flags
      expect(await service.isEnabled('musicSearch')).toBe(true);

      // Set flag should update cache
      await service.setFlag('musicSearch', false);

      // Subsequent calls should use updated cache
      expect(await service.isEnabled('musicSearch')).toBe(false);

      // Should have read once and written once
      expect(mockAdapter.getCallCount('readFile')).toBe(1);
      expect(mockAdapter.getCallCount('writeFile')).toBe(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle file system errors gracefully', async () => {
      const mockAdapter = new MockFileSystemAdapter();
      mockAdapter.simulateError('readFile', new Error('Permission denied'));

      const storage = new FileStorage(mockAdapter, testFilePath, { musicSearch: true });
      const service = createTestService(storage);

      // Should use defaults when file read fails
      expect(await service.isEnabled('musicSearch')).toBe(true);
    });

    it('should propagate save errors appropriately', async () => {
      const mockAdapter = new MockFileSystemAdapter();
      mockAdapter.setFileContent(testFilePath, JSON.stringify({ musicSearch: true }));
      mockAdapter.simulateError('writeFile', new Error('Disk full'));

      const storage = new FileStorage(mockAdapter, testFilePath, { musicSearch: false });
      const service = createTestService(storage);

      await expect(service.setFlag('musicSearch', false))
        .rejects.toThrow('Disk full');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same API as original service', async () => {
      const service = createProductionService({
        filePath: testFilePath,
        defaults: { musicSearch: true }
      });

      // Same methods should be available
      expect(typeof service.isEnabled).toBe('function');
      expect(typeof service.setFlag).toBe('function');
      expect(typeof service.getAllFlags).toBe('function');

      // Same return types and behavior
      const isEnabled = await service.isEnabled('musicSearch');
      expect(typeof isEnabled).toBe('boolean');

      const allFlags = await service.getAllFlags();
      expect(typeof allFlags).toBe('object');
      expect('musicSearch' in allFlags).toBe(true);

      await service.setFlag('musicSearch', false);
      expect(await service.isEnabled('musicSearch')).toBe(false);
    });

    it('should work with existing flag files', async () => {
      // Create file in the format the original service would create
      const existingFlags: FeatureFlags = { musicSearch: false };
      await fs.writeFile(testFilePath, JSON.stringify(existingFlags, null, 2), 'utf-8');

      const service = createProductionService({
        filePath: testFilePath,
        defaults: { musicSearch: true }
      });

      // Should read existing file correctly
      expect(await service.isEnabled('musicSearch')).toBe(false);
      expect(await service.getAllFlags()).toEqual(existingFlags);
    });
  });
});