import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DockerConfigParser } from '../../lib/core/config-parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DockerConfigParser', () => {
  const testDir = path.join(__dirname, 'test-docker-parser');

  function setupTestEnv(dockerFiles) {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    Object.entries(dockerFiles).forEach(([filename, content]) => {
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

  describe('Docker Compose File Parsing', () => {
    test('should parse basic docker-compose.yml', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    ports:
      - "5432:5432"
  web:
    build: .
    ports:
      - "3000:3000"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.files['docker-compose.yml'].services).toHaveProperty('database');
      expect(result.files['docker-compose.yml'].services).toHaveProperty('web');
      expect(result.files['docker-compose.yml'].services.database.ports).toEqual(['5432:5432']);
    });

    test('should handle multiple docker-compose files', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    ports:
      - "5432:5432"`,
        'docker-compose.prod.yml': `services:
  prod-db:
    image: postgres:15
    ports:
      - "3306:3306"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(Object.keys(result.files)).toContain('docker-compose.yml');
      expect(Object.keys(result.files)).toContain('docker-compose.prod.yml');
      expect(result.files['docker-compose.prod.yml'].services.prodDb).toBeUndefined();
    });

    test('should handle quoted port mappings', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  db:
    ports:
      - "5432:5432"
      - 3306:3306`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.files['docker-compose.yml'].services.db.ports).toContain('5432:5432');
      expect(result.files['docker-compose.yml'].services.db.ports).toContain('3306:3306');
    });

    test('should handle complex indentation', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    environment:
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
      - "5433:5433"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.files['docker-compose.yml'].services.database.ports).toEqual(['5432:5432', '5433:5433']);
    });

    test('should handle missing files gracefully', () => {
      setupTestEnv({});

      const result = DockerConfigParser.parse(testDir);

      expect(result.files).toEqual({});
      expect(result.type).toBe('docker');
      expect(result.path).toBe(testDir);
    });

    test('should handle malformed files gracefully', () => {
      setupTestEnv({
        'docker-compose.yml': `invalid: yaml: content: [
          incomplete`,
        'docker-compose.prod.yml': `services:
  database:
    ports:
      - "5432:5432"`
      });

      const result = DockerConfigParser.parse(testDir);

      // Should parse both files, even if one is malformed (creates empty services)
      expect(result.files).toHaveProperty('docker-compose.yml');
      expect(result.files).toHaveProperty('docker-compose.prod.yml');
      expect(result.files['docker-compose.yml'].services).toEqual({});
      expect(result.files['docker-compose.prod.yml'].services.database).toBeDefined();
    });
  });

  describe('Database Service Detection', () => {
    test('should identify database services by name patterns', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    ports:
      - "5432:5432"
  db:
    image: mysql:8
    ports:
      - "3306:3306"
  postgres-main:
    image: postgres:15
    ports:
      - "5433:5433"
  web:
    build: .
    ports:
      - "3000:3000"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.database).toHaveProperty('database');
      expect(result.database).toHaveProperty('db');
      expect(result.database).toHaveProperty('postgres-main');
      expect(result.database).not.toHaveProperty('web');
    });

    test('should include port information in database services', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    ports:
      - "5432:5432"
      - "5433:5433"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.database.database).toEqual({
        file: 'docker-compose.yml',
        ports: ['5432:5432', '5433:5433']
      });
    });

    test('should handle services without ports', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    image: postgres:14
    environment:
      POSTGRES_DB: myapp`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.database.database).toEqual({
        file: 'docker-compose.yml',
        ports: []
      });
    });

    test('should detect MySQL and PostgreSQL service names', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  mysql-primary:
    image: mysql:8
    ports:
      - "3306:3306"
  postgres-backup:
    image: postgres:14
    ports:
      - "5432:5432"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result.database).toHaveProperty('mysql-primary');
      expect(result.database).toHaveProperty('postgres-backup');
    });
  });

  describe('Parser Validation', () => {
    test('should validate successful parsing', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    ports:
      - "5432:5432"`
      });

      const result = DockerConfigParser.parse(testDir);
      const isValid = DockerConfigParser.validate(result);

      expect(isValid).toBe(true);
    });

    test('should invalidate when no docker files found', () => {
      setupTestEnv({});

      const result = DockerConfigParser.parse(testDir);
      const isValid = DockerConfigParser.validate(result);

      expect(isValid).toBe(false);
    });

    test('should invalidate null or error results', () => {
      expect(DockerConfigParser.validate(null)).toBe(false);
      expect(DockerConfigParser.validate({ error: 'Parse failed' })).toBe(false);
    });
  });

  describe('Parser Interface Compliance', () => {
    test('should have required static methods', () => {
      expect(typeof DockerConfigParser.parse).toBe('function');
      expect(typeof DockerConfigParser.validate).toBe('function');
      expect(DockerConfigParser.name).toBe('docker');
    });

    test('should return consistent structure', () => {
      setupTestEnv({
        'docker-compose.yml': `services:
  database:
    ports:
      - "5432:5432"`
      });

      const result = DockerConfigParser.parse(testDir);

      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('type');
      expect(result.type).toBe('docker');
    });
  });
});