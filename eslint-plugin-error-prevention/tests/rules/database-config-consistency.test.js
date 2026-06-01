import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { RuleTester } from 'eslint';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DatabaseConfigConsistencyRule from '../../lib/rules/simplified/database-config-consistency.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Configuration Consistency Rule', () => {
  const testDir = path.join(__dirname, 'test-env-db-consistency');
  const originalCwd = process.cwd();

  function setupTestEnv(envFiles = {}, dockerFiles = {}) {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create environment files
    Object.entries(envFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(testDir, filename), content);
    });

    // Create docker files
    Object.entries(dockerFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(testDir, filename), content);
    });

    process.chdir(testDir);
  }

  function teardownTestEnv() {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }

  beforeEach(() => {
    teardownTestEnv();
  });

  afterEach(() => {
    teardownTestEnv();
  });

  test('should work with compatible database configuration', () => {
    setupTestEnv(
      // Environment files
      {
        '.env': 'DB_HOST=localhost\nDB_PORT=5432'
      },
      // Docker files
      {
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    ports:
      - "5432:5432"`
      }
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('database-config-consistency-compatible', DatabaseConfigConsistencyRule, {
      valid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.js')
      }],
      invalid: []
    });
  });

  test('should detect port mismatches between environment and Docker', () => {
    setupTestEnv(
      // Environment files
      {
        '.env': 'DB_HOST=localhost\nDB_PORT=3306'
      },
      // Docker files
      {
        'docker-compose.yml': `services:
  database:
    image: mysql:8
    ports:
      - "5432:3306"`
      }
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('database-config-consistency-port-mismatch', DatabaseConfigConsistencyRule, {
      valid: [],
      invalid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.js'),
        errors: [{
          message: 'Database port mismatch: Environment specifies 3306 but Docker service uses 5432',
          type: 'Program'
        }]
      }]
    });
  });

  test('should handle missing configuration gracefully', () => {
    setupTestEnv(
      // Only environment, no Docker
      { '.env': 'DB_HOST=localhost' },
      {}
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('database-config-consistency-missing-docker', DatabaseConfigConsistencyRule, {
      valid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.js')
      }],
      invalid: []
    });
  });

  test('should handle multiple database services', () => {
    setupTestEnv(
      // Environment files
      {
        '.env': 'DB_PORT=5432'
      },
      // Docker files with multiple database services
      {
        'docker-compose.yml': `services:
  primary-db:
    image: postgres:14
    ports:
      - "5432:5432"
  cache-db:
    image: redis:7
    ports:
      - "6379:6379"
  web:
    build: .`
      }
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('database-config-consistency-multiple-services', DatabaseConfigConsistencyRule, {
      valid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.js')
      }],
      invalid: []
    });
  });

  test('should detect multiple port configuration mismatches', () => {
    setupTestEnv(
      // Environment files
      {
        '.env': 'DB_PORT=3306'
      },
      // Docker files
      {
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    ports:
      - "5432:5432"
      - "5433:5433"`
      }
    );

    const ruleTester = new RuleTester({
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    });

    ruleTester.run('database-config-consistency-multi-port-mismatch', DatabaseConfigConsistencyRule, {
      valid: [],
      invalid: [{
        code: 'const test = true;',
        filename: path.join(testDir, 'test.js'),
        errors: [{
          message: 'Database port mismatch: Environment specifies 3306 but Docker service uses 5432',
          type: 'Program'
        }]
      }]
    });
  });

  test('should demonstrate automation framework usage', () => {
    // Verify the rule is properly generated by the factory system
    expect(DatabaseConfigConsistencyRule).toBeDefined();
    expect(typeof DatabaseConfigConsistencyRule.create).toBe('function');
    expect(DatabaseConfigConsistencyRule.meta).toBeDefined();
    expect(DatabaseConfigConsistencyRule.meta.docs.description).toContain('database configuration consistency');
  });

  test('should validate rule metadata from automation framework', () => {
    const { meta } = DatabaseConfigConsistencyRule;

    // Verify automation framework generated proper ESLint rule structure
    expect(meta.type).toBe('problem');
    expect(meta.docs.category).toBe('Configuration Issues');
    expect(meta.messages).toHaveProperty('configDrift');
    expect(meta.messages).toHaveProperty('parseError');
    expect(Array.isArray(meta.schema)).toBe(true);
  });
});