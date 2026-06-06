import { extractRoleGrants, extractRoleCreations, extractGrantStatements } from './sql-parser.ts';

export interface MigrationFile {
  content: string;
  fileName: string;
}

export interface ValidationResult {
  valid: boolean;
  missingRoles: string[];
  grantStatements: any[];
  roleDefinitions: string[];
  suggestions: string[];
  errors: string[];
}

export function validateRoleDependencies(migrationFiles: MigrationFile[]): ValidationResult {
  const roleRegistry = buildRoleRegistry(migrationFiles);
  const allGrantStatements = [];
  const allRoleDefinitions = [];

  for (const file of migrationFiles) {
    const grantStatements = extractGrantStatements(file.content);
    grantStatements.forEach(stmt => {
      stmt.fileName = file.fileName;
    });
    allGrantStatements.push(...grantStatements);

    const roleDefinitions = extractRoleCreations(file.content);
    allRoleDefinitions.push(...roleDefinitions);
  }

  const grantedRoles = allGrantStatements.map(stmt => stmt.grantee);
  const uniqueGrantedRoles = [...new Set(grantedRoles)];
  const missingRoles = findMissingRoles(uniqueGrantedRoles, roleRegistry);
  const suggestions = generateRemediationSuggestions(missingRoles);

  return {
    valid: missingRoles.length === 0,
    missingRoles,
    grantStatements: allGrantStatements,
    roleDefinitions: allRoleDefinitions,
    suggestions,
    errors: []
  };
}

export function buildRoleRegistry(migrationFiles: MigrationFile[]): Set<string> {
  const registry = new Set<string>();

  for (const file of migrationFiles) {
    const roles = extractRoleCreations(file.content);
    roles.forEach(role => registry.add(role));
  }

  return registry;
}

export function findMissingRoles(grants: string[], roles: Set<string>): string[] {
  const uniqueGrants = [...new Set(grants)];
  return uniqueGrants.filter(role => !roles.has(role));
}

export function generateRemediationSuggestions(missingRoles: string[]): string[] {
  return missingRoles.map(role => `CREATE ROLE ${role};`);
}