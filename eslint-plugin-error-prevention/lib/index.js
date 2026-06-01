const noTsImportExtensions = require('./rules/no-ts-import-extensions');
const consistentImportPatterns = require('./rules/consistent-import-patterns');
const noSqlConcatenation = require('./rules/no-sql-concatenation');

module.exports = {
  rules: {
    'no-ts-import-extensions': noTsImportExtensions,
    'consistent-import-patterns': consistentImportPatterns,
    'no-sql-concatenation': noSqlConcatenation
  },
  configs: {
    recommended: {
      plugins: ['error-prevention'],
      rules: {
        'error-prevention/no-ts-import-extensions': 'error',
        'error-prevention/consistent-import-patterns': 'warn',
        'error-prevention/no-sql-concatenation': 'error'
      }
    },
    'phase-1': {
      plugins: ['error-prevention'],
      rules: {
        'error-prevention/no-ts-import-extensions': 'error',
        'error-prevention/consistent-import-patterns': 'warn',
        'error-prevention/no-sql-concatenation': 'error'
      }
    }
  }
};