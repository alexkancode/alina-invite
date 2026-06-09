# Implementation Plan: Localhost Detection Automation

## Phase 1: Custom ESLint Rule Development

### 1.1 Create ESLint Rule Structure
**Target:** `eslint-plugin-error-prevention/rules/no-hardcoded-localhost.js`

```javascript
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent hardcoded localhost in production-critical code',
      category: 'Possible Errors',
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        allowedFiles: { type: 'array', items: { type: 'string' } },
        criticalFiles: { type: 'array', items: { type: 'string' } }
      },
      additionalProperties: false
    }]
  },
  create(context) {
    // Implementation here
  }
};
```

### 1.2 Pattern Detection Logic
**Target:** Identify dangerous localhost patterns

**Database Connection Patterns:**
```javascript
const dangerousPatterns = [
  // PostgreSQL client configurations
  { pattern: /host:\s*['"`]localhost['"`]/, message: 'Hardcoded localhost host' },
  { pattern: /['"`]localhost:5432['"`]/, message: 'Hardcoded localhost:5432 connection' },
  { pattern: /['"`]postgresql:\/\/[^'"`]*localhost[^'"`]*['"`]/, message: 'Hardcoded localhost in connection string' },
  
  // Generic localhost patterns
  { pattern: /['"`]http:\/\/localhost:\d+['"`]/, message: 'Hardcoded localhost HTTP URL' },
  { pattern: /['"`]127\.0\.0\.1:\d+['"`]/, message: 'Hardcoded 127.0.0.1 connection' },
  
  // Redis connections
  { pattern: /redis:\/\/localhost:\d+/, message: 'Hardcoded localhost Redis connection' }
];
```

**AST Node Analysis:**
```javascript
function checkObjectExpression(node) {
  node.properties.forEach(property => {
    if (property.key.name === 'host' && 
        property.value.type === 'Literal' && 
        property.value.value === 'localhost') {
      context.report({
        node: property,
        message: 'Hardcoded localhost in database configuration',
        suggest: [{
          desc: 'Use environment variable',
          fix: (fixer) => generateEnvironmentFix(fixer, property)
        }]
      });
    }
  });
}
```

### 1.3 File Context Classification
**Target:** Different rules for different file types

```javascript
function getFileContext(filename) {
  const criticalPatterns = [
    /scripts\/.*\.(ts|js|mjs)$/,
    /src\/lib\/.*\.(ts|js)$/,
    /src\/pages\/api\/.*\.(ts|js)$/,
    /src\/components\/.*\.(ts|js)$/
  ];
  
  const allowedPatterns = [
    /.*\.test\.(ts|js)$/,
    /.*\.spec\.(ts|js)$/,
    /.*\.local\.(ts|js)$/,
    /dev-tools\/.*\.(ts|js)$/,
    /examples\/.*\.(ts|js)$/
  ];
  
  if (criticalPatterns.some(p => p.test(filename))) return 'critical';
  if (allowedPatterns.some(p => p.test(filename))) return 'allowed';
  return 'default';
}
```

### 1.4 Automatic Fix Suggestions
**Target:** Provide actionable fixes

```javascript
function generateEnvironmentFix(fixer, property) {
  const suggestions = {
    host: "process.env.DATABASE_HOST || 'localhost'",
    connectionString: "process.env.DATABASE_URL",
    url: "process.env.API_BASE_URL || 'http://localhost:4321'"
  };
  
  return fixer.replaceText(property.value, suggestions[property.key.name]);
}
```

## Phase 2: Pre-commit Hook Implementation

### 2.1 Husky Setup Enhancement
**Target:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Checking for hardcoded localhost..."

# Run localhost detection
npm run lint:localhost-check

# Check exit code
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked: Hardcoded localhost detected"
  echo "💡 Use environment variables for production connections"
  echo ""
  exit 1
fi

echo "✅ Localhost check passed"

# Continue with other pre-commit checks
npm run lint
npm run type-check
```

### 2.2 Lint Script Configuration
**Target:** `package.json` scripts

```json
{
  "scripts": {
    "lint:localhost-check": "eslint --ext .ts,.js,.mjs --no-eslintrc --config .eslintrc.localhost.js .",
    "lint:localhost-fix": "eslint --ext .ts,.js,.mjs --no-eslintrc --config .eslintrc.localhost.js . --fix",
    "check:production-safety": "node scripts/check-production-safety.js"
  }
}
```

### 2.3 Dedicated ESLint Configuration
**Target:** `.eslintrc.localhost.js`

```javascript
module.exports = {
  plugins: ['error-prevention'],
  rules: {
    'error-prevention/no-hardcoded-localhost': ['error', {
      criticalFiles: [
        'scripts/**/*.{ts,js,mjs}',
        'src/lib/**/*.{ts,js}',
        'src/pages/api/**/*.{ts,js}',
        'src/components/**/*.{ts,js}'
      ],
      allowedFiles: [
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        '**/*.local.{ts,js}',
        'dev-tools/**/*.{ts,js}'
      ]
    }]
  }
};
```

## Phase 3: Static Analysis Tool

### 3.1 Production Safety Checker
**Target:** `scripts/check-production-safety.js`

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class ProductionSafetyChecker {
  constructor() {
    this.violations = [];
    this.checkedFiles = 0;
  }
  
  checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = this.detectLocalhostPatterns(content, filePath);
    
    if (violations.length > 0) {
      this.violations.push({ file: filePath, violations });
    }
    
    this.checkedFiles++;
  }
  
  detectLocalhostPatterns(content, filePath) {
    const patterns = [
      {
        regex: /host:\s*['"`]localhost['"`]/g,
        message: 'Hardcoded localhost host in database config',
        suggestion: 'Use process.env.DATABASE_HOST || \'localhost\''
      },
      {
        regex: /['"`]postgresql:\/\/[^'"`]*localhost[^'"`]*['"`]/g,
        message: 'Hardcoded localhost in PostgreSQL connection string',
        suggestion: 'Use process.env.DATABASE_URL'
      },
      {
        regex: /fetch\(\s*['"`]http:\/\/localhost:\d+[^'"`]*['"`]/g,
        message: 'Hardcoded localhost URL in fetch call',
        suggestion: 'Use environment-aware base URL'
      }
    ];
    
    return patterns.reduce((violations, pattern) => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        violations.push({
          line: this.getLineNumber(content, match.index),
          column: this.getColumnNumber(content, match.index),
          pattern: match[0],
          message: pattern.message,
          suggestion: pattern.suggestion
        });
      }
      return violations;
    }, []);
  }
  
  generateReport() {
    if (this.violations.length === 0) {
      console.log(`✅ Production safety check passed (${this.checkedFiles} files)`);
      return true;
    }
    
    console.log(`❌ Production safety violations found:\n`);
    
    this.violations.forEach(({ file, violations }) => {
      console.log(`📄 ${file}:`);
      violations.forEach(v => {
        console.log(`  Line ${v.line}:${v.column} - ${v.message}`);
        console.log(`    Pattern: ${v.pattern}`);
        console.log(`    💡 Suggestion: ${v.suggestion}\n`);
      });
    });
    
    return false;
  }
}
```

### 3.2 Integration with CI/CD
**Target:** `.github/workflows/production-safety.yml`

```yaml
name: Production Safety Check

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  safety-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run production safety check
      run: npm run check:production-safety
    
    - name: Run localhost lint check
      run: npm run lint:localhost-check
```

## Phase 4: Testing Strategy

### 4.1 ESLint Rule Tests
**Target:** `eslint-plugin-error-prevention/tests/no-hardcoded-localhost.test.js`

```javascript
const rule = require('../rules/no-hardcoded-localhost');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
});

ruleTester.run('no-hardcoded-localhost', rule, {
  valid: [
    'const client = new pg.Client({ connectionString: process.env.DATABASE_URL })',
    'const host = process.env.DATABASE_HOST || "localhost"',
    'fetch(process.env.API_BASE_URL + "/api/test")',
    // Test files should be allowed
    { code: 'const host = "localhost"', filename: 'test.spec.ts' }
  ],
  
  invalid: [
    {
      code: 'const client = new pg.Client({ host: "localhost" })',
      filename: 'scripts/migrate.ts',
      errors: [{
        message: 'Hardcoded localhost in database configuration',
        suggestions: [{
          desc: 'Use environment variable',
          output: 'const client = new pg.Client({ host: process.env.DATABASE_HOST || \'localhost\' })'
        }]
      }]
    },
    {
      code: 'fetch("http://localhost:4321/api/test")',
      filename: 'src/lib/api.ts',
      errors: [{ message: 'Hardcoded localhost HTTP URL' }]
    }
  ]
});
```

### 4.2 Integration Tests
**Target:** `tests/integration/localhost-detection.test.ts`

```typescript
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('Localhost Detection Integration', () => {
  const testFile = join(process.cwd(), 'test-localhost.ts');
  
  afterEach(() => {
    try { unlinkSync(testFile); } catch {}
  });
  
  test('detects hardcoded localhost in database config', () => {
    writeFileSync(testFile, `
      const client = new pg.Client({
        host: 'localhost',
        port: 5432,
        database: 'test'
      });
    `);
    
    expect(() => {
      execSync('npm run lint:localhost-check', { stdio: 'pipe' });
    }).toThrow();
  });
  
  test('allows environment-aware configuration', () => {
    writeFileSync(testFile, `
      const client = new pg.Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'test'
      });
    `);
    
    expect(() => {
      execSync('npm run lint:localhost-check', { stdio: 'pipe' });
    }).not.toThrow();
  });
});
```

## Phase 5: Documentation and Guidelines

### 5.1 Development Guidelines
**Target:** `docs/PRODUCTION_SAFETY.md`

```markdown
# Production Safety Guidelines

## Database Connections

### ❌ Don't
```javascript
const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'party'
});
```

### ✅ Do
```javascript
const client = new pg.Client(
  process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : { host: 'localhost', port: 5432, database: 'party' }
);
```

## API Endpoints

### ❌ Don't
```javascript
fetch('http://localhost:4321/api/test')
```

### ✅ Do
```javascript
const baseUrl = process.env.API_BASE_URL || 'http://localhost:4321';
fetch(`${baseUrl}/api/test`)
```
```

### 5.2 Troubleshooting Guide
**Target:** `docs/LOCALHOST_DETECTION.md`

Common fixes for localhost detection violations:
1. Database connections
2. API endpoints
3. File paths
4. Service configurations

## Phase 6: Performance Optimization

### 6.1 Efficient Pattern Matching
- Use compiled regexes for better performance
- Cache file classification results
- Optimize AST traversal

### 6.2 Selective File Scanning
- Skip node_modules and build directories
- Use .gitignore patterns
- Parallel processing for large codebases

## Success Metrics

1. **Detection Accuracy**: 100% catch rate for hardcoded localhost in critical files
2. **False Positives**: < 5% false positive rate for legitimate localhost usage
3. **Performance**: Pre-commit hook completes in < 3 seconds
4. **Developer Experience**: Clear error messages with actionable fixes
5. **Integration**: Seamless integration with existing ESLint configuration

## Risk Mitigation

### Potential Issues:
1. **False Positives**: Legitimate localhost usage flagged as errors
2. **Performance**: Slow pre-commit hooks affecting developer workflow
3. **Complexity**: Over-complicated rules difficult to maintain
4. **Bypass**: Developers circumventing checks

### Mitigation Strategies:
1. Context-aware rules with file classification
2. Optimized pattern matching and caching
3. Simple, focused rule implementation
4. Clear documentation and training