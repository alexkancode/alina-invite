import noTsImportExtensions from './rules/no-ts-import-extensions.js';
import consistentImportPatterns from './rules/consistent-import-patterns.js';
import noSqlConcatenation from './rules/no-sql-concatenation.js';
import validateTsconfigConsistency from './rules/validate-tsconfig-consistency.js';

export default {
  rules: {
    'no-ts-import-extensions': noTsImportExtensions,
    'consistent-import-patterns': consistentImportPatterns,
    'no-sql-concatenation': noSqlConcatenation,
    'validate-tsconfig-consistency': validateTsconfigConsistency
  },
  configs: {
    recommended: {
      plugins: ['error-prevention'],
      rules: {
        'error-prevention/no-ts-import-extensions': 'error',
        'error-prevention/consistent-import-patterns': 'warn',
        'error-prevention/no-sql-concatenation': 'error',
        'error-prevention/validate-tsconfig-consistency': 'error'
      }
    },
    'phase-1': {
      plugins: ['error-prevention'],
      rules: {
        'error-prevention/no-ts-import-extensions': 'error',
        'error-prevention/consistent-import-patterns': 'warn',
        'error-prevention/no-sql-concatenation': 'error'
      }
    },
    'config-drift-prevention': {
      plugins: ['error-prevention'],
      rules: {
        'error-prevention/validate-tsconfig-consistency': 'error'
      }
    }
  }
};