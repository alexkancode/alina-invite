import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProductionSafety } from '../../../../src/lib/claude-skills/feature-flag/ProductionSafety';
import type { ToggleRequest, ToggleResult } from '../../../../src/lib/claude-skills/feature-flag/types';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      appendFile: vi.fn(),
      access: vi.fn()
    }
  };
});

describe('ProductionSafety', () => {
  let productionSafety: ProductionSafety;
  let mockAppendFile: any;

  beforeEach(async () => {
    productionSafety = new ProductionSafety('test-audit.log');
    const { promises } = await import('fs');
    mockAppendFile = vi.mocked(promises.appendFile);
    vi.clearAllMocks();
  });

  describe('requiresConfirmation', () => {
    it('should require confirmation for production environment', () => {
      expect(productionSafety.requiresConfirmation('production')).toBe(true);
    });

    it('should not require confirmation for development environment', () => {
      expect(productionSafety.requiresConfirmation('development')).toBe(false);
    });

    it('should not require confirmation for test environment', () => {
      expect(productionSafety.requiresConfirmation('test')).toBe(false);
    });
  });

  describe('validateToggleRequest', () => {
    it('should validate a properly structured request', async () => {
      const request: ToggleRequest = {
        flagName: 'musicSearch',
        confirmed: true,
        environment: 'production'
      };

      const result = await productionSafety.validateToggleRequest(request);
      expect(result).toBe(true);
    });

    it('should reject request with invalid flag name', async () => {
      const request: ToggleRequest = {
        flagName: '',
        confirmed: true,
        environment: 'production'
      };

      const result = await productionSafety.validateToggleRequest(request);
      expect(result).toBe(false);
    });

    it('should reject unconfirmed production request', async () => {
      const request: ToggleRequest = {
        flagName: 'musicSearch',
        confirmed: false,
        environment: 'production'
      };

      const result = await productionSafety.validateToggleRequest(request);
      expect(result).toBe(false);
    });

    it('should allow unconfirmed development request', async () => {
      const request: ToggleRequest = {
        flagName: 'musicSearch',
        confirmed: false,
        environment: 'development'
      };

      const result = await productionSafety.validateToggleRequest(request);
      expect(result).toBe(true);
    });

    it('should reject request with invalid environment', async () => {
      const request: ToggleRequest = {
        flagName: 'musicSearch',
        confirmed: true,
        environment: 'invalid' as any
      };

      const result = await productionSafety.validateToggleRequest(request);
      expect(result).toBe(false);
    });
  });

  describe('logChange', () => {
    it('should log successful change to audit file', async () => {
      const result: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      await productionSafety.logChange(result);

      expect(mockAppendFile).toHaveBeenCalledWith(
        'test-audit.log',
        expect.stringContaining('2026-06-08T16:15:23.000Z TOGGLE musicSearch: enabled → disabled SUCCESS')
      );
    });

    it('should log failed change to audit file', async () => {
      const result: ToggleResult = {
        success: false,
        flagName: 'musicSearch',
        previousState: true,
        newState: true,
        timestamp: '2026-06-08T16:15:23.000Z',
        error: 'Script execution failed'
      };

      await productionSafety.logChange(result);

      expect(mockAppendFile).toHaveBeenCalledWith(
        'test-audit.log',
        expect.stringContaining('2026-06-08T16:15:23.000Z TOGGLE musicSearch: enabled → enabled FAILED: Script execution failed')
      );
    });

    it('should handle file system errors gracefully', async () => {
      mockAppendFile.mockRejectedValue(new Error('Permission denied'));

      const result: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      await expect(productionSafety.logChange(result)).resolves.not.toThrow();
    });
  });
});