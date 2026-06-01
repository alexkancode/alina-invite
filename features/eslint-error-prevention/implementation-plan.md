# ESLint Error Prevention Rules - Implementation Plan

## Overview

Implement custom ESLint rules to proactively prevent the backend error patterns documented in our error taxonomy, focusing on TypeScript imports, database query construction, and error handling anti-patterns.

## Phase 1: Core Infrastructure and High-Confidence Rules

### 1.1 ESLint Plugin Setup

**File Structure:**
```
eslint-plugin-error-prevention/
├── lib/
│   ├── index.js                    # Plugin entry point
│   ├── rules/
│   │   ├── no-ts-import-extensions.js
│   │   ├── consistent-import-patterns.js
│   │   ├── no-sql-concatenation.js
│   │   └── require-error-context.js
│   └── utils/
│       ├── ast-helpers.js          # Common AST manipulation utilities
│       ├── pattern-matchers.js     # Reusable pattern detection
│       └── message-formatters.js   # Consistent error messaging
├── tests/
│   ├── rules/
│   │   ├── no-ts-import-extensions.test.js
│   │   ├── consistent-import-patterns.test.js
│   │   ├── no-sql-concatenation.test.js
│   │   └── require-error-context.test.js
│   └── fixtures/
│       ├── valid-code/
│       └── invalid-code/
├── docs/
│   └── rules/
│       ├── no-ts-import-extensions.md
│       ├── consistent-import-patterns.md
│       ├── no-sql-concatenation.md
│       └── require-error-context.md
└── package.json
```

### 1.2 Rule Implementation Priority

**Rule 1: no-ts-import-extensions**
```javascript
// Detects and fixes .ts/.tsx extensions in imports
// Priority: High - Direct syntax issue
// Auto-fix: Safe removal of extensions
// Targets: ImportDeclaration nodes with .ts/.tsx source values
```

**Rule 2: consistent-import-patterns**
```javascript
// Enforces consistent relative vs absolute import patterns
// Priority: High - Style consistency
// Auto-fix: Normalize to configured pattern
// Targets: ImportDeclaration nodes with inconsistent patterns
```

**Rule 3: no-sql-concatenation**
```javascript
// Detects string concatenation in SQL query construction
// Priority: High - Security and reliability issue
// Auto-fix: None (requires manual parameterization)
// Targets: Template literals and string concatenation with SQL keywords
```

**Rule 4: require-error-context**
```javascript
// Enforces specific error information in catch blocks
// Priority: High - Observability improvement
// Auto-fix: Template for error context addition
// Targets: CatchClause nodes without context logging
```

## Phase 2: Advanced Pattern Detection

### 2.1 Context-Aware Rules

**Rule 5: require-explicit-columns**
```javascript
// Detects INSERT statements without explicit column lists
// Priority: Medium - Database reliability
// Auto-fix: None (requires schema knowledge)
// Targets: String literals containing INSERT...VALUES patterns
```

**Rule 6: no-generic-errors**
```javascript
// Detects generic Error construction without context
// Priority: Medium - Error handling improvement
// Auto-fix: Template for contextual error creation
// Targets: NewExpression and CallExpression nodes for Error class
```

**Rule 7: preserve-error-chain**
```javascript
// Ensures original errors are preserved in re-throwing
// Priority: Medium - Debugging capability
// Auto-fix: Add original error as cause property
// Targets: ThrowStatement within CatchClause blocks
```

### 2.2 SQL Pattern Analysis

**Enhanced SQL Detection:**
- Template literal analysis for SQL keywords
- Function call pattern matching for database methods
- Variable assignment tracking for query strings
- Dynamic query construction detection

## Phase 3: Advanced Analysis and Integration

### 3.1 Flow Analysis Rules

**Rule 8: require-parameterized-queries**
```javascript
// Detects dynamic query construction with user input
// Priority: Low - Complex static analysis required
// Auto-fix: None (requires architectural changes)
// Targets: Variable flow analysis from user input to query execution
```

**Rule 9: require-correlation-ids**
```javascript
// Enforces correlation ID usage in API handlers
// Priority: Low - Specific to API pattern
// Auto-fix: Template for correlation ID integration
// Targets: Function declarations with API handler signatures
```

### 3.2 Configuration Integration

**ESLint Configuration:**
```javascript
// .eslintrc.js extension
module.exports = {
  plugins: ['error-prevention'],
  rules: {
    // Phase 1 - High confidence
    'error-prevention/no-ts-import-extensions': 'error',
    'error-prevention/consistent-import-patterns': 'warn',
    'error-prevention/no-sql-concatenation': 'error',
    'error-prevention/require-error-context': 'warn',
    
    // Phase 2 - Context aware
    'error-prevention/require-explicit-columns': 'warn',
    'error-prevention/no-generic-errors': 'warn',
    'error-prevention/preserve-error-chain': 'warn',
    
    // Phase 3 - Advanced analysis (initially disabled)
    'error-prevention/require-parameterized-queries': 'off',
    'error-prevention/require-correlation-ids': 'off'
  },
  settings: {
    'error-prevention': {
      // Project-specific configuration
      moduleResolution: 'bundler',
      importPatternPreference: 'relative',
      sqlDialect: 'postgresql',
      apiHandlerPatterns: ['POST', 'PUT', 'PATCH'],
      errorContextRequired: ['operation', 'timestamp', 'correlationId']
    }
  }
};
```

## Technical Implementation Details

### 4.1 AST Analysis Utilities

**Common Pattern Detection:**
```javascript
// utils/ast-helpers.js
module.exports = {
  isImportDeclaration: (node) => node.type === 'ImportDeclaration',
  hasExtension: (source, extensions) => extensions.some(ext => source.endsWith(ext)),
  isSQLKeyword: (str) => /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(str),
  isStringConcatenation: (node) => node.type === 'BinaryExpression' && node.operator === '+',
  isCatchClause: (node) => node.type === 'CatchClause',
  hasErrorLogging: (block) => /* analysis for console.error/logger calls */
};
```

**Pattern Matchers:**
```javascript
// utils/pattern-matchers.js
module.exports = {
  matchImportPattern: (source) => ({
    isRelative: source.startsWith('./') || source.startsWith('../'),
    hasExtension: /\.(js|ts|tsx|jsx)$/.test(source),
    extension: source.match(/\.(js|ts|tsx|jsx)$/)?.[1]
  }),
  
  matchSQLPattern: (str) => ({
    hasSQL: /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(str),
    isDynamic: /\$\{|\+\s*\w+|\w+\s*\+/.test(str),
    hasValues: /VALUES\s*\(/i.test(str),
    hasColumns: /INSERT\s+INTO\s+\w+\s*\(/i.test(str)
  }),
  
  matchErrorPattern: (node) => ({
    isGenericError: node.callee?.name === 'Error' && node.arguments.length <= 1,
    hasContext: /* check for object argument with context properties */,
    preservesOriginal: /* check for original error preservation */
  })
};
```

### 4.2 Auto-Fix Implementation

**Safe Auto-Fix Rules:**
- Extension removal from imports (reversible)
- Import pattern normalization (configurable)
- Error context template addition (non-destructive)

**Manual Fix Required:**
- SQL parameterization (requires architectural knowledge)
- Complex error handling flows (context-dependent)
- API handler modifications (business logic dependent)

### 4.3 Testing Strategy

**Rule Testing Framework:**
```javascript
// tests/rules/no-ts-import-extensions.test.js
const { RuleTester } = require('eslint');
const rule = require('../../lib/rules/no-ts-import-extensions');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
});

ruleTester.run('no-ts-import-extensions', rule, {
  valid: [
    `import { helper } from './utils';`,
    `import { config } from '../config';`,
    `import React from 'react';`
  ],
  
  invalid: [
    {
      code: `import { helper } from './utils.ts';`,
      errors: [{ messageId: 'noTsExtension' }],
      output: `import { helper } from './utils';`
    },
    {
      code: `import { Component } from './Component.tsx';`,
      errors: [{ messageId: 'noTsxExtension' }], 
      output: `import { Component } from './Component';`
    }
  ]
});
```

**Integration Testing:**
```javascript
// tests/integration/real-world-patterns.test.js
// Test rules against actual codebase patterns
// Validate performance on large files
// Check for false positives in complex scenarios
```

## Integration and Deployment

### 5.1 Development Workflow Integration

**VS Code Integration:**
```json
{
  "eslint.enable": true,
  "eslint.validate": ["javascript", "typescript"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**Pre-commit Hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit
npx eslint --fix $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|tsx)$')
```

**CI/CD Pipeline:**
```yaml
# .github/workflows/lint.yml
- name: Run ESLint with custom rules
  run: |
    npm run lint:error-prevention
    npm run lint:error-prevention:report
```

### 5.2 Gradual Adoption Strategy

**Phase 1 Rollout:**
- Enable high-confidence rules as warnings
- Collect feedback on false positives
- Refine rule configurations based on team usage
- Document escape mechanisms for edge cases

**Phase 2 Enhancement:**
- Promote stable rules from warning to error
- Add context-aware rules as warnings
- Implement rule-specific configuration options
- Add auto-fix capabilities where safe

**Phase 3 Advanced Features:**
- Enable advanced analysis rules selectively
- Integrate with team-specific patterns
- Add performance optimization
- Create rule documentation integration

## Quality Assurance

### 6.1 Rule Quality Standards

**Accuracy Requirements:**
- False positive rate < 5%
- Coverage of documented error patterns > 90%
- Performance impact < 10% increase in lint time
- Auto-fix safety verification through test suite

**Documentation Standards:**
- Clear rule descriptions with examples
- Configuration options documentation
- Migration guide for existing code
- Integration with error taxonomy documentation

### 6.2 Performance Optimization

**Efficient Implementation:**
- Minimal AST traversal through targeted selectors
- Caching for repeated pattern analysis
- Lazy evaluation of complex rules
- Benchmarking against large codebases

**Resource Management:**
- Memory usage profiling
- Rule execution time monitoring
- Scalability testing with large projects
- Optimization for incremental linting

## Success Metrics and Monitoring

### 7.1 Effectiveness Tracking

**Error Reduction Metrics:**
- Pre/post implementation error rates by category
- Developer feedback on rule helpfulness
- Code review comment reduction for preventable issues
- Time to resolution for configuration drift issues

**Adoption Metrics:**
- Rule activation rates across team
- Auto-fix usage patterns
- Custom configuration adoption
- Integration with development tools

### 7.2 Continuous Improvement

**Rule Refinement:**
- Regular false positive analysis
- New pattern detection based on emerging issues
- Performance optimization based on usage patterns
- Community feedback integration

**Documentation Enhancement:**
- Rule effectiveness documentation updates
- Best practice guide development
- Integration example maintenance
- Cross-reference with error taxonomy updates