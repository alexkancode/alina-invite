import rule from './eslint-plugin-error-prevention/lib/rules/no-hardcoded-localhost.js';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

console.log('🧪 Running simple localhost rule test...');

try {
  // Test a simple case first
  ruleTester.run('no-hardcoded-localhost', rule, {
    valid: [
      'const client = new pg.Client({ connectionString: process.env.DATABASE_URL })'
    ],
    invalid: [
      {
        code: 'const client = new pg.Client({ host: "localhost" })',
        filename: 'scripts/migrate.ts',
        errors: [{
          messageId: 'hardcodedLocalhostHost',
          suggestions: [{
            desc: 'Use environment variable for database host',
            output: 'const client = new pg.Client({ host: process.env.DATABASE_HOST || \'localhost\' })'
          }]
        }]
      }
    ]
  });

  console.log('✅ Simple ESLint rule test passed!');

  // Test fetch case
  ruleTester.run('no-hardcoded-localhost-fetch', rule, {
    valid: [
      'fetch(process.env.API_BASE_URL + "/api/test")'
    ],
    invalid: [
      {
        code: 'fetch("http://localhost:4321/api/test")',
        filename: 'src/components/ApiClient.ts',
        errors: [{
          messageId: 'hardcodedLocalhostURL',
          suggestions: [{
            desc: 'Use environment-aware base URL',
            output: 'fetch(`${process.env.API_BASE_URL || \'http://localhost:4321\'}${"/api/test"}`)'
          }]
        }]
      }
    ]
  });

  console.log('✅ Fetch ESLint rule test passed!');

} catch (error) {
  console.error('❌ ESLint rule test failed:', error.message);
  if (error.actual) {
    console.error('Actual errors:', error.actual);
  }
  process.exit(1);
}