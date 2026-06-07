import { describe, it, expect, beforeEach } from 'vitest';
import { FileStorage } from '../../src/lib/feature-flags/adapters/FileStorage.js';
import { MockFileSystemAdapter } from '../../src/lib/feature-flags/adapters/__mocks__/MockFileSystemAdapter.js';
import type { FeatureFlags } from '../../src/lib/feature-flags/types.js';

describe('FileStorage', () => {
  let mockFileSystem: MockFileSystemAdapter;
  let storage: FileStorage;
  const testFilePath = 'test-flags.json';
  const defaultFlags: FeatureFlags = { musicSearch: true };

  beforeEach(() => {
    mockFileSystem = new MockFileSystemAdapter();
    storage = new FileStorage(mockFileSystem, testFilePath, defaultFlags);
  });

  describe('load', () => {
    it('should load flags from file when file exists', async () => {
      const testFlags: FeatureFlags = { musicSearch: false };
      mockFileSystem.setFileContent(testFilePath, JSON.stringify(testFlags));

      const flags = await storage.load();

      expect(flags).toEqual(testFlags);
      expect(mockFileSystem.getCallCount('access')).toBe(1);
      expect(mockFileSystem.getCallCount('readFile')).toBe(1);
    });

    it('should return defaults when file does not exist', async () => {
      const flags = await storage.load();

      expect(flags).toEqual(defaultFlags);
      expect(mockFileSystem.getCallCount('access')).toBe(1);
      expect(mockFileSystem.getCallCount('readFile')).toBe(0);
    });

    it('should return defaults when file contains invalid JSON', async () => {
      mockFileSystem.setFileContent(testFilePath, 'invalid json{');

      const flags = await storage.load();

      expect(flags).toEqual(defaultFlags);
    });

    it('should handle file access errors gracefully', async () => {
      mockFileSystem.simulateError('access', new Error('Permission denied'));

      const flags = await storage.load();

      expect(flags).toEqual(defaultFlags);
    });

    it('should handle file read errors gracefully', async () => {
      mockFileSystem.setFileContent(testFilePath, '{}');
      mockFileSystem.simulateError('readFile', new Error('Read error'));

      const flags = await storage.load();

      expect(flags).toEqual(defaultFlags);
    });
  });

  describe('save', () => {
    it('should save flags to file with proper formatting', async () => {
      const testFlags: FeatureFlags = { musicSearch: false };

      await storage.save(testFlags);

      const savedContent = mockFileSystem.getFileContent(testFilePath);
      expect(JSON.parse(savedContent)).toEqual(testFlags);
      expect(savedContent).toContain('{\n  "musicSearch": false\n}');
      expect(mockFileSystem.getCallCount('writeFile')).toBe(1);
    });

    it('should handle write errors by rethrowing them', async () => {
      mockFileSystem.simulateError('writeFile', new Error('Write failed'));

      await expect(storage.save({ musicSearch: false }))
        .rejects.toThrow('Write failed');
    });
  });

  describe('configuration', () => {
    it('should use custom file path', async () => {
      const customPath = 'custom-path.json';
      const customStorage = new FileStorage(mockFileSystem, customPath, defaultFlags);

      await customStorage.save({ musicSearch: false });

      expect(() => mockFileSystem.getFileContent(customPath)).not.toThrow();
      expect(mockFileSystem.getCallCount('writeFile')).toBe(1);
    });

    it('should use custom defaults', async () => {
      const customDefaults: FeatureFlags = { musicSearch: false };
      const customStorage = new FileStorage(mockFileSystem, testFilePath, customDefaults);

      const flags = await customStorage.load();

      expect(flags).toEqual(customDefaults);
    });
  });
});