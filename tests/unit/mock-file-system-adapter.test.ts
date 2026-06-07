import { describe, it, expect, beforeEach } from 'vitest';
import { MockFileSystemAdapter } from '../../src/lib/feature-flags/adapters/__mocks__/MockFileSystemAdapter.js';

describe('MockFileSystemAdapter', () => {
  let adapter: MockFileSystemAdapter;

  beforeEach(() => {
    adapter = new MockFileSystemAdapter();
  });

  describe('readFile', () => {
    it('should return file content when file exists', async () => {
      adapter.setFileContent('test.json', '{"test": true}');

      const content = await adapter.readFile('test.json', 'utf-8');

      expect(content).toBe('{"test": true}');
    });

    it('should throw error when file does not exist', async () => {
      await expect(adapter.readFile('missing.json', 'utf-8'))
        .rejects.toThrow('ENOENT');
    });

    it('should simulate read errors when configured', async () => {
      adapter.simulateError('readFile', new Error('Permission denied'));

      await expect(adapter.readFile('test.json', 'utf-8'))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('writeFile', () => {
    it('should store file content', async () => {
      await adapter.writeFile('test.json', '{"test": false}', 'utf-8');

      const content = await adapter.readFile('test.json', 'utf-8');
      expect(content).toBe('{"test": false}');
    });

    it('should overwrite existing files', async () => {
      adapter.setFileContent('test.json', 'old content');

      await adapter.writeFile('test.json', 'new content', 'utf-8');

      const content = await adapter.readFile('test.json', 'utf-8');
      expect(content).toBe('new content');
    });

    it('should simulate write errors when configured', async () => {
      adapter.simulateError('writeFile', new Error('Disk full'));

      await expect(adapter.writeFile('test.json', 'content', 'utf-8'))
        .rejects.toThrow('Disk full');
    });
  });

  describe('access', () => {
    it('should succeed when file exists', async () => {
      adapter.setFileContent('test.json', 'content');

      await expect(adapter.access('test.json')).resolves.toBeUndefined();
    });

    it('should fail when file does not exist', async () => {
      await expect(adapter.access('missing.json'))
        .rejects.toThrow('ENOENT');
    });

    it('should simulate access errors when configured', async () => {
      adapter.setFileContent('test.json', 'content');
      adapter.simulateError('access', new Error('Permission denied'));

      await expect(adapter.access('test.json'))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('test utilities', () => {
    it('should reset state properly', () => {
      adapter.setFileContent('test.json', 'content');
      adapter.simulateError('readFile', new Error('test error'));

      adapter.reset();

      expect(() => adapter.getFileContent('test.json')).toThrow('File not found');
      expect(adapter.hasErrorSimulation('readFile')).toBe(false);
    });

    it('should track operation calls', async () => {
      adapter.setFileContent('test.json', 'content');

      await adapter.readFile('test.json', 'utf-8');
      await adapter.writeFile('output.json', 'data', 'utf-8');

      expect(adapter.getCallCount('readFile')).toBe(1);
      expect(adapter.getCallCount('writeFile')).toBe(1);
      expect(adapter.getCallCount('access')).toBe(0);
    });
  });
});