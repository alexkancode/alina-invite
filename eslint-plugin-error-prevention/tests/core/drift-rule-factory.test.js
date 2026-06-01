import { describe, test, expect, beforeEach, vi } from 'vitest';
import DriftRuleFactory from '../../lib/core/drift-rule-factory.js';
import { DriftRule } from '../../lib/annotations/drift-rule.js';
import ParserManager from '../../lib/core/parser-manager.js';
import ConfigurationParserRegistry from '../../lib/core/parser-registry.js';
import CompatibilityEngine from '../../lib/core/compatibility-engine.js';

describe('DriftRuleFactory', () => {
  beforeEach(() => {
    DriftRuleFactory.clear();
    ParserManager.clear();
    ConfigurationParserRegistry.clear();
    CompatibilityEngine.clear();
  });

  describe('Rule Registration from Class', () => {
    test('should register annotated class as ESLint rule', () => {
      class TestRule {
        validateConfigs() {
          return null;
        }
      }
      DriftRule({
        name: 'test-rule',
        description: 'Test drift detection rule'
      })(TestRule);

      const eslintRule = DriftRuleFactory.registerFromClass(TestRule);

      expect(eslintRule).toBeDefined();
      expect(eslintRule.meta.docs.description).toBe('Test drift detection rule');
      expect(typeof eslintRule.create).toBe('function');
    });

    test('should reject class without annotation', () => {
      class UnannotatedRule {}

      expect(() => {
        DriftRuleFactory.registerFromClass(UnannotatedRule);
      }).toThrow('Class must have @DriftRule annotation');
    });

    test('should auto-setup parsers for rule', () => {
      class ParserTestRule {}
      DriftRule({
        name: 'parser-test-rule',
        parsers: ['typescript', 'package']
      })(ParserTestRule);

      ParserManager.initializeDefaultParsers();
      DriftRuleFactory.registerFromClass(ParserTestRule);

      // Verify parsers were registered with ConfigurationParserRegistry
      expect(ConfigurationParserRegistry.get('typescript')).toBeDefined();
      expect(ConfigurationParserRegistry.get('package')).toBeDefined();
    });

    test('should setup compatibility rules', () => {
      class CompatibilityTestRule {}
      DriftRule({
        name: 'compatibility-test-rule',
        compatibilityRules: ['test-rule-1', 'test-rule-2']
      })(CompatibilityTestRule);

      const factorySpy = vi.spyOn(DriftRuleFactory, 'setupCompatibilityRules');

      DriftRuleFactory.registerFromClass(CompatibilityTestRule);

      expect(factorySpy).toHaveBeenCalledWith(['test-rule-1', 'test-rule-2']);
    });

    test('should store registered rule', () => {
      class StoredRule {}
      DriftRule({
        name: 'stored-rule'
      })(StoredRule);

      const rule = DriftRuleFactory.registerFromClass(StoredRule);

      expect(DriftRuleFactory.getRegisteredRule('stored-rule')).toBe(rule);
      expect(DriftRuleFactory.getRegisteredRuleNames()).toContain('stored-rule');
    });
  });

  describe('ESLint Rule Generation', () => {
    test('should generate complete ESLint rule metadata', () => {
      const config = {
        name: 'metadata-rule',
        description: 'Rule for testing metadata generation',
        severity: 'warn',
        schema: [{ type: 'object' }]
      };

      class MetadataRule {}
      DriftRule(config)(MetadataRule);

      const eslintRule = DriftRuleFactory.registerFromClass(MetadataRule);

      expect(eslintRule.meta).toEqual({
        type: 'problem',
        docs: {
          description: config.description,
          category: 'Configuration Issues'
        },
        messages: {
          configDrift: '{{message}}',
          parseError: 'Configuration parse error: {{error}}'
        },
        schema: config.schema
      });
    });

    test('should generate rule handler that calls business logic', () => {
      const mockValidation = vi.fn().mockReturnValue([{
        type: 'test-issue',
        message: 'Test validation failed'
      }]);

      class HandlerTestRule {
        validateConfigs = mockValidation;
      }
      DriftRule({
        name: 'handler-test-rule',
        parsers: ['typescript']
      })(HandlerTestRule);

      ParserManager.initializeDefaultParsers();
      const eslintRule = DriftRuleFactory.registerFromClass(HandlerTestRule);

      const mockContext = {
        getFilename: vi.fn().mockReturnValue('/test/project/file.ts'),
        report: vi.fn()
      };

      const ruleHandler = eslintRule.create(mockContext);
      const mockNode = { type: 'Program' };

      ruleHandler.Program(mockNode);

      expect(mockValidation).toHaveBeenCalled();
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'configDrift',
        data: { message: 'Test validation failed' }
      });
    });

    test('should handle errors in rule execution gracefully', () => {
      const mockValidation = vi.fn().mockImplementation(() => {
        throw new Error('Validation crashed');
      });

      class ErrorTestRule {
        validateConfigs = mockValidation;
      }
      DriftRule({
        name: 'error-test-rule'
      })(ErrorTestRule);

      const eslintRule = DriftRuleFactory.registerFromClass(ErrorTestRule);

      const mockContext = {
        getFilename: vi.fn().mockReturnValue('/test/project/file.ts'),
        report: vi.fn()
      };

      const ruleHandler = eslintRule.create(mockContext);
      const mockNode = { type: 'Program' };

      ruleHandler.Program(mockNode);

      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'parseError',
        data: { error: 'Validation crashed' }
      });
    });
  });

  describe('Framework Initialization', () => {
    test('should initialize framework once', () => {
      const initSpy = vi.spyOn(DriftRuleFactory, 'ensureFrameworkInitialized');

      class InitTest1 {}
      DriftRule({ name: 'init-test-1' })(InitTest1);

      class InitTest2 {}
      DriftRule({ name: 'init-test-2' })(InitTest2);

      DriftRuleFactory.registerFromClass(InitTest1);
      DriftRuleFactory.registerFromClass(InitTest2);

      expect(initSpy).toHaveBeenCalledTimes(2);
      expect(DriftRuleFactory.isInitialized()).toBe(true);
    });

    test('should setup built-in compatibility rules during initialization', () => {
      const compatSpy = vi.spyOn(CompatibilityEngine, 'registerBuiltinRules');

      class BuiltinTest {}
      DriftRule({ name: 'builtin-test' })(BuiltinTest);

      DriftRuleFactory.registerFromClass(BuiltinTest);

      expect(compatSpy).toHaveBeenCalled();
    });
  });

  describe('Factory State Management', () => {
    test('should track registered rules', () => {
      class TrackedRule1 {}
      DriftRule({ name: 'tracked-rule-1' })(TrackedRule1);

      class TrackedRule2 {}
      DriftRule({ name: 'tracked-rule-2' })(TrackedRule2);

      DriftRuleFactory.registerFromClass(TrackedRule1);
      DriftRuleFactory.registerFromClass(TrackedRule2);

      const names = DriftRuleFactory.getRegisteredRuleNames();
      expect(names).toContain('tracked-rule-1');
      expect(names).toContain('tracked-rule-2');
      expect(names.length).toBe(2);
    });

    test('should prevent duplicate rule registration', () => {
      class DuplicateRule1 {}
      DriftRule({ name: 'duplicate-rule' })(DuplicateRule1);

      class DuplicateRule2 {}
      DriftRule({ name: 'duplicate-rule' })(DuplicateRule2);

      DriftRuleFactory.registerFromClass(DuplicateRule1);

      expect(() => {
        DriftRuleFactory.registerFromClass(DuplicateRule2);
      }).toThrow('Rule "duplicate-rule" already registered');
    });

    test('should clear factory state', () => {
      class ClearableRule {}
      DriftRule({ name: 'clearable-rule' })(ClearableRule);

      DriftRuleFactory.registerFromClass(ClearableRule);

      expect(DriftRuleFactory.getRegisteredRuleNames()).toContain('clearable-rule');
      expect(DriftRuleFactory.isInitialized()).toBe(true);

      DriftRuleFactory.clear();

      expect(DriftRuleFactory.getRegisteredRuleNames()).toEqual([]);
      expect(DriftRuleFactory.isInitialized()).toBe(false);
    });

    test('should get factory status', () => {
      class StatusRule {}
      DriftRule({ name: 'status-rule' })(StatusRule);

      DriftRuleFactory.registerFromClass(StatusRule);

      const status = DriftRuleFactory.getStatus();

      expect(status).toEqual({
        initialized: true,
        registeredRules: ['status-rule'],
        totalRules: 1
      });
    });
  });
});