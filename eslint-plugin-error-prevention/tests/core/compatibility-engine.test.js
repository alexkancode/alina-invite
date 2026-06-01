import { describe, test, expect, beforeEach, vi } from 'vitest';
import CompatibilityEngine from '../../lib/core/compatibility-engine.js';

describe('CompatibilityEngine', () => {
  beforeEach(() => {
    CompatibilityEngine.clear();
  });

  describe('Rule Registration', () => {
    test('should register compatibility rule', () => {
      const validator = (configs) => {
        if (configs.typescript?.target === 'ES2022' && configs.package?.nodeVersion < 16) {
          return {
            type: 'version-mismatch',
            message: 'ES2022 requires Node.js 16+',
            severity: 'error'
          };
        }
        return null;
      };

      CompatibilityEngine.addRule('typescript-node-version', validator);

      const rule = CompatibilityEngine.getRule('typescript-node-version');
      expect(rule).toBe(validator);
    });

    test('should prevent duplicate rule registration', () => {
      const validator1 = () => null;
      const validator2 = () => null;

      CompatibilityEngine.addRule('duplicate', validator1);

      expect(() => {
        CompatibilityEngine.addRule('duplicate', validator2);
      }).toThrow('Compatibility rule "duplicate" already registered');
    });

    test('should reject non-function validators', () => {
      expect(() => {
        CompatibilityEngine.addRule('invalid', 'not a function');
      }).toThrow('Validator must be a function');
    });
  });

  describe('Compatibility Validation', () => {
    test('should run single compatibility rule', () => {
      const validator = vi.fn().mockReturnValue({
        type: 'mismatch',
        message: 'Configuration mismatch detected'
      });

      CompatibilityEngine.addRule('test-rule', validator);

      const configs = {
        typescript: { target: 'ES2022' },
        package: { nodeVersion: 14 }
      };

      const results = CompatibilityEngine.validate(['test-rule'], configs);

      expect(validator).toHaveBeenCalledWith(configs);
      expect(results).toEqual([{
        rule: 'test-rule',
        type: 'mismatch',
        message: 'Configuration mismatch detected'
      }]);
    });

    test('should run multiple compatibility rules', () => {
      const validator1 = vi.fn().mockReturnValue({
        type: 'version-mismatch',
        message: 'Version issue'
      });

      const validator2 = vi.fn().mockReturnValue({
        type: 'build-mismatch',
        message: 'Build issue'
      });

      CompatibilityEngine.addRule('version-check', validator1);
      CompatibilityEngine.addRule('build-check', validator2);

      const configs = { test: 'data' };
      const results = CompatibilityEngine.validate(['version-check', 'build-check'], configs);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        rule: 'version-check',
        type: 'version-mismatch',
        message: 'Version issue'
      });
      expect(results[1]).toEqual({
        rule: 'build-check',
        type: 'build-mismatch',
        message: 'Build issue'
      });
    });

    test('should filter out null results from validators', () => {
      const validatingRule = vi.fn().mockReturnValue({
        type: 'issue',
        message: 'Found issue'
      });

      const passingRule = vi.fn().mockReturnValue(null);

      CompatibilityEngine.addRule('finds-issue', validatingRule);
      CompatibilityEngine.addRule('no-issue', passingRule);

      const results = CompatibilityEngine.validate(['finds-issue', 'no-issue'], {});

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBe('finds-issue');
    });

    test('should handle validator errors gracefully', () => {
      const errorRule = vi.fn().mockImplementation(() => {
        throw new Error('Validator crashed');
      });

      const workingRule = vi.fn().mockReturnValue({
        type: 'success',
        message: 'Working fine'
      });

      CompatibilityEngine.addRule('error-rule', errorRule);
      CompatibilityEngine.addRule('working-rule', workingRule);

      const results = CompatibilityEngine.validate(['error-rule', 'working-rule'], {});

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        rule: 'error-rule',
        type: 'validation-error',
        message: 'Validator error: Validator crashed'
      });
      expect(results[1]).toEqual({
        rule: 'working-rule',
        type: 'success',
        message: 'Working fine'
      });
    });

    test('should skip unregistered rules', () => {
      const validator = vi.fn().mockReturnValue({ type: 'test' });
      CompatibilityEngine.addRule('existing', validator);

      const results = CompatibilityEngine.validate(['existing', 'nonexistent'], {});

      expect(results).toHaveLength(1);
      expect(results[0].rule).toBe('existing');
    });
  });

  describe('Rule Management', () => {
    test('should list all registered rule names', () => {
      CompatibilityEngine.addRule('rule1', () => null);
      CompatibilityEngine.addRule('rule2', () => null);
      CompatibilityEngine.addRule('rule3', () => null);

      const names = CompatibilityEngine.getRegisteredRules();
      expect(names).toEqual(['rule1', 'rule2', 'rule3']);
    });

    test('should clear all registered rules', () => {
      CompatibilityEngine.addRule('clearable', () => null);
      expect(CompatibilityEngine.getRule('clearable')).toBeDefined();

      CompatibilityEngine.clear();
      expect(CompatibilityEngine.getRule('clearable')).toBeUndefined();
      expect(CompatibilityEngine.getRegisteredRules()).toEqual([]);
    });
  });

  describe('Built-in Compatibility Rules', () => {
    test('should register TypeScript-Node.js version compatibility rule', () => {
      CompatibilityEngine.registerBuiltinRules();

      const rule = CompatibilityEngine.getRule('typescript-target-node-version');
      expect(rule).toBeDefined();

      // Test ES2022 with Node 14 (should fail)
      const incompatibleConfigs = {
        typescript: { compilerOptions: { target: 'ES2022' } },
        package: { engines: { node: '>=14.0.0' } }
      };

      const result = rule(incompatibleConfigs);
      expect(result).toEqual({
        type: 'version-mismatch',
        message: 'TypeScript target "ES2022" incompatible with Node.js 14.x. ES2022 features require Node.js 16.11+',
        data: { target: 'ES2022', nodeVersion: 14, requiredVersion: 16.11 }
      });

      // Test ES2020 with Node 16 (should pass)
      const compatibleConfigs = {
        typescript: { compilerOptions: { target: 'ES2020' } },
        package: { engines: { node: '>=16.0.0' } }
      };

      const compatibleResult = rule(compatibleConfigs);
      expect(compatibleResult).toBeNull();
    });

    test('should register module resolution build tool rule', () => {
      CompatibilityEngine.registerBuiltinRules();

      const rule = CompatibilityEngine.getRule('module-resolution-build-tool');
      expect(rule).toBeDefined();

      // Test bundler resolution without build tool (should fail)
      const incompatibleConfigs = {
        typescript: { compilerOptions: { moduleResolution: 'bundler' } },
        buildTool: { type: null, exists: false }
      };

      const result = rule(incompatibleConfigs);
      expect(result).toEqual({
        type: 'module-resolution-mismatch',
        message: 'TypeScript moduleResolution "bundler" requires a compatible build tool (Vite, Webpack 5+, etc.) but none detected',
        data: { resolution: 'bundler' }
      });

      // Test bundler with Vite (should pass)
      const compatibleConfigs = {
        typescript: { compilerOptions: { moduleResolution: 'bundler' } },
        buildTool: { type: 'vite', exists: true }
      };

      const compatibleResult = rule(compatibleConfigs);
      expect(compatibleResult).toBeNull();
    });
  });
});