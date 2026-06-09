import rule from '../lib/rules/no-hardcoded-localhost.js';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
});

console.log('🧪 Running localhost detection ESLint rule tests...');

try {
  ruleTester.run('no-hardcoded-localhost', rule, {
    valid: [
      // Environment-aware database connections
      'const client = new pg.Client({ connectionString: process.env.DATABASE_URL })',
      'const client = new pg.Client({ host: process.env.DATABASE_HOST || "localhost" })',

      // Environment-aware API calls
      'fetch(process.env.API_BASE_URL + "/api/test")',
      'fetch(`${process.env.API_BASE_URL}/api/test`)',

      // Test files should be allowed (localhost is OK in tests)
      { code: 'const host = "localhost"', filename: 'src/components/test.spec.ts' },
      { code: 'fetch("http://localhost:4321/api/test")', filename: 'tests/integration.test.ts' },

      // Local development files should be allowed
      { code: 'const config = { host: "localhost" }', filename: 'config/database.local.ts' },

      // Dev tools should be allowed
      { code: 'const devServer = "http://localhost:3000"', filename: 'dev-tools/server.js' },

      // Non-localhost literals should be fine
      'const message = "Hello localhost user"',
      'const server = "production.example.com"',

      // Dynamic host construction
      'const host = isProduction ? prodHost : "localhost"',
      'const url = process.env.API_BASE_URL || config.baseURL'
    ],

    invalid: [
      // Database host hardcoding in critical files
      {
        code: 'const client = new pg.Client({ host: "localhost" })',
        filename: 'scripts/migrate.ts',
        errors: [{
          messageId: 'hardcodedLocalhostHost'
        }]
      },

      // Connection string hardcoding
      {
        code: 'const connectionString = "postgresql://user:pass@localhost:5432/db"',
        filename: 'src/lib/database.ts',
        errors: [{
          messageId: 'hardcodedLocalhostConnection'
        }]
      },

      // Simple localhost:port pattern
      {
        code: 'const dbUrl = "localhost:5432"',
        filename: 'src/lib/config.ts',
        errors: [{
          messageId: 'hardcodedLocalhostConnection'
        }]
      },

      // HTTP localhost URLs in fetch calls
      {
        code: 'fetch("http://localhost:4321/api/test")',
        filename: 'src/components/ApiClient.ts',
        errors: [{
          messageId: 'hardcodedLocalhostURL'
        }]
      },

      // HTTP localhost URLs in regular literals
      {
        code: 'const apiUrl = "http://localhost:3000/api"',
        filename: 'src/lib/api.ts',
        errors: [{
          messageId: 'hardcodedLocalhostURL'
        }]
      },

      // IP address hardcoding
      {
        code: 'const server = "127.0.0.1:5432"',
        filename: 'scripts/setup.js',
        errors: [{
          messageId: 'hardcodedIPAddress'
        }]
      }
    ]
  });

  console.log('✅ ESLint rule tests passed!');
} catch (error) {
  console.error('❌ ESLint rule tests failed:', error.message);
  process.exit(1);
}