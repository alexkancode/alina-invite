import { describe, test, expect, beforeEach, vi } from 'vitest';
import BaseDriftRule from '../../lib/core/base-rule.js';

describe('BaseDriftRule', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      getFilename: vi.fn().mockReturnValue('/test/project/src/test.ts'),
      filename: '/test/project/src/test.ts',
      report: vi.fn()
    };
  });

  describe('Abstract Methods', () => {
    test('should throw error when parseConfigurations not implemented', () => {
      const rule = new BaseDriftRule('test-rule', {
        type: 'problem',
        docs: { description: 'Test rule' }
      });

      expect(() => {
        rule.parseConfigurations('/test/project');
      }).toThrow('Must implement parseConfigurations method');
    });

    test('should throw error when validateCompatibility not implemented', () => {
      const rule = new BaseDriftRule('test-rule', {
        type: 'problem',
        docs: { description: 'Test rule' }
      });

      expect(() => {
        rule.validateCompatibility({});
      }).toThrow('Must implement validateCompatibility method');
    });

    test('should throw error when generateErrorMessage not implemented', () => {
      const rule = new BaseDriftRule('test-rule', {
        type: 'problem',
        docs: { description: 'Test rule' }
      });

      expect(() => {
        rule.generateErrorMessage({});
      }).toThrow('Must implement generateErrorMessage method');
    });
  });

  describe('ESLint Rule Creation', () => {
    class TestDriftRule extends BaseDriftRule {
      parseConfigurations(projectRoot) {
        return {
          typescript: { target: 'ES2022' },
          package: { engines: { node: '>=14.0.0' } }
        };
      }

      validateCompatibility(configs) {
        if (configs.typescript.target === 'ES2022' &&
            configs.package.engines.node.includes('14')) {
          return [{
            type: 'version-mismatch',
            message: 'ES2022 requires Node.js 16+',
            data: { target: 'ES2022', nodeVersion: '14' }
          }];
        }
        return [];
      }

      generateErrorMessage(incompatibility) {
        return `TypeScript target ${incompatibility.data.target} incompatible with Node.js ${incompatibility.data.nodeVersion}`;
      }
    }

    test('should create valid ESLint rule structure', () => {
      const rule = new TestDriftRule('test-rule', {
        type: 'problem',
        docs: { description: 'Test rule' },
        messages: {
          versionMismatch: 'Version mismatch detected'
        }
      });

      const eslintRule = rule.create(mockContext);

      expect(eslintRule).toHaveProperty('Program');
      expect(typeof eslintRule.Program).toBe('function');
    });

    test('should execute drift check and report issues', () => {
      const rule = new TestDriftRule('test-rule', {
        type: 'problem',
        docs: { description: 'Test rule' },
        messages: {
          versionMismatch: 'Version mismatch: {{message}}'
        }
      });

      const eslintRule = rule.create(mockContext);
      const mockNode = { type: 'Program' };

      eslintRule.Program(mockNode);

      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'configDrift',
        data: {
          message: 'TypeScript target ES2022 incompatible with Node.js 14'
        }
      });
    });

    test('should not report when no incompatibilities found', () => {
      class ValidConfigRule extends BaseDriftRule {
        parseConfigurations() {
          return {
            typescript: { target: 'ES2020' },
            package: { engines: { node: '>=16.0.0' } }
          };
        }

        validateCompatibility() {
          return []; // No incompatibilities
        }

        generateErrorMessage() {
          return '';
        }
      }

      const rule = new ValidConfigRule('valid-rule', {
        type: 'problem',
        docs: { description: 'Valid rule' }
      });

      const eslintRule = rule.create(mockContext);
      const mockNode = { type: 'Program' };

      eslintRule.Program(mockNode);

      expect(mockContext.report).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    class ErrorProneRule extends BaseDriftRule {
      parseConfigurations() {
        throw new Error('Configuration parsing failed');
      }

      validateCompatibility() {
        return [];
      }

      generateErrorMessage() {
        return '';
      }
    }

    test('should handle parsing errors gracefully', () => {
      const rule = new ErrorProneRule('error-rule', {
        type: 'problem',
        docs: { description: 'Error prone rule' }
      });

      const eslintRule = rule.create(mockContext);
      const mockNode = { type: 'Program' };

      eslintRule.Program(mockNode);

      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'parseError',
        data: {
          error: 'Configuration parsing failed'
        }
      });
    });
  });

  describe('Rule Metadata', () => {
    test('should preserve rule metadata', () => {
      const metadata = {
        type: 'problem',
        docs: {
          description: 'Test drift detection rule',
          category: 'Configuration Issues'
        },
        messages: {
          customMessage: 'Custom error message'
        }
      };

      const rule = new BaseDriftRule('metadata-test', metadata);

      expect(rule.name).toBe('metadata-test');
      expect(rule.meta.type).toBe(metadata.type);
      expect(rule.meta.docs).toEqual(metadata.docs);
      expect(rule.meta.messages.customMessage).toBe('Custom error message');
      expect(rule.meta.messages.configDrift).toBe('{{message}}');
      expect(rule.meta.messages.parseError).toBe('Configuration parse error: {{error}}');
    });

    test('should provide default error message IDs', () => {
      const rule = new BaseDriftRule('default-messages', {
        type: 'problem',
        docs: { description: 'Default messages test' }
      });

      expect(rule.meta.messages).toHaveProperty('configDrift');
      expect(rule.meta.messages).toHaveProperty('parseError');
    });
  });
});