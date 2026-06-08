import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductionDebugger } from '../../../src/lib/debug/production-debug.js';

// Mock window and localStorage for testing
const mockWindow = {
  location: { search: '' }
};
const mockLocalStorage = {
  getItem: vi.fn()
};

global.window = mockWindow as any;
global.localStorage = mockLocalStorage as any;

describe('ProductionDebugger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValue(null);
    mockWindow.location.search = '';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('enableDebug', () => {
    test('should enable debug when URL contains debug=true', () => {
      mockWindow.location.search = '?debug=true';

      const result = ProductionDebugger.enableDebug();

      expect(result).toBe(true);
    });

    test('should enable debug when localStorage has spotify-debug=true', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      const result = ProductionDebugger.enableDebug();

      expect(result).toBe(true);
    });

    test('should not enable debug by default', () => {
      const result = ProductionDebugger.enableDebug();

      expect(result).toBe(false);
    });
  });

  describe('logging methods', () => {
    test('should log when debug is enabled', () => {
      mockWindow.location.search = '?debug=true';
      ProductionDebugger.enableDebug();

      ProductionDebugger.log('TestComponent', 'Test message', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[SPOTIFY-DEBUG .+\] TestComponent: Test message/),
        { test: 'data' }
      );
    });

    test('should not log when debug is disabled', () => {
      ProductionDebugger.enableDebug(); // Should return false

      ProductionDebugger.log('TestComponent', 'Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('should log element state correctly', () => {
      mockWindow.location.search = '?debug=true';
      ProductionDebugger.enableDebug();

      const mockElement = {
        style: { display: 'block' },
        className: 'test-class',
        id: 'test-id'
      } as HTMLElement;

      ProductionDebugger.logElementState(mockElement, 'Test element');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[SPOTIFY-DEBUG .+\] DOM: Test element/),
        {
          exists: true,
          display: 'block',
          className: 'test-class',
          id: 'test-id'
        }
      );
    });

    test('should handle null elements gracefully', () => {
      mockWindow.location.search = '?debug=true';
      ProductionDebugger.enableDebug();

      ProductionDebugger.logElementState(null, 'Null element');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('should log feature flag status', () => {
      mockWindow.location.search = '?debug=true';
      ProductionDebugger.enableDebug();

      ProductionDebugger.logFeatureFlag('testFlag', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[SPOTIFY-DEBUG .+\] FeatureFlag: testFlag = true/),
        ''
      );
    });
  });
});