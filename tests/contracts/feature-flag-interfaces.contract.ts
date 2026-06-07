import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductionFileSystemAdapter } from '../../src/lib/feature-flags/adapters/ProductionFileSystemAdapter.js';
import { MockFileSystemAdapter } from '../../src/lib/feature-flags/adapters/__mocks__/MockFileSystemAdapter.js';
import { FileStorage } from '../../src/lib/feature-flags/adapters/FileStorage.js';
import { RefactoredFeatureFlagService } from '../../src/lib/feature-flags/RefactoredFeatureFlagService.js';
import { createProductionService, createTestService, resetProductionSingleton } from '../../src/lib/feature-flags/factory.js';
import type { IFileSystemAdapter } from '../../src/lib/feature-flags/interfaces/IFileSystemAdapter.js';
import type { IFeatureFlagStorage } from '../../src/lib/feature-flags/interfaces/IFeatureFlagStorage.js';
import type { IFeatureFlagService } from '../../src/lib/feature-flags/interfaces/IFeatureFlagService.js';
import type { FeatureFlags } from '../../src/lib/feature-flags/types.js';
import { promises as fs } from 'fs';

describe('Interface Contract Tests', () => {
  describe('IFileSystemAdapter Contract', () => {
    const testFilePath = 'contract-test-file.txt';

    afterEach(async () => {
      try {
        await fs.unlink(testFilePath);
      } catch (error) {
        // File may not exist
      }
    });

    function testFileSystemAdapter(name: string, adapter: IFileSystemAdapter) {
      describe(`${name} IFileSystemAdapter implementation`, () => {
        it('should implement readFile correctly', async () => {
          // Setup test file for production adapter
          if (name.includes('Production')) {
            await fs.writeFile(testFilePath, 'test content', 'utf-8');
          } else {
            // Setup mock adapter
            (adapter as MockFileSystemAdapter).setFileContent(testFilePath, 'test content');
          }

          const content = await adapter.readFile(testFilePath, 'utf-8');
          expect(content).toBe('test content');
        });

        it('should implement writeFile correctly', async () => {
          await adapter.writeFile(testFilePath, 'written content', 'utf-8');

          const content = await adapter.readFile(testFilePath, 'utf-8');
          expect(content).toBe('written content');
        });

        it('should implement access correctly', async () => {
          // Setup file
          if (name.includes('Production')) {
            await fs.writeFile(testFilePath, 'content', 'utf-8');
          } else {
            (adapter as MockFileSystemAdapter).setFileContent(testFilePath, 'content');
          }

          await expect(adapter.access(testFilePath)).resolves.toBeUndefined();
        });

        it('should throw appropriate errors for missing files', async () => {
          await expect(adapter.readFile('missing-file.txt', 'utf-8'))
            .rejects.toThrow();

          await expect(adapter.access('missing-file.txt'))
            .rejects.toThrow();
        });
      });
    }

    testFileSystemAdapter('ProductionFileSystemAdapter', new ProductionFileSystemAdapter());
    testFileSystemAdapter('MockFileSystemAdapter', new MockFileSystemAdapter());
  });

  describe('IFeatureFlagStorage Contract', () => {
    function testFeatureFlagStorage(name: string, createStorage: () => IFeatureFlagStorage) {
      describe(`${name} IFeatureFlagStorage implementation`, () => {
        let storage: IFeatureFlagStorage;

        beforeEach(() => {
          storage = createStorage();
        });

        it('should implement load correctly', async () => {
          const flags = await storage.load();

          expect(flags).toBeDefined();
          expect(typeof flags).toBe('object');
          expect('musicSearch' in flags).toBe(true);
          expect(typeof flags.musicSearch).toBe('boolean');
        });

        it('should implement save correctly', async () => {
          const testFlags: FeatureFlags = { musicSearch: false };

          await expect(storage.save(testFlags)).resolves.toBeUndefined();
        });

        it('should maintain data consistency', async () => {
          const testFlags: FeatureFlags = { musicSearch: false };

          await storage.save(testFlags);
          const loadedFlags = await storage.load();

          expect(loadedFlags).toEqual(testFlags);
        });
      });
    }

    testFeatureFlagStorage('FileStorage', () => {
      const mockAdapter = new MockFileSystemAdapter();
      const defaults: FeatureFlags = { musicSearch: true };
      return new FileStorage(mockAdapter, 'test.json', defaults);
    });
  });

  describe('IFeatureFlagService Contract', () => {
    function testFeatureFlagService(name: string, createService: () => IFeatureFlagService) {
      describe(`${name} IFeatureFlagService implementation`, () => {
        let service: IFeatureFlagService;

        beforeEach(() => {
          service = createService();
        });

        it('should implement isEnabled correctly', async () => {
          const isEnabled = await service.isEnabled('musicSearch');

          expect(typeof isEnabled).toBe('boolean');
        });

        it('should implement setFlag correctly', async () => {
          await expect(service.setFlag('musicSearch', false))
            .resolves.toBeUndefined();

          const isEnabled = await service.isEnabled('musicSearch');
          expect(isEnabled).toBe(false);
        });

        it('should implement getAllFlags correctly', async () => {
          const flags = await service.getAllFlags();

          expect(flags).toBeDefined();
          expect(typeof flags).toBe('object');
          expect('musicSearch' in flags).toBe(true);
        });

        it('should maintain consistent state', async () => {
          await service.setFlag('musicSearch', false);

          const isEnabled = await service.isEnabled('musicSearch');
          const allFlags = await service.getAllFlags();

          expect(isEnabled).toBe(false);
          expect(allFlags.musicSearch).toBe(false);
        });
      });
    }

    testFeatureFlagService('RefactoredFeatureFlagService', () => {
      const mockStorage: IFeatureFlagStorage = {
        load: async () => ({ musicSearch: true }),
        save: async () => {},
      };
      return createTestService(mockStorage);
    });

    testFeatureFlagService('ProductionService', () => {
      resetProductionSingleton();
      return createProductionService({
        filePath: 'contract-test-flags.json',
        defaults: { musicSearch: true }
      });
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid flag names', async () => {
      const mockStorage: IFeatureFlagStorage = {
        load: async () => ({ musicSearch: true }),
        save: async () => {},
      };
      const service = createTestService(mockStorage);

      // This should compile without errors
      await service.isEnabled('musicSearch');
      await service.setFlag('musicSearch', true);

      // TypeScript should catch invalid flag names at compile time
      // These would be compilation errors:
      // await service.isEnabled('invalidFlag');
      // await service.setFlag('invalidFlag', true);

      expect(true).toBe(true); // Test that we get here without TS errors
    });

    it('should maintain proper return types', async () => {
      const mockStorage: IFeatureFlagStorage = {
        load: async () => ({ musicSearch: true }),
        save: async () => {},
      };
      const service = createTestService(mockStorage);

      const isEnabled = await service.isEnabled('musicSearch');
      const allFlags = await service.getAllFlags();

      // TypeScript should infer these types correctly
      expect(typeof isEnabled).toBe('boolean');
      expect(typeof allFlags).toBe('object');
      expect(typeof allFlags.musicSearch).toBe('boolean');
    });
  });
});