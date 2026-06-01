import { RuleTester } from 'eslint';
import rule from '../../lib/rules/validate-tsconfig-consistency.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

// Create test environment setup and teardown
const testDir = path.join(__dirname, 'test-env');
const originalCwd = process.cwd();

function setupTestEnv(tsConfig, packageJsonContent) {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  if (tsConfig) {
    fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  }

  if (packageJsonContent) {
    fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2));
  }

  // Change to test directory
  process.chdir(testDir);
}

function teardownTestEnv() {
  process.chdir(originalCwd);
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// Test compatible configuration
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
    engines: { node: ">=16.0.0" },
    devDependencies: { vite: "^4.0.0" }
  }
);

ruleTester.run('validate-tsconfig-consistency', rule, {
  valid: [
    // Compatible TypeScript and Node.js configuration
    {
      code: 'import { helper } from "./utils";',
      options: [{ checkNodeVersion: true, checkModuleResolution: true }],
      filename: path.join(testDir, 'test-compatible.ts')
    }
  ],

  invalid: []
});

teardownTestEnv();

// Test incompatible configuration (ES2022 with Node 14)
setupTestEnv(
  {
    compilerOptions: {
      target: "ES2022",
      moduleResolution: "bundler"
    }
  },
  {
    engines: { node: ">=14.0.0" }
  }
);

ruleTester.run('validate-tsconfig-consistency-incompatible', rule, {
  valid: [],

  invalid: [
    {
      code: 'const using = new DisposableStack();',
      options: [{ checkNodeVersion: true }],
      filename: path.join(testDir, 'test-incompatible.ts'),
      errors: [{
        message: 'TypeScript target "ES2022" incompatible with Node.js 14.x (package.json engines). ES2022 features require Node.js 16.11+',
        type: 'Program'
      }]
    }
  ]
});

teardownTestEnv();