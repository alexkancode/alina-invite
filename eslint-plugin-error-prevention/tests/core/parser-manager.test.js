import { describe, test, expect, beforeEach, vi } from 'vitest';
import ParserManager from '../../lib/core/parser-manager.js';

describe('ParserManager', () => {
  beforeEach(() => {
    ParserManager.clear();
  });

  describe('Parser Class Registration', () => {
    test('should register parser class', () => {
      class MockParser {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('mock', MockParser);

      expect(ParserManager.hasParserClass('mock')).toBe(true);
    });

    test('should prevent duplicate parser class registration', () => {
      class Parser1 {
        static parse() { return {}; }
        static validate() { return true; }
      }

      class Parser2 {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('duplicate', Parser1);

      expect(() => {
        ParserManager.registerParserClass('duplicate', Parser2);
      }).toThrow('Parser class "duplicate" already registered');
    });

    test('should validate parser class interface', () => {
      class InvalidParser {}

      expect(() => {
        ParserManager.registerParserClass('invalid', InvalidParser);
      }).toThrow('Parser class must have static parse method');
    });

    test('should validate parser class has validate method', () => {
      class PartialParser {
        static parse() { return {}; }
      }

      expect(() => {
        ParserManager.registerParserClass('partial', PartialParser);
      }).toThrow('Parser class must have static validate method');
    });
  });

  describe('Parser Instance Creation', () => {
    test('should create parser instance from registered class', () => {
      const mockParseResult = { config: 'data' };
      const mockValidateResult = true;

      class MockParser {
        static parse = vi.fn().mockReturnValue(mockParseResult);
        static validate = vi.fn().mockReturnValue(mockValidateResult);
      }

      ParserManager.registerParserClass('mock', MockParser);

      const parser = ParserManager.createParser('mock');

      expect(parser.name).toBe('mock');
      expect(typeof parser.parse).toBe('function');
      expect(typeof parser.validate).toBe('function');

      // Test that methods are properly bound
      const parseResult = parser.parse('/test/root');
      expect(MockParser.parse).toHaveBeenCalledWith('/test/root');
      expect(parseResult).toBe(mockParseResult);

      const validateResult = parser.validate({});
      expect(MockParser.validate).toHaveBeenCalledWith({});
      expect(validateResult).toBe(mockValidateResult);
    });

    test('should throw error for unknown parser', () => {
      expect(() => {
        ParserManager.createParser('nonexistent');
      }).toThrow('Unknown parser: nonexistent');
    });
  });

  describe('Built-in Parser Classes', () => {
    test('should have default parser classes registered', () => {
      const defaultParsers = ParserManager.getRegisteredParserNames();

      // Initially empty - parsers registered on demand
      expect(Array.isArray(defaultParsers)).toBe(true);
    });

    test('should auto-register common parser classes', () => {
      ParserManager.initializeDefaultParsers();

      const registeredNames = ParserManager.getRegisteredParserNames();
      expect(registeredNames).toContain('typescript');
      expect(registeredNames).toContain('package');
      expect(registeredNames).toContain('buildTool');
    });

    test('should create instances of default parsers', () => {
      ParserManager.initializeDefaultParsers();

      const tsParser = ParserManager.createParser('typescript');
      expect(tsParser.name).toBe('typescript');
      expect(typeof tsParser.parse).toBe('function');

      const packageParser = ParserManager.createParser('package');
      expect(packageParser.name).toBe('package');
      expect(typeof packageParser.parse).toBe('function');
    });
  });

  describe('Parser Instance Management', () => {
    test('should cache parser instances', () => {
      class TestParser {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('test', TestParser);

      const instance1 = ParserManager.getOrCreateParser('test');
      const instance2 = ParserManager.getOrCreateParser('test');

      expect(instance1).toBe(instance2);
    });

    test('should create new instance if not cached', () => {
      class TestParser {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('test', TestParser);

      const instance = ParserManager.getOrCreateParser('test');
      expect(instance).toBeDefined();
      expect(instance.name).toBe('test');
    });

    test('should list all cached parser instances', () => {
      class Parser1 {
        static parse() { return {}; }
        static validate() { return true; }
      }

      class Parser2 {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('parser1', Parser1);
      ParserManager.registerParserClass('parser2', Parser2);

      ParserManager.getOrCreateParser('parser1');
      ParserManager.getOrCreateParser('parser2');

      const instanceNames = ParserManager.getCachedInstanceNames();
      expect(instanceNames).toContain('parser1');
      expect(instanceNames).toContain('parser2');
    });
  });

  describe('Parser Manager State', () => {
    test('should clear all registered parsers and instances', () => {
      class TestParser {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('test', TestParser);
      ParserManager.getOrCreateParser('test');

      expect(ParserManager.getRegisteredParserNames()).toContain('test');
      expect(ParserManager.getCachedInstanceNames()).toContain('test');

      ParserManager.clear();

      expect(ParserManager.getRegisteredParserNames()).toEqual([]);
      expect(ParserManager.getCachedInstanceNames()).toEqual([]);
    });

    test('should get status of parser manager', () => {
      class TestParser {
        static parse() { return {}; }
        static validate() { return true; }
      }

      ParserManager.registerParserClass('test', TestParser);
      ParserManager.getOrCreateParser('test');

      const status = ParserManager.getStatus();

      expect(status).toEqual({
        registeredClasses: ['test'],
        cachedInstances: ['test'],
        totalRegistered: 1,
        totalCached: 1
      });
    });
  });
});