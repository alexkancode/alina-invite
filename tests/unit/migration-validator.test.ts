import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import {
  validateMigrations,
  getAllMigrationFiles,
  formatValidationOutput
} from '../../scripts/migration-validator.ts';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    promises: {
      readdir: vi.fn(),
      readFile: vi.fn()
    }
  };
});

describe('Migration Validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllMigrationFiles', () => {
    it('should discover SQL migration files', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        '0001_create_users.sql',
        '0002_create_roles.sql',
        '0003_create_orders.sql',
        'README.md',
        'notes.txt'
      ] as any);

      vi.mocked(fs.readFile).mockImplementation(async (filePath: string) => {
        const fileName = filePath.toString().split('/').pop();
        switch (fileName) {
          case '0001_create_users.sql':
            return 'CREATE TABLE users (id SERIAL);';
          case '0002_create_roles.sql':
            return 'CREATE ROLE web_app;';
          case '0003_create_orders.sql':
            return 'GRANT SELECT ON orders TO web_app;';
          default:
            return '';
        }
      });

      const { migrationFiles } = await getAllMigrationFiles('./migrations');

      expect(migrationFiles).toHaveLength(3);
      expect(migrationFiles[0].fileName).toBe('0001_create_users.sql');
      expect(migrationFiles[1].fileName).toBe('0002_create_roles.sql');
      expect(migrationFiles[2].fileName).toBe('0003_create_orders.sql');
    });

    it('should sort migration files in order', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        '0003_grant_permissions.sql',
        '0001_create_tables.sql',
        '0002_create_roles.sql'
      ] as any);

      vi.mocked(fs.readFile).mockImplementation(async () => '-- migration content');

      const { migrationFiles } = await getAllMigrationFiles('./migrations');

      expect(migrationFiles.map(f => f.fileName)).toEqual([
        '0001_create_tables.sql',
        '0002_create_roles.sql',
        '0003_grant_permissions.sql'
      ]);
    });

    it('should handle empty migration directory', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([] as any);

      const { migrationFiles } = await getAllMigrationFiles('./migrations');

      expect(migrationFiles).toEqual([]);
    });

    it('should ignore non-SQL files', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        '0001_create_users.sql',
        'README.md',
        'schema.txt',
        '0002_create_roles.sql',
        'backup.sql.bak'
      ] as any);

      vi.mocked(fs.readFile).mockImplementation(async () => '-- migration content');

      const { migrationFiles } = await getAllMigrationFiles('./migrations');

      expect(migrationFiles).toHaveLength(2);
      expect(migrationFiles.map(f => f.fileName)).toEqual([
        '0001_create_users.sql',
        '0002_create_roles.sql'
      ]);
    });
  });

  describe('validateMigrations', () => {
    it('should validate migrations with no issues', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        '0001_create_roles.sql',
        '0002_grant_permissions.sql'
      ] as any);

      vi.mocked(fs.readFile).mockImplementation(async (filePath: string) => {
        const fileName = filePath.toString().split('/').pop();
        if (fileName === '0001_create_roles.sql') {
          return 'CREATE ROLE web_app;';
        }
        if (fileName === '0002_grant_permissions.sql') {
          return 'GRANT SELECT ON users TO web_app;';
        }
        return '';
      });

      const result = await validateMigrations('./migrations');

      expect(result.valid).toBe(true);
      expect(result.missingRoles).toEqual([]);
    });

    it('should detect missing role dependencies', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        '0001_grant_permissions.sql'
      ] as any);

      vi.mocked(fs.readFile).mockImplementation(async () => {
        return 'GRANT SELECT ON users TO web_app;';
      });

      const result = await validateMigrations('./migrations');

      expect(result.valid).toBe(false);
      expect(result.missingRoles).toEqual(['web_app']);
      expect(result.suggestions).toEqual(['CREATE ROLE web_app;']);
    });

    it('should handle file reading errors gracefully', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['0001_test.sql'] as any);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      const result = await validateMigrations('./migrations');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Error reading 0001_test.sql: Permission denied');
    });

    it('should handle directory reading errors', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'));

      const result = await validateMigrations('./migrations');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Error reading migration directory: Directory not found');
    });
  });

  describe('formatValidationOutput', () => {
    it('should format successful validation', () => {
      const result = {
        valid: true,
        missingRoles: [],
        grantStatements: [],
        roleDefinitions: ['web_app'],
        suggestions: [],
        errors: []
      };

      const output = formatValidationOutput(result);

      expect(output).toContain('✅ Migration validation passed');
      expect(output).toContain('All role dependencies satisfied');
    });

    it('should format validation failure with missing roles', () => {
      const result = {
        valid: false,
        missingRoles: ['web_app', 'api_user'],
        grantStatements: [
          { grantee: 'web_app', fileName: '0001.sql', lineNumber: 5 },
          { grantee: 'api_user', fileName: '0002.sql', lineNumber: 10 }
        ],
        roleDefinitions: [],
        suggestions: ['CREATE ROLE web_app;', 'CREATE ROLE api_user;'],
        errors: []
      };

      const output = formatValidationOutput(result);

      expect(output).toContain('❌ Migration validation failed');
      expect(output).toContain('Missing roles: web_app, api_user');
      expect(output).toContain('CREATE ROLE web_app;');
      expect(output).toContain('CREATE ROLE api_user;');
    });

    it('should format validation with file errors', () => {
      const result = {
        valid: false,
        missingRoles: [],
        grantStatements: [],
        roleDefinitions: [],
        suggestions: [],
        errors: ['Error reading 0001.sql: Permission denied']
      };

      const output = formatValidationOutput(result);

      expect(output).toContain('❌ Migration validation failed');
      expect(output).toContain('Permission denied');
    });

    it('should provide detailed grant statement information', () => {
      const result = {
        valid: false,
        missingRoles: ['web_app'],
        grantStatements: [
          {
            grantee: 'web_app',
            fileName: '0007_create_overlay.sql',
            lineNumber: 80,
            objectName: 'overlay_assets',
            privileges: ['SELECT', 'INSERT']
          }
        ],
        roleDefinitions: [],
        suggestions: ['CREATE ROLE web_app;'],
        errors: []
      };

      const output = formatValidationOutput(result);

      expect(output).toContain('0007_create_overlay.sql:80');
      expect(output).toContain('overlay_assets');
    });
  });
});