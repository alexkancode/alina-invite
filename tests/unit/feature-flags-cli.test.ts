import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

describe('Feature Flag CLI', () => {
  const testFilePath = 'test-cli-feature-flags.json';

  beforeEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  });

  describe('flag enable/disable', () => {
    it('should enable a feature flag', () => {
      const result = execSync(`node scripts/feature-flags.js enable musicSearch --file ${testFilePath}`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      expect(result).toContain('Feature flag "musicSearch" enabled');
    });

    it('should disable a feature flag', () => {
      const result = execSync(`node scripts/feature-flags.js disable musicSearch --file ${testFilePath}`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      expect(result).toContain('Feature flag "musicSearch" disabled');
    });

    it('should show flag status', async () => {
      // Create file with flag disabled
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: false }));

      const result = execSync(`node scripts/feature-flags.js status musicSearch --file ${testFilePath}`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      expect(result).toContain('musicSearch: disabled');
    });

    it('should list all flags', async () => {
      // Create file with flag settings
      await fs.writeFile(testFilePath, JSON.stringify({ musicSearch: false }));

      const result = execSync(`node scripts/feature-flags.js list --file ${testFilePath}`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      expect(result).toContain('musicSearch: disabled');
    });

    it('should handle invalid flag names', () => {
      expect(() => {
        execSync(`node scripts/feature-flags.js enable invalidFlag --file ${testFilePath}`, {
          encoding: 'utf-8',
          cwd: process.cwd()
        });
      }).toThrow();
    });

    it('should handle missing arguments', () => {
      expect(() => {
        execSync(`node scripts/feature-flags.js enable --file ${testFilePath}`, {
          encoding: 'utf-8',
          cwd: process.cwd()
        });
      }).toThrow();
    });
  });
});