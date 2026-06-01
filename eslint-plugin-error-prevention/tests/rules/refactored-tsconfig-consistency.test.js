import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { RuleTester } from 'eslint';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import RefactoredTsConfigRule from '../../lib/rules/refactored-tsconfig-consistency.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

describe('Refactored TypeScript Configuration Consistency Rule', () => {
  const testDir = path.join(__dirname, 'test-env-refactored');
  const originalCwd = process.cwd();

  function setupTestEnv(tsConfig, packageJsonContent, buildTool = null) {
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

    if (buildTool) {
      fs.writeFileSync(
        path.join(testDir, buildTool),
        'export default {}'
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

  afterEach(teardownTestEnv);

  test('should work with compatible configuration', () => {
    setupTestEnv(
      {
        compilerOptions: {
          target: "ES2020",
          moduleResolution: "node",
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"]
          }
        }
      },
      {
        engines: { node: ">=16.0.0" }
      }
    );

    ruleTester.run('refactored-compatible', RefactoredTsConfigRule, {
      valid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts')
      }],
      invalid: []
    });
  });

  test('should detect ES2022/Node.js 14 incompatibility', () => {
    setupTestEnv(
      {
        compilerOptions: {
          target: "ES2022",
          moduleResolution: "node"
        }
      },
      {
        engines: { node: ">=14.0.0" }
      }
    );

    ruleTester.run('refactored-incompatible', RefactoredTsConfigRule, {
      valid: [],
      invalid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts'),
        errors: [{
          message: 'TypeScript target "ES2022" incompatible with Node.js 14.x. ES2022 features require Node.js 16.11+',
          type: 'Program'
        }]
      }]
    });
  });

  test('should detect moduleResolution bundler without build tool', () => {
    setupTestEnv(
      {
        compilerOptions: {
          target: "ES2020",
          moduleResolution: "bundler"
        }
      },
      {
        engines: { node: ">=16.0.0" }
      }
    );

    ruleTester.run('refactored-bundler-no-tool', RefactoredTsConfigRule, {
      valid: [],
      invalid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts'),
        errors: [{
          message: 'TypeScript moduleResolution "bundler" requires a compatible build tool (Vite, Webpack 5+, etc.) but none detected',
          type: 'Program'
        }]
      }]
    });
  });

  test('should detect path mapping without baseUrl', () => {
    setupTestEnv(
      {
        compilerOptions: {
          target: "ES2020",
          moduleResolution: "node",
          paths: {
            "@/*": ["src/*"]
          }
        }
      },
      {
        engines: { node: ">=16.0.0" }
      }
    );

    ruleTester.run('refactored-path-mapping-no-base', RefactoredTsConfigRule, {
      valid: [],
      invalid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts'),
        errors: [{
          message: 'Path mapping "@/*" defined but baseUrl not configured. Imports may fail in production builds',
          type: 'Program'
        }]
      }]
    });
  });

  test('should allow bundler resolution with Vite', () => {
    setupTestEnv(
      {
        compilerOptions: {
          target: "ES2020",
          moduleResolution: "bundler",
          baseUrl: "."
        }
      },
      {
        engines: { node: ">=16.0.0" }
      },
      'vite.config.js'
    );

    ruleTester.run('refactored-bundler-with-vite', RefactoredTsConfigRule, {
      valid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.ts')
      }],
      invalid: []
    });
  });
});