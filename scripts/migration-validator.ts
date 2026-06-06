import { promises as fs } from 'fs';
import { join } from 'path';
import { validateRoleDependencies, MigrationFile, ValidationResult } from './role-dependency-checker.ts';

export async function validateMigrations(migrationDir: string): Promise<ValidationResult> {
  try {
    const { migrationFiles, errors } = await getAllMigrationFiles(migrationDir);
    const result = validateRoleDependencies(migrationFiles);

    if (errors.length > 0) {
      result.errors.push(...errors);
      result.valid = false;
    }

    return result;
  } catch (error) {
    return {
      valid: false,
      missingRoles: [],
      grantStatements: [],
      roleDefinitions: [],
      suggestions: [],
      errors: [`Error reading migration directory: ${error.message}`]
    };
  }
}

export async function getAllMigrationFiles(directory: string): Promise<{ migrationFiles: MigrationFile[], errors: string[] }> {
  const files = await fs.readdir(directory);
  const sqlFiles = files
    .filter(file => file.endsWith('.sql'))
    .sort();

  const migrationFiles: MigrationFile[] = [];
  const errors: string[] = [];

  for (const file of sqlFiles) {
    try {
      const filePath = join(directory, file);
      const content = await fs.readFile(filePath, 'utf-8');
      migrationFiles.push({
        fileName: file,
        content
      });
    } catch (error) {
      errors.push(`Error reading ${file}: ${error.message}`);
      migrationFiles.push({
        fileName: file,
        content: ''
      });
    }
  }

  return { migrationFiles, errors };
}

export function formatValidationOutput(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✅ Migration validation passed');
    lines.push('All role dependencies satisfied');

    if (result.roleDefinitions.length > 0) {
      lines.push(`Found roles: ${result.roleDefinitions.join(', ')}`);
    }
  } else {
    lines.push('❌ Migration validation failed');
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('Errors:');
      result.errors.forEach(error => {
        lines.push(`  • ${error}`);
      });
      lines.push('');
    }

    if (result.missingRoles.length > 0) {
      lines.push(`Missing roles: ${result.missingRoles.join(', ')}`);
      lines.push('');

      lines.push('Grant statements requiring these roles:');
      result.grantStatements
        .filter(stmt => result.missingRoles.includes(stmt.grantee))
        .forEach(stmt => {
          lines.push(`  • ${stmt.fileName}:${stmt.lineNumber} - GRANT on ${stmt.objectName} TO ${stmt.grantee}`);
        });
      lines.push('');

      lines.push('Suggested fixes:');
      result.suggestions.forEach(suggestion => {
        lines.push(`  ${suggestion}`);
      });
    }
  }

  return lines.join('\n');
}