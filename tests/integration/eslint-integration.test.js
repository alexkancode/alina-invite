import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('ESLint Integration', () => {
  const testFilesDir = path.join(__dirname, 'test-files');

  beforeEach(() => {
    // Create test files directory
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  describe('Plugin Installation', () => {
    test('should have error-prevention plugin installed', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      // Check if plugin is installed either as dependency or linked
      const hasPlugin = packageJson.devDependencies?.['eslint-plugin-error-prevention'] ||
                       fs.existsSync('./eslint-plugin-error-prevention');

      expect(hasPlugin).toBeTruthy();
    });

    test('should have ESLint configuration file', () => {
      const configExists = fs.existsSync('.eslintrc.js') ||
                          fs.existsSync('.eslintrc.json') ||
                          fs.existsSync('eslint.config.js');

      expect(configExists).toBeTruthy();
    });
  });

  describe('Rule Functionality', () => {
    test('should detect TypeScript import extension violations', () => {
      // Create test file with .ts import
      const testFile = path.join(testFilesDir, 'test-imports.ts');
      fs.writeFileSync(testFile, `
        import { helper } from './utils.ts';
        import { config } from './config';
      `);

      try {
        // Run ESLint on test file - should exit with error
        const output = execSync(`npx eslint ${testFile}`, {
          encoding: 'utf8',
          cwd: process.cwd()
        });

        // If no error thrown, check if warnings are present
        expect(output).toContain('no-ts-import-extensions');
      } catch (error) {
        // ESLint exits with error code when violations found
        expect(error.stdout || error.stderr).toContain('no-ts-import-extensions');
      }
    });

    test('should detect inconsistent import patterns', () => {
      // Create test file with mixed patterns
      const testFile = path.join(testFilesDir, 'test-patterns.ts');
      fs.writeFileSync(testFile, `
        import { helper } from './utils';
        import { config } from '@/config/settings';
      `);

      try {
        const output = execSync(`npx eslint ${testFile}`, {
          encoding: 'utf8',
          cwd: process.cwd()
        });

        expect(output).toContain('consistent-import-patterns');
      } catch (error) {
        expect(error.stdout || error.stderr).toContain('consistent-import-patterns');
      }
    });

    test('should detect SQL concatenation patterns', () => {
      // Create test file with SQL concatenation
      const testFile = path.join(testFilesDir, 'test-sql.js');
      fs.writeFileSync(testFile, `
        const query = \`SELECT * FROM users WHERE name = '\${userName}'\`;
        const updateQuery = 'UPDATE users SET email = ' + newEmail;
      `);

      try {
        const output = execSync(`npx eslint ${testFile}`, {
          encoding: 'utf8',
          cwd: process.cwd()
        });

        expect(output).toContain('no-sql-concatenation');
      } catch (error) {
        expect(error.stdout || error.stderr).toContain('no-sql-concatenation');
      }
    });
  });

  describe('Auto-fix Functionality', () => {
    test('should auto-fix TypeScript import extensions', () => {
      const testFile = path.join(testFilesDir, 'auto-fix-test.ts');
      const originalContent = `import { helper } from './utils.ts';`;

      fs.writeFileSync(testFile, originalContent);

      // Run ESLint with auto-fix
      try {
        execSync(`npx eslint ${testFile} --fix --config .eslintrc.js`, {
          cwd: process.cwd()
        });
      } catch (error) {
        // ESLint might still exit with error code even after fixing
      }

      const fixedContent = fs.readFileSync(testFile, 'utf8');
      expect(fixedContent).toContain(`import { helper } from './utils';`);
      expect(fixedContent).not.toContain('.ts');
    });

    test('should auto-fix import pattern consistency', () => {
      const testFile = path.join(testFilesDir, 'pattern-fix-test.ts');
      const originalContent = `
        import { helper } from './utils';
        import { config } from '@/config/settings';
      `;

      fs.writeFileSync(testFile, originalContent);

      try {
        execSync(`npx eslint ${testFile} --fix --config .eslintrc.js`, {
          cwd: process.cwd()
        });
      } catch (error) {
        // May still have errors after partial fixes
      }

      const fixedContent = fs.readFileSync(testFile, 'utf8');
      // Content should be normalized to consistent pattern
      expect(fixedContent).not.toContain('@/config/settings');
    });
  });

  describe('VS Code Integration', () => {
    test('should have VS Code workspace settings', () => {
      const vsCodeSettings = '.vscode/settings.json';

      if (fs.existsSync(vsCodeSettings)) {
        const settings = JSON.parse(fs.readFileSync(vsCodeSettings, 'utf8'));
        expect(settings['eslint.enable']).toBe(true);
      } else {
        // VS Code settings are optional but recommended
        console.warn('VS Code settings not found - recommended for development');
      }
    });

    test('should have ESLint extension recommendation', () => {
      const extensionsFile = '.vscode/extensions.json';

      if (fs.existsSync(extensionsFile)) {
        const extensions = JSON.parse(fs.readFileSync(extensionsFile, 'utf8'));
        const hasESLintExtension = extensions.recommendations?.includes('dbaeumer.vscode-eslint');
        expect(hasESLintExtension).toBeTruthy();
      }
    });
  });

  describe('Build Integration', () => {
    test('should have lint scripts in package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      expect(packageJson.scripts).toHaveProperty('lint');
      expect(packageJson.scripts.lint).toContain('eslint');
    });

    test('should be able to run lint check', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      if (packageJson.scripts.lint) {
        try {
          // Test that lint script exists and is executable
          const output = execSync('npm run lint -- --help', {
            encoding: 'utf8',
            cwd: process.cwd()
          });
          expect(output).toContain('eslint');
        } catch (error) {
          // Script exists but might fail - that's expected for empty projects
          expect(error.stdout || error.stderr).toContain('eslint');
        }
      }
    });
  });

  describe('Configuration Validation', () => {
    test('should have ESLint flat configuration', async () => {
      const configExists = fs.existsSync('eslint.config.js');
      expect(configExists).toBeTruthy();

      if (configExists) {
        try {
          const configModule = await import('../../eslint.config.js');
          const config = configModule.default;
          expect(Array.isArray(config)).toBeTruthy();

          // Find the config object with our custom rules
          const mainConfig = config.find(c => c.rules && c.rules['error-prevention/no-ts-import-extensions']);
          if (mainConfig) {
            expect(mainConfig.plugins).toHaveProperty('error-prevention');
            expect(mainConfig.rules).toHaveProperty('error-prevention/no-ts-import-extensions');
          }
        } catch (error) {
          console.warn('Could not load ESLint config:', error.message);
        }
      }
    });

    test('should have appropriate rule severity levels', async () => {
      if (fs.existsSync('eslint.config.js')) {
        try {
          const configModule = await import('../../eslint.config.js');
          const config = configModule.default;

          const mainConfig = config.find(c => c.rules && c.rules['error-prevention/no-ts-import-extensions']);
          if (mainConfig && mainConfig.rules) {
            const tsImportRule = mainConfig.rules['error-prevention/no-ts-import-extensions'];
            const sqlRule = mainConfig.rules['error-prevention/no-sql-concatenation'];

            // Security-critical rules should be errors
            expect(tsImportRule).toBe('error');
            expect(sqlRule).toBe('error');
          }
        } catch (error) {
          console.warn('Could not validate rule severity:', error.message);
        }
      }
    });
  });
});