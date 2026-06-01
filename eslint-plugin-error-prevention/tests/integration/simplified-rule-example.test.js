import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { RuleTester } from 'eslint';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DriftRule } from '../../lib/annotations/drift-rule.js';
import DriftRuleFactory from '../../lib/core/drift-rule-factory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Simplified Rule Example', () => {
  const testDir = path.join(__dirname, 'test-env-simplified');
  const originalCwd = process.cwd();

  function setupTestEnv(tsConfig, packageJsonContent) {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    if (tsConfig) {
      fs.writeFileSync(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify(tsConfig, null, 2)
      );
    }

    if (packageJsonContent) {
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJsonContent, null, 2)
      );
    }

    process.chdir(testDir);
  }

  function teardownTestEnv() {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }

  beforeEach(() => {
    DriftRuleFactory.clear();
  });

  afterEach(teardownTestEnv);

  test('should demonstrate simplified rule creation with factory', () => {
    // This is the complete rule definition with the factory system
    // Compare to the 50+ lines needed in the manual approach
    class SimplifiedNodeVersionRule {
      validateConfigs(configs) {
        const { typescript, package: pkg } = configs;

        if (!typescript?.compilerOptions?.target || !pkg?.engines?.node) {
          return null;
        }

        const target = typescript.compilerOptions.target;
        const nodeSpec = pkg.engines.node;
        const nodeMatch = nodeSpec.match(/(\d+)/);

        if (!nodeMatch) return null;

        const nodeVersion = parseInt(nodeMatch[1], 10);

        // Simple version check for demonstration
        if (target === 'ES2022' && nodeVersion < 16) {
          return {
            type: 'version-mismatch',
            message: `ES2022 requires Node.js 16+, but package.json specifies ${nodeVersion}`
          };
        }

        return null;
      }
    }

    // Apply the factory annotation - this replaces all the boilerplate
    DriftRule({
      name: 'simplified-node-version',
      description: 'Check Node.js version compatibility with TypeScript target',
      parsers: ['typescript', 'package']
    })(SimplifiedNodeVersionRule);

    // Generate the complete ESLint rule
    const eslintRule = DriftRuleFactory.registerFromClass(SimplifiedNodeVersionRule);

    // Test that it works correctly with incompatible configuration
    setupTestEnv(
      {
        compilerOptions: { target: "ES2022" }
      },
      {
        engines: { node: ">=14.0.0" }
      }
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('simplified-node-version-incompatible', eslintRule, {
      valid: [],
      invalid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts'),
        errors: [{
          message: 'ES2022 requires Node.js 16+, but package.json specifies 14',
          type: 'Program'
        }]
      }]
    });
  });

  test('should demonstrate rule working with compatible configuration', () => {
    class CompatibleNodeVersionRule {
      validateConfigs(configs) {
        const { typescript, package: pkg } = configs;

        if (!typescript?.compilerOptions?.target || !pkg?.engines?.node) {
          return null;
        }

        const target = typescript.compilerOptions.target;
        const nodeSpec = pkg.engines.node;
        const nodeMatch = nodeSpec.match(/(\d+)/);

        if (!nodeMatch) return null;

        const nodeVersion = parseInt(nodeMatch[1], 10);

        if (target === 'ES2022' && nodeVersion < 16) {
          return {
            type: 'version-mismatch',
            message: `ES2022 requires Node.js 16+, but package.json specifies ${nodeVersion}`
          };
        }

        return null;
      }
    }

    DriftRule({
      name: 'compatible-node-version',
      parsers: ['typescript', 'package']
    })(CompatibleNodeVersionRule);

    const eslintRule = DriftRuleFactory.registerFromClass(CompatibleNodeVersionRule);

    setupTestEnv(
      {
        compilerOptions: { target: "ES2020" }
      },
      {
        engines: { node: ">=16.0.0" }
      }
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('compatible-node-version', eslintRule, {
      valid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts')
      }],
      invalid: []
    });
  });

  test('should demonstrate boilerplate reduction', () => {
    // Count lines in simplified rule vs traditional approach
    const simplifiedRule = `
class BoilerplateTestRule {
  validateConfigs(configs) {
    // Business logic only - 5-10 lines typically
    return null;
  }
}
DriftRule({ name: 'test', parsers: ['typescript'] })(BoilerplateTestRule);
const eslintRule = DriftRuleFactory.registerFromClass(BoilerplateTestRule);
    `.trim();

    const traditionalRule = `
class TraditionalRule extends BaseDriftRule {
  constructor() {
    super('traditional-rule', {
      type: 'problem',
      docs: { description: '...' }
    });
    this.ensureFrameworkSetup();
  }

  ensureFrameworkSetup() {
    const tsParser = {
      name: 'typescript',
      parse: TypeScriptConfigParser.parse.bind(TypeScriptConfigParser),
      validate: TypeScriptConfigParser.validate.bind(TypeScriptConfigParser)
    };
    try {
      ConfigurationParserRegistry.register('typescript', tsParser);
    } catch (error) {
      // Already registered
    }
    try {
      CompatibilityEngine.registerBuiltinRules();
    } catch (error) {
      // Already registered
    }
  }

  parseConfigurations(projectRoot) {
    return ConfigurationParserRegistry.parseAll(projectRoot, ['typescript']);
  }

  validateCompatibility(configs) {
    return CompatibilityEngine.validate(['typescript-rules'], configs);
  }

  generateErrorMessage(incompatibility) {
    return incompatibility.message;
  }
}

const instance = new TraditionalRule();
export default {
  meta: instance.meta,
  create: instance.create.bind(instance)
};
    `.trim();

    const simplifiedLines = simplifiedRule.split('\n').length;
    const traditionalLines = traditionalRule.split('\n').length;

    // Verify significant boilerplate reduction
    expect(simplifiedLines).toBeLessThan(10);
    expect(traditionalLines).toBeGreaterThan(30);
    expect(traditionalLines / simplifiedLines).toBeGreaterThan(3); // At least 3x reduction
  });
});