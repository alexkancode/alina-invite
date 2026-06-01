import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Error Taxonomy Documentation', () => {
  const docsPath = path.join(process.cwd(), 'docs');

  describe('Main Documentation Files', () => {
    test('should have main taxonomy file', () => {
      const mainFile = path.join(docsPath, 'backend-error-taxonomy.md');
      expect(existsSync(mainFile)).toBe(true);

      const content = readFileSync(mainFile, 'utf8');
      expect(content).toContain('Backend Error Taxonomy');
      expect(content).toContain('TypeScript Import Path Issues');
      expect(content).toContain('Database Query Mismatches');
      expect(content).toContain('Error Handling Failures');
    });

    test('should have prevention checklist', () => {
      const checklistFile = path.join(docsPath, 'error-prevention-checklist.md');
      expect(existsSync(checklistFile)).toBe(true);

      const content = readFileSync(checklistFile, 'utf8');
      expect(content).toContain('Error Prevention Checklist');
      expect(content).toContain('TypeScript Import Issues Prevention');
      expect(content).toContain('Database Query Mismatch Prevention');
    });

    test('should have debugging workflows', () => {
      const workflowFile = path.join(docsPath, 'debugging-workflows.md');
      expect(existsSync(workflowFile)).toBe(true);

      const content = readFileSync(workflowFile, 'utf8');
      expect(content).toContain('Debugging Workflows');
      expect(content).toContain('TypeScript Import Issue Debugging');
      expect(content).toContain('Database Query Mismatch Debugging');
    });
  });

  describe('Error Pattern Documentation', () => {
    const patternsPath = path.join(docsPath, 'error-patterns');

    test('should have TypeScript import issues documentation', () => {
      const tsFile = path.join(patternsPath, 'typescript-import-issues.md');
      expect(existsSync(tsFile)).toBe(true);

      const content = readFileSync(tsFile, 'utf8');
      expect(content).toContain('TypeScript Import Issues');
      expect(content).toContain('The .js Extension Paradox');
      expect(content).toContain('Module Resolution Conflicts');
      expect(content).toContain('ESM Import Errors');
    });

    test('should have database query mismatch documentation', () => {
      const dbFile = path.join(patternsPath, 'database-query-mismatches.md');
      expect(existsSync(dbFile)).toBe(true);

      const content = readFileSync(dbFile, 'utf8');
      expect(content).toContain('Database Query Mismatches');
      expect(content).toContain('Column Mismatch Errors');
      expect(content).toContain('Schema Evolution Drift');
      expect(content).toContain('Query Construction Anti-Patterns');
    });

    test('should have error handling failures documentation', () => {
      const errorFile = path.join(patternsPath, 'error-handling-failures.md');
      expect(existsSync(errorFile)).toBe(true);

      const content = readFileSync(errorFile, 'utf8');
      expect(content).toContain('Error Handling Failures');
      expect(content).toContain('Debugging Blind Spots');
      expect(content).toContain('Error Cascade Masking');
      expect(content).toContain('Observability Failures');
    });

    test('should have multi-layer failures documentation', () => {
      const multiFile = path.join(patternsPath, 'multi-layer-failures.md');
      expect(existsSync(multiFile)).toBe(true);

      const content = readFileSync(multiFile, 'utf8');
      expect(content).toContain('Multi-Layer Failures');
      expect(content).toContain('Infrastructure Configuration Drift');
      expect(content).toContain('Death by a Thousand Paper Cuts');
    });
  });

  describe('Quick Reference Documentation', () => {
    const quickRefPath = path.join(docsPath, 'quick-reference');

    test('should have error terminology reference', () => {
      const termFile = path.join(quickRefPath, 'error-terminology.md');
      expect(existsSync(termFile)).toBe(true);

      const content = readFileSync(termFile, 'utf8');
      expect(content).toContain('Error Terminology Quick Reference');
      expect(content).toContain('TypeScript Import Issues');
      expect(content).toContain('Database Query Issues');
      expect(content).toContain('Error Handling Issues');
    });

    test('should have debugging commands reference', () => {
      const cmdFile = path.join(quickRefPath, 'debugging-commands.md');
      expect(existsSync(cmdFile)).toBe(true);

      const content = readFileSync(cmdFile, 'utf8');
      expect(content).toContain('Debugging Commands Quick Reference');
      expect(content).toContain('TypeScript & Module Resolution');
      expect(content).toContain('Database Operations');
      expect(content).toContain('Error Analysis');
    });
  });
});

describe('Documentation Content Quality', () => {
  const docsPath = path.join(process.cwd(), 'docs');

  describe('Community Terminology Integration', () => {
    test('should include key TypeScript terminology', () => {
      const tsFile = path.join(docsPath, 'error-patterns', 'typescript-import-issues.md');
      const content = readFileSync(tsFile, 'utf8');

      // Key terms from research
      expect(content).toContain('The .js Extension Paradox');
      expect(content).toContain('Module Resolution Conflicts');
      expect(content).toContain('ESM Import Errors');
    });

    test('should include key database terminology', () => {
      const dbFile = path.join(docsPath, 'error-patterns', 'database-query-mismatches.md');
      const content = readFileSync(dbFile, 'utf8');

      // Key terms from research
      expect(content).toContain('Column Mismatch Errors');
      expect(content).toContain('Schema Evolution Drift');
      expect(content).toContain('Query Construction Anti-Patterns');
    });

    test('should include key error handling terminology', () => {
      const errorFile = path.join(docsPath, 'error-patterns', 'error-handling-failures.md');
      const content = readFileSync(errorFile, 'utf8');

      // Key terms from research
      expect(content).toContain('Debugging Blind Spots');
      expect(content).toContain('Error Cascade Masking');
      expect(content).toContain('Observability Failures');
    });
  });

  describe('Cross-Reference Links', () => {
    test('main taxonomy should link to detail files', () => {
      const mainFile = path.join(docsPath, 'backend-error-taxonomy.md');
      const content = readFileSync(mainFile, 'utf8');

      expect(content).toContain('[Error Prevention Checklist](error-prevention-checklist.md)');
      expect(content).toContain('[Debugging Workflows](debugging-workflows.md)');
      expect(content).toContain('[TypeScript Import Issues](error-patterns/typescript-import-issues.md)');
      expect(content).toContain('[Database Query Mismatches](error-patterns/database-query-mismatches.md)');
    });

    test('quick reference should link to main documentation', () => {
      const quickRefFile = path.join(docsPath, 'quick-reference', 'error-terminology.md');
      const content = readFileSync(quickRefFile, 'utf8');

      expect(content).toContain('[Backend Error Taxonomy](../backend-error-taxonomy.md)');
      expect(content).toContain('[Debugging Workflows](../debugging-workflows.md)');
      expect(content).toContain('[Error Prevention Checklist](../error-prevention-checklist.md)');
    });
  });

  describe('Code Examples Quality', () => {
    test('should have practical TypeScript examples', () => {
      const tsFile = path.join(docsPath, 'error-patterns', 'typescript-import-issues.md');
      const content = readFileSync(tsFile, 'utf8');

      // Should contain both problematic and correct examples
      expect(content).toMatch(/❌.*import.*\.ts/);
      expect(content).toMatch(/✅.*import.*(?!\.ts)/);
    });

    test('should have practical database examples', () => {
      const dbFile = path.join(docsPath, 'error-patterns', 'database-query-mismatches.md');
      const content = readFileSync(dbFile, 'utf8');

      // Should contain both problematic and correct SQL
      expect(content).toContain('INSERT INTO');
      expect(content).toContain('RETURNING');
      expect(content).toMatch(/❌.*Problem/);
      expect(content).toMatch(/✅.*Solution/);
    });

    test('should have practical error handling examples', () => {
      const errorFile = path.join(docsPath, 'error-patterns', 'error-handling-failures.md');
      const content = readFileSync(errorFile, 'utf8');

      // Should contain both problematic and correct error handling
      expect(content).toContain('try {');
      expect(content).toContain('catch (error)');
      expect(content).toMatch(/❌.*No useful information/);
      expect(content).toMatch(/✅.*Specific error information/);
    });
  });

  describe('Prevention Strategies', () => {
    test('should provide actionable checklists', () => {
      const checklistFile = path.join(docsPath, 'error-prevention-checklist.md');
      const content = readFileSync(checklistFile, 'utf8');

      // Should contain checkbox items
      expect(content).toMatch(/- \[ \].*\w+/g);

      // Should have specific prevention measures
      expect(content).toContain('Set explicit moduleResolution');
      expect(content).toContain('Always specify columns in INSERT');
      expect(content).toContain('Specific error logging');
    });

    test('should provide debugging workflows', () => {
      const workflowFile = path.join(docsPath, 'debugging-workflows.md');
      const content = readFileSync(workflowFile, 'utf8');

      // Should contain step-by-step procedures
      expect(content).toMatch(/Step \d+:/g);
      expect(content).toContain('npx tsc --noEmit');
      expect(content).toContain('psql -c');
    });
  });
});

describe('Documentation Completeness', () => {
  describe('Research Integration Validation', () => {
    test('should cover all major TypeScript patterns from research', () => {
      const tsFile = path.join(process.cwd(), 'docs/error-patterns/typescript-import-issues.md');
      const content = readFileSync(tsFile, 'utf8');

      const expectedPatterns = [
        'The .js Extension Paradox',
        'Module Resolution Conflicts',
        'ESM Import Errors',
        'Extension Rewriting Problem'
      ];

      expectedPatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });

    test('should cover all major database patterns from research', () => {
      const dbFile = path.join(process.cwd(), 'docs/error-patterns/database-query-mismatches.md');
      const content = readFileSync(dbFile, 'utf8');

      const expectedPatterns = [
        'Column Mismatch Errors',
        'Schema Evolution Drift',
        'Query Construction Anti-Patterns',
        'Referential Integrity'
      ];

      expectedPatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });

    test('should cover all major error handling patterns from research', () => {
      const errorFile = path.join(process.cwd(), 'docs/error-patterns/error-handling-failures.md');
      const content = readFileSync(errorFile, 'utf8');

      const expectedPatterns = [
        'Debugging Blind Spots',
        'Error Cascade Masking',
        'Observability Failures',
        'Infrastructure Configuration Drift'
      ];

      expectedPatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });
  });
});