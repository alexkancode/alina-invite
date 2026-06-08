import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScriptInterface } from '../../../../src/lib/claude-skills/feature-flag/ScriptInterface';
import type { FlagState, ToggleResult } from '../../../../src/lib/claude-skills/feature-flag/types';

describe('ScriptInterface', () => {
  let scriptInterface: ScriptInterface;
  let mockExec: any;

  beforeEach(() => {
    mockExec = vi.fn();
    scriptInterface = new ScriptInterface('scripts/feature-flags.js', mockExec);
  });

  describe('getCurrentFlags', () => {
    it('should parse script output and return flag states', async () => {
      const mockScriptOutput = {
        stdout: JSON.stringify([
          { name: 'musicSearch', enabled: true },
          { name: 'newFeature', enabled: false }
        ]),
        stderr: ''
      };

      mockExec.mockResolvedValue(mockScriptOutput);

      const result = await scriptInterface.getCurrentFlags();

      expect(mockExec).toHaveBeenCalledWith('node scripts/feature-flags.js list --json');
      expect(result).toEqual([
        { name: 'musicSearch', enabled: true },
        { name: 'newFeature', enabled: false }
      ]);
    });

    it('should handle script execution errors', async () => {
      mockExec.mockRejectedValue(new Error('Script not found'));

      await expect(scriptInterface.getCurrentFlags()).rejects.toThrow('Script not found');
    });

    it('should handle invalid JSON output', async () => {
      const mockScriptOutput = {
        stdout: 'invalid json',
        stderr: ''
      };

      mockExec.mockResolvedValue(mockScriptOutput);

      await expect(scriptInterface.getCurrentFlags()).rejects.toThrow('Failed to parse script output');
    });
  });

  describe('toggleFlag', () => {
    it('should execute toggle command and parse result', async () => {
      const mockScriptOutput = {
        stdout: 'Feature flag "musicSearch" toggled: enabled → disabled',
        stderr: ''
      };

      mockExec.mockResolvedValue(mockScriptOutput);

      const result = await scriptInterface.toggleFlag('musicSearch');

      expect(mockExec).toHaveBeenCalledWith('node scripts/feature-flags.js toggle musicSearch');
      expect(result).toEqual({
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: expect.any(String)
      });
    });

    it('should handle toggle command errors', async () => {
      mockExec.mockRejectedValue(new Error('Invalid flag name'));

      const result = await scriptInterface.toggleFlag('invalidFlag');

      expect(result).toEqual({
        success: false,
        flagName: 'invalidFlag',
        previousState: false,
        newState: false,
        timestamp: expect.any(String),
        error: 'Invalid flag name'
      });
    });

    it('should parse toggle output correctly for disabled → enabled transition', async () => {
      const mockScriptOutput = {
        stdout: 'Feature flag "musicSearch" toggled: disabled → enabled',
        stderr: ''
      };

      mockExec.mockResolvedValue(mockScriptOutput);

      const result = await scriptInterface.toggleFlag('musicSearch');

      expect(result.previousState).toBe(false);
      expect(result.newState).toBe(true);
    });
  });

  describe('validateFlagName', () => {
    it('should return true for valid flag names', () => {
      expect(scriptInterface.validateFlagName('musicSearch')).toBe(true);
    });

    it('should return false for invalid flag names', () => {
      expect(scriptInterface.validateFlagName('')).toBe(false);
      expect(scriptInterface.validateFlagName('invalid-flag')).toBe(false);
      expect(scriptInterface.validateFlagName('123')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(scriptInterface.validateFlagName(null as any)).toBe(false);
      expect(scriptInterface.validateFlagName(undefined as any)).toBe(false);
    });
  });
});