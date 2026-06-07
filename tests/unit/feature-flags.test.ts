import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { FeatureFlagService } from '../../src/lib/feature-flags/service.js';
import type { FeatureFlags } from '../../src/lib/feature-flags/types.js';

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      access: vi.fn(),
    }
  };
});

const mockFs = vi.mocked(fs);

const testConfig = {
  filePath: 'test-feature-flags.json',
  defaults: { musicSearch: true }
};

describe('FeatureFlagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FeatureFlagService.clearCache(); // Reset singleton state before each test
  });

  afterEach(() => {
    FeatureFlagService.clearCache(); // Reset singleton state after each test
  });

  describe('isEnabled', () => {
    it('should return default value when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const service = FeatureFlagService.getInstance(testConfig);
      const isEnabled = await service.isEnabled('musicSearch');

      expect(isEnabled).toBe(true); // Default value
    });

    it('should return value from file when file exists', async () => {
      const mockFlags: FeatureFlags = { musicSearch: false };
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockFlags));

      const service = FeatureFlagService.getInstance(testConfig);
      const isEnabled = await service.isEnabled('musicSearch');

      expect(isEnabled).toBe(false);
      expect(mockFs.readFile).toHaveBeenCalledWith('test-feature-flags.json', 'utf-8');
    });

    it('should use cached values on subsequent calls', async () => {
      const mockFlags: FeatureFlags = { musicSearch: true };
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockFlags));

      const service = FeatureFlagService.getInstance(testConfig);

      // First call
      await service.isEnabled('musicSearch');
      // Second call
      await service.isEnabled('musicSearch');

      expect(mockFs.readFile).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should handle corrupted JSON gracefully', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('invalid json{');

      const service = FeatureFlagService.getInstance(testConfig);
      const isEnabled = await service.isEnabled('musicSearch');

      expect(isEnabled).toBe(true); // Falls back to default
    });
  });

  describe('setFlag', () => {
    it('should write flag to file and update cache', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      const service = FeatureFlagService.getInstance(testConfig);
      await service.setFlag('musicSearch', false);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'test-feature-flags.json',
        JSON.stringify({ musicSearch: false }, null, 2),
        'utf-8'
      );

      // Check cache is updated
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('should not be called');
      const isEnabled = await service.isEnabled('musicSearch');
      expect(isEnabled).toBe(false);
      expect(mockFs.readFile).not.toHaveBeenCalled(); // Uses cache
    });

    it('should preserve other flags when setting one flag', async () => {
      // Setup existing flags
      const existingFlags: FeatureFlags = { musicSearch: true };
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingFlags));
      mockFs.writeFile.mockResolvedValue(undefined);

      const service = FeatureFlagService.getInstance(testConfig);

      // Load existing flags first
      await service.isEnabled('musicSearch');

      // Set flag (this should preserve existing values)
      await service.setFlag('musicSearch', false);

      const expectedFlags: FeatureFlags = { musicSearch: false };
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'test-feature-flags.json',
        JSON.stringify(expectedFlags, null, 2),
        'utf-8'
      );
    });
  });

  describe('getAllFlags', () => {
    it('should return all current flag values', async () => {
      const mockFlags: FeatureFlags = { musicSearch: false };
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockFlags));

      const service = FeatureFlagService.getInstance(testConfig);
      const flags = await service.getAllFlags();

      expect(flags).toEqual(mockFlags);
    });

    it('should return defaults when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const service = FeatureFlagService.getInstance(testConfig);
      const flags = await service.getAllFlags();

      expect(flags).toEqual({ musicSearch: true });
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const service1 = FeatureFlagService.getInstance(testConfig);
      const service2 = FeatureFlagService.getInstance(testConfig);

      expect(service1).toBe(service2);
    });
  });
});