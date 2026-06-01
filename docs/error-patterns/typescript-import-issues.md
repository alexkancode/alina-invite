# TypeScript Import Issues

Detailed documentation for TypeScript module resolution and import path problems.

## The .js Extension Paradox

### Problem Description
TypeScript requires `.js` extensions in import statements when using modern module resolution, even when importing `.ts` files. This creates confusion because developers must reference `.js` files that don't exist in the source code.

### Why This Happens
TypeScript preserves import specifiers unchanged during compilation. When using ES modules with Node.js-style resolution, the runtime expects `.js` extensions, so TypeScript requires them in the source code. This creates what the community calls the **"Extension Rewriting Problem"** - developers must specify runtime extensions in source code.

### Error Messages
```
An import path cannot end with a '.ts' extension
Relative import paths need explicit file extensions in EcmaScript imports
ERR_MODULE_NOT_FOUND when using .ts extensions
```

### Solutions

**Option 1: Remove Extensions (Recommended)**
```typescript
// ❌ Don't do this - import with .ts extension
import { helper } from './utils.ts';
import { config } from './config.js';

// ✅ Do this instead
import { helper } from './utils';
import { config } from './config';
```

**Option 2: Use .js for .ts files (When Required)**
```typescript
// Only when moduleResolution requires it
import { helper } from './utils.js';  // imports utils.ts
import { config } from './config.js'; // imports config.ts
```

**Option 3: Configure moduleResolution**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"  // More flexible for applications
    // or "node16" / "nodenext" for Node.js native ESM
  }
}
```

## Module Resolution Conflicts

### Problem Description
Misalignment between TypeScript configuration, build tools, and runtime environment causes module resolution failures.

### Common Scenarios

**Scenario 1: bundler vs node16 Resolution**
- Application uses Vite/Webpack (expects bundler resolution)
- tsconfig.json configured for node16 (expects .js extensions)
- Result: Import errors or TypeScript compilation failures

**Scenario 2: Development vs Production**
- Development uses bundler that handles extensions automatically
- Production deployment uses Node.js directly
- Result: Runtime module resolution failures

**Scenario 3: Mixed Module Systems**
- Some files use ES modules with extensions
- Other files use CommonJS without extensions
- Result: Inconsistent import patterns and resolution errors

### Resolution Strategy

**Step 1: Identify Target Environment**
```bash
# Check package.json for module type
cat package.json | grep '"type"'

# Check build tool configuration
cat vite.config.ts webpack.config.js next.config.js

# Check deployment environment
node --version
npm list typescript
```

**Step 2: Align Configuration**
```json
// For applications with bundlers (Vite, Webpack, etc.)
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true // or use bundler for output
  }
}

// For Node.js native ESM
{
  "compilerOptions": {
    "moduleResolution": "node16",
    "target": "ES2022",
    "module": "ES2022"
  }
}

// For Node.js CommonJS
{
  "compilerOptions": {
    "moduleResolution": "node",
    "target": "ES2020",
    "module": "CommonJS"
  }
}
```

**Step 3: Validate Import Patterns**
```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test module resolution tracing
npx tsc --traceResolution | grep "your-module"

# Test runtime loading
node -e "import('./dist/your-module.js')"
```

## ESM Import Errors

### Problem Description
ES modules have strict requirements for import specifiers that differ from CommonJS and bundler environments.

### Common Issues

**Missing Extensions:**
```typescript
// ❌ Fails in Node.js ESM
import { helper } from './utils';

// ✅ Works in Node.js ESM
import { helper } from './utils.js';
```

**Directory Imports:**
```typescript
// ❌ Fails in Node.js ESM
import { api } from './api';

// ✅ Works with explicit index file
import { api } from './api/index.js';
```

**Mixed Import Types:**
```typescript
// ❌ Mixing import styles
import config from './config.json';  // JSON import
const { helper } = require('./utils'); // CommonJS

// ✅ Consistent ES module imports
import config from './config.json' assert { type: 'json' };
import { helper } from './utils.js';
```

### Solutions

**For Node.js Native ESM:**
1. Always use .js extensions for relative imports
2. Specify index.js for directory imports
3. Use import assertions for JSON/CSS imports
4. Avoid mixing import/require syntax

**For Bundler Environments:**
1. Remove extensions from relative imports
2. Let bundler handle resolution
3. Use bundler-specific features for assets
4. Configure moduleResolution: "bundler"

**For Mixed Environments:**
1. Choose one approach consistently
2. Configure build tools to handle differences
3. Use environment-specific configurations
4. Test in both development and production

## Prevention Strategies

### Project Setup

**Clear Documentation:**
```markdown
# Import Conventions

This project uses [bundler/node16/etc] module resolution.

## Import Patterns
- Relative imports: `import { foo } from './bar'`
- Package imports: `import { foo } from 'package-name'`
- Asset imports: `import logo from './logo.svg'`

## Configuration
- TypeScript: moduleResolution: "bundler"
- Build tool: Vite with TypeScript plugin
- Runtime: Node.js with ES modules
```

**Linting Rules:**
```json
{
  "rules": {
    "import/extensions": ["error", "never", {
      "js": "never",
      "ts": "never",
      "tsx": "never"
    }]
  }
}
```

**Build Validation:**
```bash
# Add to CI/CD pipeline
npm run type-check  # npx tsc --noEmit
npm run build       # Verify build succeeds
npm run test        # Include module resolution tests
```

### Development Workflow

**Code Review Checklist:**
- [ ] Import patterns consistent with project standards
- [ ] No .ts/.tsx extensions in import statements
- [ ] Module resolution configuration unchanged without team discussion
- [ ] New imports tested in target environment

**IDE Configuration:**
- Configure TypeScript language service with project tsconfig.json
- Set up auto-import to use project conventions
- Enable real-time error checking for module resolution

**Testing Strategy:**
- Include module resolution in unit tests
- Test imports in integration tests
- Validate build output structure
- Test in production-like environment

## Troubleshooting Guide

### Quick Fixes

**"Cannot end with .ts extension":**
```bash
# Find all .ts imports
grep -r "from.*\.ts['\"]" src/

# Replace with extension-free imports
sed -i "s/from '\([^']*\)\.ts'/from '\1'/g" src/**/*.ts
```

**"ERR_MODULE_NOT_FOUND":**
```bash
# Check if file exists
find . -name "problematic-module.*"

# Check import path spelling
grep -r "problematic-module" src/

# Test module resolution
node -e "console.log(require.resolve('./src/problematic-module'))"
```

**"Relative import paths need extensions":**
```bash
# Add .js extensions (when using node16 resolution)
sed -i "s/from '\(\.\.[^']*\)'/from '\1.js'/g" src/**/*.ts
```

### Advanced Debugging

**Module Resolution Tracing:**
```bash
# Trace specific module
npx tsc --traceResolution | grep "module-name"

# Check all failed resolutions
npx tsc --traceResolution 2>&1 | grep "Failed to resolve"

# Verify configuration loading
npx tsc --showConfig
```

**Build Tool Analysis:**
```bash
# Vite import analysis
npx vite build --debug

# Webpack module resolution
npx webpack --mode development --stats-modules

# Next.js build analysis
npx next build --debug
```

## Best Practices Summary

1. **Choose One Strategy:** Align TypeScript, build tools, and runtime
2. **Document Conventions:** Clear guidelines for team members
3. **Automate Validation:** Linting and CI/CD checks
4. **Test Environment Alignment:** Development matches production
5. **Regular Updates:** Keep tooling and configuration synchronized