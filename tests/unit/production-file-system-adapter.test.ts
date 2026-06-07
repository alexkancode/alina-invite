import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { ProductionFileSystemAdapter } from '../../src/lib/feature-flags/adapters/ProductionFileSystemAdapter.js';

describe('ProductionFileSystemAdapter', () => {
  let adapter: ProductionFileSystemAdapter;
  const testFilePath = 'test-production-adapter.json';

  beforeEach(() => {
    adapter = new ProductionFileSystemAdapter();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File may not exist, that's fine
    }
  });

  describe('readFile', () => {
    it('should read file content correctly', async () => {
      const testContent = '{"test": true}';
      await fs.writeFile(testFilePath, testContent, 'utf-8');

      const content = await adapter.readFile(testFilePath, 'utf-8');

      expect(content).toBe(testContent);
    });

    it('should throw error for non-existent files', async () => {
      await expect(adapter.readFile('non-existent-file.json', 'utf-8'))
        .rejects.toThrow('ENOENT');
    });
  });

  describe('writeFile', () => {
    it('should write file content correctly', async () => {
      const testContent = '{"written": "data"}';

      await adapter.writeFile(testFilePath, testContent, 'utf-8');

      const content = await fs.readFile(testFilePath, 'utf-8');
      expect(content).toBe(testContent);
    });

    it('should overwrite existing files', async () => {
      await fs.writeFile(testFilePath, 'old content', 'utf-8');

      await adapter.writeFile(testFilePath, 'new content', 'utf-8');

      const content = await fs.readFile(testFilePath, 'utf-8');
      expect(content).toBe('new content');
    });
  });

  describe('access', () => {
    it('should succeed for existing files', async () => {
      await fs.writeFile(testFilePath, 'test content', 'utf-8');

      await expect(adapter.access(testFilePath)).resolves.toBeUndefined();
    });

    it('should fail for non-existent files', async () => {
      await expect(adapter.access('non-existent-file.json'))
        .rejects.toThrow('ENOENT');
    });
  });
});