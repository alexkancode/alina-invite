import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EnvironmentConfigParser } from '../../lib/core/config-parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('EnvironmentConfigParser', () => {
  const testDir = path.join(__dirname, 'test-env-parser');

  function setupTestEnv(envFiles) {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    Object.entries(envFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(testDir, filename), content);
    });
  }

  function teardownTestEnv() {
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

  describe('Environment File Parsing', () => {
    test('should parse .env file correctly', () => {
      setupTestEnv({
        '.env': `DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret`
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.files['.env']).toEqual({
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'myapp',
        DB_USER: 'postgres',
        DB_PASSWORD: 'secret'
      });
    });

    test('should parse multiple environment files', () => {
      setupTestEnv({
        '.env': 'DB_HOST=localhost\nDB_PORT=5432',
        '.env.local': 'DB_HOST=127.0.0.1\nDB_USER=localuser',
        '.env.production': 'DB_HOST=prod.db.com\nDB_PORT=3306'
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(Object.keys(result.files)).toContain('.env');
      expect(Object.keys(result.files)).toContain('.env.local');
      expect(Object.keys(result.files)).toContain('.env.production');
      expect(result.files['.env.production'].DB_HOST).toBe('prod.db.com');
    });

    test('should handle quoted values', () => {
      setupTestEnv({
        '.env': `DB_NAME="my app database"
DB_URL='postgresql://user:pass@host:5432/db'`
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.files['.env'].DB_NAME).toBe('my app database');
      expect(result.files['.env'].DB_URL).toBe('postgresql://user:pass@host:5432/db');
    });

    test('should handle empty lines and comments', () => {
      setupTestEnv({
        '.env': `# Database configuration
DB_HOST=localhost

DB_PORT=5432
# End of config`
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.files['.env']).toEqual({
        DB_HOST: 'localhost',
        DB_PORT: '5432'
      });
    });

    test('should handle missing environment files gracefully', () => {
      setupTestEnv({});

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.files).toEqual({});
      expect(result.type).toBe('environment');
      expect(result.path).toBe(testDir);
    });
  });

  describe('Database Configuration Extraction', () => {
    test('should extract database configuration from environment variables', () => {
      setupTestEnv({
        '.env': `DB_HOST=localhost
DB_PORT=5432
DB_NAME=testdb
DB_USER=testuser
DATABASE_URL=postgresql://user:pass@host:5432/db`
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.database).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        url: 'postgresql://user:pass@host:5432/db'
      });
    });

    test('should merge database config from multiple files', () => {
      setupTestEnv({
        '.env': 'DB_HOST=localhost\nDB_PORT=5432',
        '.env.local': 'DB_USER=localuser',
        '.env.production': 'DB_HOST=prod.db.com\nDB_NAME=proddb'
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.database).toEqual({
        host: 'prod.db.com', // Last value wins
        port: 5432,
        user: 'localuser',
        database: 'proddb'
      });
    });

    test('should handle non-database environment variables', () => {
      setupTestEnv({
        '.env': `API_KEY=secret123
NODE_ENV=development
DB_PORT=5432
LOG_LEVEL=debug`
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.database).toEqual({
        port: 5432
      });
    });

    test('should convert port to integer', () => {
      setupTestEnv({
        '.env': 'DB_PORT=3306'
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result.database.port).toBe(3306);
      expect(typeof result.database.port).toBe('number');
    });
  });

  describe('Parser Validation', () => {
    test('should validate successful parsing', () => {
      setupTestEnv({
        '.env': 'DB_HOST=localhost'
      });

      const result = EnvironmentConfigParser.parse(testDir);
      const isValid = EnvironmentConfigParser.validate(result);

      expect(isValid).toBe(true);
    });

    test('should invalidate when no environment files found', () => {
      setupTestEnv({});

      const result = EnvironmentConfigParser.parse(testDir);
      const isValid = EnvironmentConfigParser.validate(result);

      expect(isValid).toBe(false);
    });

    test('should invalidate null or error results', () => {
      expect(EnvironmentConfigParser.validate(null)).toBe(false);
      expect(EnvironmentConfigParser.validate({ error: 'Parse failed' })).toBe(false);
    });
  });

  describe('Parser Interface Compliance', () => {
    test('should have required static methods', () => {
      expect(typeof EnvironmentConfigParser.parse).toBe('function');
      expect(typeof EnvironmentConfigParser.validate).toBe('function');
      expect(EnvironmentConfigParser.name).toBe('environment');
    });

    test('should return consistent structure', () => {
      setupTestEnv({
        '.env': 'DB_HOST=localhost'
      });

      const result = EnvironmentConfigParser.parse(testDir);

      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('type');
      expect(result.type).toBe('environment');
    });
  });
});