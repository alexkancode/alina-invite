import { describe, it, expect, vi } from 'vitest';
import { createProductionService, createTestService, resetProductionSingleton } from '../../src/lib/feature-flags/factory.js';
import type { IFeatureFlagStorage } from '../../src/lib/feature-flags/interfaces/IFeatureFlagStorage.js';

describe('FeatureFlagFactory', () => {
  describe('createProductionService', () => {
    it('should create a service with production adapters', () => {
      const service = createProductionService();

      expect(service).toBeDefined();
      expect(typeof service.isEnabled).toBe('function');
      expect(typeof service.setFlag).toBe('function');
      expect(typeof service.getAllFlags).toBe('function');
    });

    it('should create services with custom configuration', () => {
      const customConfig = {
        filePath: 'custom-flags.json',
        defaults: { musicSearch: false }
      };

      const service = createProductionService(customConfig);

      expect(service).toBeDefined();
    });
  });

  describe('createTestService', () => {
    it('should create a service with provided storage', () => {
      const mockStorage: IFeatureFlagStorage = {
        load: vi.fn().mockResolvedValue({ musicSearch: true }),
        save: vi.fn().mockResolvedValue(undefined),
      };

      const service = createTestService(mockStorage);

      expect(service).toBeDefined();
      expect(typeof service.isEnabled).toBe('function');
      expect(typeof service.setFlag).toBe('function');
      expect(typeof service.getAllFlags).toBe('function');
    });
  });

  describe('singleton behavior', () => {
    it('should return the same production instance on subsequent calls', () => {
      const service1 = createProductionService();
      const service2 = createProductionService();

      expect(service1).toBe(service2);
    });

    it('should create new test instances for each call', () => {
      const mockStorage1: IFeatureFlagStorage = {
        load: vi.fn(),
        save: vi.fn(),
      };
      const mockStorage2: IFeatureFlagStorage = {
        load: vi.fn(),
        save: vi.fn(),
      };

      const service1 = createTestService(mockStorage1);
      const service2 = createTestService(mockStorage2);

      expect(service1).not.toBe(service2);
    });

    it('should reset production singleton when requested', () => {
      const service1 = createProductionService();

      resetProductionSingleton();

      const service2 = createProductionService();

      // Should be a new instance after reset
      expect(service2).toBeDefined();
      expect(service1).not.toBe(service2);
    });
  });
});