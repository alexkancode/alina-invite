import { describe, test, expect } from 'vitest';
import { DriftRule } from '../../lib/annotations/drift-rule.js';

describe('DriftRule Annotation', () => {
  test('should attach configuration metadata to class', () => {
    const config = {
      name: 'test-rule',
      description: 'Test drift rule',
      parsers: ['typescript', 'package'],
      compatibilityRules: ['version-check'],
      severity: 'error',
      schema: []
    };

    class TestRule {}
    DriftRule(config)(TestRule);

    expect(TestRule._driftRuleConfig).toEqual(config);
  });

  test('should provide default values for optional properties', () => {
    class MinimalRule {}
    DriftRule({ name: 'minimal-rule' })(MinimalRule);

    expect(MinimalRule._driftRuleConfig).toEqual({
      name: 'minimal-rule',
      description: '',
      parsers: [],
      compatibilityRules: [],
      severity: 'error',
      schema: []
    });
  });

  test('should preserve original class functionality', () => {
    class FunctionalRule {
      testMethod() {
        return 'working';
      }
    }
    DriftRule({ name: 'functional-rule' })(FunctionalRule);

    const instance = new FunctionalRule();
    expect(instance.testMethod()).toBe('working');
  });

  test('should handle multiple annotations on same class', () => {
    const config1 = { name: 'first-rule' };
    const config2 = { name: 'second-rule', description: 'Updated' };

    class MultiAnnotatedRule {}
    DriftRule(config1)(MultiAnnotatedRule);
    DriftRule(config2)(MultiAnnotatedRule);

    // Last annotation should win
    expect(MultiAnnotatedRule._driftRuleConfig.name).toBe('second-rule');
    expect(MultiAnnotatedRule._driftRuleConfig.description).toBe('Updated');
  });

  test('should validate required name property', () => {
    expect(() => {
      class InvalidRule {}
      DriftRule({})(InvalidRule);
    }).toThrow('Rule name is required');
  });

  test('should validate parsers array', () => {
    expect(() => {
      class InvalidParsersRule {}
      DriftRule({ name: 'invalid', parsers: 'not-array' })(InvalidParsersRule);
    }).toThrow('Parsers must be an array');
  });

  test('should validate compatibility rules array', () => {
    expect(() => {
      class InvalidCompatibilityRule {}
      DriftRule({ name: 'invalid', compatibilityRules: 'not-array' })(InvalidCompatibilityRule);
    }).toThrow('Compatibility rules must be an array');
  });

  test('should validate severity values', () => {
    expect(() => {
      class InvalidSeverityRule {}
      DriftRule({ name: 'invalid', severity: 'invalid-severity' })(InvalidSeverityRule);
    }).toThrow('Severity must be "error", "warn", or "off"');
  });

  test('should support all valid severity levels', () => {
    const severities = ['error', 'warn', 'off'];

    severities.forEach(severity => {
      class SeverityRule {}
      DriftRule({ name: `rule-${severity}`, severity })(SeverityRule);

      expect(SeverityRule._driftRuleConfig.severity).toBe(severity);
    });
  });

  test('should preserve class inheritance', () => {
    class BaseRule {
      baseMethod() {
        return 'base';
      }
    }

    class InheritedRule extends BaseRule {
      derivedMethod() {
        return 'derived';
      }
    }
    DriftRule({ name: 'inherited-rule' })(InheritedRule);

    const instance = new InheritedRule();
    expect(instance.baseMethod()).toBe('base');
    expect(instance.derivedMethod()).toBe('derived');
    expect(InheritedRule._driftRuleConfig.name).toBe('inherited-rule');
  });
});