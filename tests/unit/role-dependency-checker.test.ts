import { describe, it, expect } from 'vitest';
import {
  validateRoleDependencies,
  buildRoleRegistry,
  findMissingRoles,
  generateRemediationSuggestions
} from '../../scripts/role-dependency-checker.ts';

describe('Role Dependency Checker', () => {
  describe('buildRoleRegistry', () => {
    it('should build registry from multiple migration files', () => {
      const migrationFiles = [
        { content: 'CREATE ROLE web_app;', fileName: '0001.sql' },
        { content: 'CREATE ROLE api_user WITH LOGIN;', fileName: '0002.sql' },
        { content: 'CREATE TABLE users (id SERIAL);', fileName: '0003.sql' }
      ];

      const registry = buildRoleRegistry(migrationFiles);

      expect(registry).toEqual(new Set(['web_app', 'api_user']));
    });

    it('should handle empty migration files', () => {
      const migrationFiles = [];

      const registry = buildRoleRegistry(migrationFiles);

      expect(registry).toEqual(new Set());
    });

    it('should ignore duplicate role definitions', () => {
      const migrationFiles = [
        { content: 'CREATE ROLE web_app;', fileName: '0001.sql' },
        { content: 'CREATE ROLE web_app;', fileName: '0002.sql' }
      ];

      const registry = buildRoleRegistry(migrationFiles);

      expect(registry).toEqual(new Set(['web_app']));
    });
  });

  describe('findMissingRoles', () => {
    it('should find missing roles when none exist', () => {
      const grants = ['web_app', 'api_user'];
      const roles = new Set();

      const missing = findMissingRoles(grants, roles);

      expect(missing).toEqual(['web_app', 'api_user']);
    });

    it('should find partially missing roles', () => {
      const grants = ['web_app', 'api_user', 'admin'];
      const roles = new Set(['web_app', 'admin']);

      const missing = findMissingRoles(grants, roles);

      expect(missing).toEqual(['api_user']);
    });

    it('should return empty array when all roles exist', () => {
      const grants = ['web_app', 'api_user'];
      const roles = new Set(['web_app', 'api_user', 'admin']);

      const missing = findMissingRoles(grants, roles);

      expect(missing).toEqual([]);
    });

    it('should handle duplicate grants', () => {
      const grants = ['web_app', 'web_app', 'api_user'];
      const roles = new Set(['web_app']);

      const missing = findMissingRoles(grants, roles);

      expect(missing).toEqual(['api_user']);
    });
  });

  describe('generateRemediationSuggestions', () => {
    it('should generate CREATE ROLE statements for missing roles', () => {
      const missingRoles = ['web_app', 'api_user'];

      const suggestions = generateRemediationSuggestions(missingRoles);

      expect(suggestions).toEqual([
        'CREATE ROLE web_app;',
        'CREATE ROLE api_user;'
      ]);
    });

    it('should return empty array for no missing roles', () => {
      const missingRoles = [];

      const suggestions = generateRemediationSuggestions(missingRoles);

      expect(suggestions).toEqual([]);
    });

    it('should handle single missing role', () => {
      const missingRoles = ['web_app'];

      const suggestions = generateRemediationSuggestions(missingRoles);

      expect(suggestions).toEqual(['CREATE ROLE web_app;']);
    });
  });

  describe('validateRoleDependencies', () => {
    it('should validate successful dependencies', () => {
      const migrationFiles = [
        {
          content: 'CREATE ROLE web_app;',
          fileName: '0001_create_roles.sql'
        },
        {
          content: 'GRANT SELECT ON users TO web_app;',
          fileName: '0002_grant_permissions.sql'
        }
      ];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.valid).toBe(true);
      expect(result.missingRoles).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should detect missing role dependencies', () => {
      const migrationFiles = [
        {
          content: 'GRANT SELECT ON users TO web_app; GRANT INSERT ON orders TO api_user;',
          fileName: '0001_grant_permissions.sql'
        }
      ];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.valid).toBe(false);
      expect(result.missingRoles).toEqual(['web_app', 'api_user']);
      expect(result.suggestions).toEqual([
        'CREATE ROLE web_app;',
        'CREATE ROLE api_user;'
      ]);
    });

    it('should handle mixed valid and invalid dependencies', () => {
      const migrationFiles = [
        {
          content: 'CREATE ROLE web_app;',
          fileName: '0001_create_roles.sql'
        },
        {
          content: 'GRANT SELECT ON users TO web_app; GRANT INSERT ON orders TO missing_role;',
          fileName: '0002_grant_permissions.sql'
        }
      ];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.valid).toBe(false);
      expect(result.missingRoles).toEqual(['missing_role']);
      expect(result.suggestions).toEqual(['CREATE ROLE missing_role;']);
    });

    it('should extract grant statements with file context', () => {
      const migrationFiles = [
        {
          content: 'GRANT SELECT ON users TO web_app;',
          fileName: '0001_permissions.sql'
        }
      ];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.grantStatements).toHaveLength(1);
      expect(result.grantStatements[0].fileName).toBe('0001_permissions.sql');
      expect(result.grantStatements[0].grantee).toBe('web_app');
    });

    it('should handle empty migration files gracefully', () => {
      const migrationFiles = [];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.valid).toBe(true);
      expect(result.missingRoles).toEqual([]);
      expect(result.grantStatements).toEqual([]);
      expect(result.roleDefinitions).toEqual([]);
    });

    it('should track role definitions found', () => {
      const migrationFiles = [
        {
          content: 'CREATE ROLE web_app; CREATE ROLE api_user;',
          fileName: '0001_create_roles.sql'
        }
      ];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.roleDefinitions).toEqual(['web_app', 'api_user']);
    });

    it('should handle the actual failing case from ff48c627', () => {
      const migrationFiles = [
        {
          content: `
            CREATE TABLE overlay_assets (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid()
            );
            GRANT SELECT, INSERT, UPDATE, DELETE ON overlay_assets TO web_app;
            GRANT USAGE ON SCHEMA public TO web_app;
          `,
          fileName: '0007_create_tile_overlay_system.sql'
        }
      ];

      const result = validateRoleDependencies(migrationFiles);

      expect(result.valid).toBe(false);
      expect(result.missingRoles).toEqual(['web_app']);
      expect(result.suggestions).toEqual(['CREATE ROLE web_app;']);
      expect(result.grantStatements).toHaveLength(2);
    });
  });
});