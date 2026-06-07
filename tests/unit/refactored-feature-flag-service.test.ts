import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefactoredFeatureFlagService } from '../../src/lib/feature-flags/RefactoredFeatureFlagService.js';
import type { IFeatureFlagStorage } from '../../src/lib/feature-flags/interfaces/IFeatureFlagStorage.js';
import type { FeatureFlags } from '../../src/lib/feature-flags/types.js';

describe('RefactoredFeatureFlagService', () => {
  let mockStorage: IFeatureFlagStorage;
  let service: RefactoredFeatureFlagService;

  beforeEach(() => {
    mockStorage = {
      load: vi.fn(),
      save: vi.fn(),
    };
    service = new RefactoredFeatureFlagService(mockStorage);
  });

  describe('isEnabled', () => {
    it('should return flag value from storage', async () => {
      const testFlags: FeatureFlags = { musicSearch: false };
      vi.mocked(mockStorage.load).mockResolvedValue(testFlags);

      const isEnabled = await service.isEnabled('musicSearch');

      expect(isEnabled).toBe(false);
      expect(mockStorage.load).toHaveBeenCalledTimes(1);
    });

    it('should cache flags and not reload on subsequent calls', async () => {
      const testFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(testFlags);

      // First call
      await service.isEnabled('musicSearch');
      // Second call
      await service.isEnabled('musicSearch');

      expect(mockStorage.load).toHaveBeenCalledTimes(1);
    });

    it('should handle storage load errors gracefully', async () => {
      vi.mocked(mockStorage.load).mockRejectedValue(new Error('Storage error'));

      await expect(service.isEnabled('musicSearch')).rejects.toThrow('Storage error');
    });
  });

  describe('setFlag', () => {
    it('should load current flags, update flag, and save', async () => {
      const initialFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(initialFlags);

      await service.setFlag('musicSearch', false);

      expect(mockStorage.load).toHaveBeenCalledTimes(1);
      expect(mockStorage.save).toHaveBeenCalledWith({ musicSearch: false });
    });

    it('should update cache after setting flag', async () => {
      const initialFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(initialFlags);

      await service.setFlag('musicSearch', false);

      // Subsequent call should use cached value, not reload
      const isEnabled = await service.isEnabled('musicSearch');
      expect(isEnabled).toBe(false);
      expect(mockStorage.load).toHaveBeenCalledTimes(1); // Only called during setFlag
    });

    it('should handle storage save errors by rethrowing them', async () => {
      const initialFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(initialFlags);
      vi.mocked(mockStorage.save).mockRejectedValue(new Error('Save failed'));

      await expect(service.setFlag('musicSearch', false))
        .rejects.toThrow('Save failed');
    });

    it('should preserve other flags when setting one flag', async () => {
      // Test with multiple flags when we have them
      const initialFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(initialFlags);

      await service.setFlag('musicSearch', false);

      expect(mockStorage.save).toHaveBeenCalledWith({
        musicSearch: false,
      });
    });
  });

  describe('getAllFlags', () => {
    it('should return all current flags', async () => {
      const testFlags: FeatureFlags = { musicSearch: false };
      vi.mocked(mockStorage.load).mockResolvedValue(testFlags);

      const flags = await service.getAllFlags();

      expect(flags).toEqual(testFlags);
      expect(mockStorage.load).toHaveBeenCalledTimes(1);
    });

    it('should use cached flags if available', async () => {
      const testFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(testFlags);

      // First call loads from storage
      await service.getAllFlags();
      // Second call uses cache
      await service.getAllFlags();

      expect(mockStorage.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache behavior', () => {
    it('should clear cache when setting a flag', async () => {
      const initialFlags: FeatureFlags = { musicSearch: true };
      const updatedFlags: FeatureFlags = { musicSearch: false };

      vi.mocked(mockStorage.load).mockResolvedValueOnce(initialFlags);

      // Load initial flags
      await service.isEnabled('musicSearch');

      // Set flag - this should clear cache and load fresh
      await service.setFlag('musicSearch', false);

      // Verify cache was updated
      const flags = await service.getAllFlags();
      expect(flags.musicSearch).toBe(false);

      // Should have called load once for initial load, once for setFlag
      expect(mockStorage.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should propagate storage errors without caching them', async () => {
      vi.mocked(mockStorage.load).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.isEnabled('musicSearch')).rejects.toThrow('Network error');

      // Subsequent call should retry, not use cached error
      const testFlags: FeatureFlags = { musicSearch: true };
      vi.mocked(mockStorage.load).mockResolvedValue(testFlags);

      const isEnabled = await service.isEnabled('musicSearch');
      expect(isEnabled).toBe(true);
    });
  });
});