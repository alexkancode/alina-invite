import { describe, test, expect, beforeEach, vi } from 'vitest';
import ConfigurationParserRegistry from '../../lib/core/parser-registry.js';

describe('ConfigurationParserRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    ConfigurationParserRegistry.clear();
  });

  describe('Parser Registration', () => {
    test('should register a valid parser', () => {
      const mockParser = {
        name: 'test-parser',
        parse: (projectRoot) => ({ data: 'test' }),
        validate: (config) => true
      };

      ConfigurationParserRegistry.register('test', mockParser);

      const retrieved = ConfigurationParserRegistry.get('test');
      expect(retrieved).toBe(mockParser);
    });

    test('should reject parser without required interface', () => {
      const invalidParser = {
        name: 'invalid'
        // missing parse method
      };

      expect(() => {
        ConfigurationParserRegistry.register('invalid', invalidParser);
      }).toThrow('Parser must implement parse method');
    });

    test('should prevent duplicate parser registration', () => {
      const parser1 = {
        name: 'duplicate',
        parse: () => ({}),
        validate: () => true
      };

      const parser2 = {
        name: 'duplicate',
        parse: () => ({}),
        validate: () => true
      };

      ConfigurationParserRegistry.register('duplicate', parser1);

      expect(() => {
        ConfigurationParserRegistry.register('duplicate', parser2);
      }).toThrow('Parser "duplicate" already registered');
    });
  });

  describe('Parser Retrieval', () => {
    test('should return undefined for unregistered parser', () => {
      const result = ConfigurationParserRegistry.get('nonexistent');
      expect(result).toBeUndefined();
    });

    test('should return registered parser', () => {
      const mockParser = {
        name: 'retrievable',
        parse: () => ({}),
        validate: () => true
      };

      ConfigurationParserRegistry.register('retrievable', mockParser);

      const result = ConfigurationParserRegistry.get('retrievable');
      expect(result).toBe(mockParser);
    });
  });

  describe('Parse All Configurations', () => {
    test('should execute all registered parsers', () => {
      const parser1Results = { type: 'typescript', target: 'ES2020' };
      const parser2Results = { type: 'package', engines: { node: '>=16' } };

      const parser1 = {
        name: 'typescript',
        parse: vi.fn().mockReturnValue(parser1Results),
        validate: () => true
      };

      const parser2 = {
        name: 'package',
        parse: vi.fn().mockReturnValue(parser2Results),
        validate: () => true
      };

      ConfigurationParserRegistry.register('typescript', parser1);
      ConfigurationParserRegistry.register('package', parser2);

      const result = ConfigurationParserRegistry.parseAll('/test/project');

      expect(parser1.parse).toHaveBeenCalledWith('/test/project');
      expect(parser2.parse).toHaveBeenCalledWith('/test/project');
      expect(result).toEqual({
        typescript: parser1Results,
        package: parser2Results
      });
    });

    test('should handle parser errors gracefully', () => {
      const workingParser = {
        name: 'working',
        parse: () => ({ success: true }),
        validate: () => true
      };

      const failingParser = {
        name: 'failing',
        parse: () => { throw new Error('Parse failed'); },
        validate: () => true
      };

      ConfigurationParserRegistry.register('working', workingParser);
      ConfigurationParserRegistry.register('failing', failingParser);

      const result = ConfigurationParserRegistry.parseAll('/test/project');

      expect(result.working).toEqual({ success: true });
      expect(result.failing).toEqual({
        error: 'Parse failed',
        type: 'parse-error'
      });
    });

    test('should parse only required parsers when specified', () => {
      const tsParser = {
        name: 'typescript',
        parse: vi.fn().mockReturnValue({}),
        validate: () => true
      };

      const packageParser = {
        name: 'package',
        parse: vi.fn().mockReturnValue({}),
        validate: () => true
      };

      const buildParser = {
        name: 'build',
        parse: vi.fn().mockReturnValue({}),
        validate: () => true
      };

      ConfigurationParserRegistry.register('typescript', tsParser);
      ConfigurationParserRegistry.register('package', packageParser);
      ConfigurationParserRegistry.register('build', buildParser);

      ConfigurationParserRegistry.parseAll('/test/project', ['typescript', 'package']);

      expect(tsParser.parse).toHaveBeenCalled();
      expect(packageParser.parse).toHaveBeenCalled();
      expect(buildParser.parse).not.toHaveBeenCalled();
    });
  });

  describe('Registry Management', () => {
    test('should list all registered parser names', () => {
      const parsers = [
        { name: 'first', parse: () => ({}), validate: () => true },
        { name: 'second', parse: () => ({}), validate: () => true },
        { name: 'third', parse: () => ({}), validate: () => true }
      ];

      parsers.forEach(parser => {
        ConfigurationParserRegistry.register(parser.name, parser);
      });

      const names = ConfigurationParserRegistry.getRegisteredNames();
      expect(names).toEqual(['first', 'second', 'third']);
    });

    test('should clear all registered parsers', () => {
      const parser = {
        name: 'clearable',
        parse: () => ({}),
        validate: () => true
      };

      ConfigurationParserRegistry.register('clearable', parser);
      expect(ConfigurationParserRegistry.get('clearable')).toBe(parser);

      ConfigurationParserRegistry.clear();
      expect(ConfigurationParserRegistry.get('clearable')).toBeUndefined();
      expect(ConfigurationParserRegistry.getRegisteredNames()).toEqual([]);
    });
  });
});