import { describe, it, expect } from 'vitest';
import { extractRoleGrants, extractRoleCreations, extractGrantStatements } from '../../scripts/sql-parser.ts';

describe('SQL Parser', () => {
  describe('extractRoleGrants', () => {
    it('should extract single role from basic GRANT statement', () => {
      const sql = 'GRANT SELECT ON users TO web_app;';
      const roles = extractRoleGrants(sql);

      expect(roles).toEqual(['web_app']);
    });

    it('should extract multiple roles from multiple GRANT statements', () => {
      const sql = `
        GRANT SELECT, INSERT ON users TO web_app;
        GRANT USAGE ON SCHEMA public TO api_user;
        GRANT SELECT ON orders TO web_app;
      `;
      const roles = extractRoleGrants(sql);

      expect(roles).toEqual(['web_app', 'api_user']);
    });

    it('should handle multiline GRANT statements', () => {
      const sql = `
        GRANT SELECT, INSERT, UPDATE, DELETE
        ON overlay_assets
        TO web_app;
      `;
      const roles = extractRoleGrants(sql);

      expect(roles).toEqual(['web_app']);
    });

    it('should ignore GRANT statements in SQL comments', () => {
      const sql = `
        -- GRANT SELECT ON test TO commented_user;
        GRANT SELECT ON users TO web_app;
        /* GRANT INSERT ON test TO block_commented_user; */
      `;
      const roles = extractRoleGrants(sql);

      expect(roles).toEqual(['web_app']);
    });

    it('should return empty array when no GRANT statements found', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        INSERT INTO users VALUES (1);
      `;
      const roles = extractRoleGrants(sql);

      expect(roles).toEqual([]);
    });

    it('should handle case insensitive GRANT statements', () => {
      const sql = `
        grant select on users to web_app;
        Grant INSERT on orders To api_user;
      `;
      const roles = extractRoleGrants(sql);

      expect(roles).toEqual(['web_app', 'api_user']);
    });
  });

  describe('extractRoleCreations', () => {
    it('should extract role from CREATE ROLE statement', () => {
      const sql = 'CREATE ROLE web_app;';
      const roles = extractRoleCreations(sql);

      expect(roles).toEqual(['web_app']);
    });

    it('should extract role from CREATE ROLE with options', () => {
      const sql = 'CREATE ROLE web_app WITH LOGIN PASSWORD \'secret\';';
      const roles = extractRoleCreations(sql);

      expect(roles).toEqual(['web_app']);
    });

    it('should extract multiple roles from multiple CREATE statements', () => {
      const sql = `
        CREATE ROLE web_app;
        CREATE ROLE api_user WITH LOGIN;
        CREATE ROLE admin_user;
      `;
      const roles = extractRoleCreations(sql);

      expect(roles).toEqual(['web_app', 'api_user', 'admin_user']);
    });

    it('should ignore CREATE ROLE in comments', () => {
      const sql = `
        -- CREATE ROLE commented_role;
        CREATE ROLE web_app;
        /* CREATE ROLE block_commented_role; */
      `;
      const roles = extractRoleCreations(sql);

      expect(roles).toEqual(['web_app']);
    });

    it('should return empty array when no CREATE ROLE statements found', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        GRANT SELECT ON users TO web_app;
      `;
      const roles = extractRoleCreations(sql);

      expect(roles).toEqual([]);
    });

    it('should handle case insensitive CREATE ROLE statements', () => {
      const sql = `
        create role web_app;
        Create Role api_user;
      `;
      const roles = extractRoleCreations(sql);

      expect(roles).toEqual(['web_app', 'api_user']);
    });
  });

  describe('extractGrantStatements', () => {
    it('should extract detailed GRANT statement information', () => {
      const sql = 'GRANT SELECT, INSERT ON users TO web_app;';
      const statements = extractGrantStatements(sql);

      expect(statements).toHaveLength(1);
      expect(statements[0]).toMatchObject({
        privileges: ['SELECT', 'INSERT'],
        objectName: 'users',
        grantee: 'web_app'
      });
    });

    it('should track line numbers for GRANT statements', () => {
      const sql = `-- Line 1
CREATE TABLE users (id SERIAL);
GRANT SELECT ON users TO web_app;
GRANT INSERT ON orders TO api_user;`;

      const statements = extractGrantStatements(sql);

      expect(statements).toHaveLength(2);
      expect(statements[0].lineNumber).toBe(3);
      expect(statements[1].lineNumber).toBe(4);
    });

    it('should handle USAGE grants on schemas', () => {
      const sql = 'GRANT USAGE ON SCHEMA public TO web_app;';
      const statements = extractGrantStatements(sql);

      expect(statements[0]).toMatchObject({
        privileges: ['USAGE'],
        objectType: 'SCHEMA',
        objectName: 'public',
        grantee: 'web_app'
      });
    });

    it('should handle complex privilege lists', () => {
      const sql = 'GRANT SELECT, INSERT, UPDATE, DELETE ON overlay_assets TO web_app;';
      const statements = extractGrantStatements(sql);

      expect(statements[0].privileges).toEqual(['SELECT', 'INSERT', 'UPDATE', 'DELETE']);
    });
  });
});