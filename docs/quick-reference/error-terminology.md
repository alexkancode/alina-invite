# Error Terminology Quick Reference

Fast lookup for error patterns and their community terminology.

## TypeScript Import Issues

| Error Message | Community Term | Quick Fix |
|---------------|----------------|-----------|
| "An import path cannot end with a '.ts' extension" | The .js Extension Paradox | Remove `.ts` extension from imports |
| "ERR_MODULE_NOT_FOUND" | Module Resolution Conflict | Check `moduleResolution` in tsconfig.json |
| "Relative import paths need explicit file extensions" | ESM Import Error | Add `.js` extensions or use bundler resolution |

**Common Patterns:**
- **"The .js Extension Paradox"** → Use `.js` in imports for `.ts` files when using Node.js ESM
- **"Module Resolution Conflicts"** → Misaligned TypeScript config vs runtime environment
- **"ESM Import Errors"** → Missing extensions in ES module imports

## Database Query Issues

| Error Message | Community Term | Quick Fix |
|---------------|----------------|-----------|
| "Column count doesn't match value count" | Column Mismatch Error | Align INSERT columns with VALUES count |
| "Column 'X' cannot be null" | Schema Evolution Drift | Add missing column to INSERT or provide default |
| "Unknown column 'Y' in field list" | Schema Evolution Drift | Update query for current schema or run migration |

**Common Patterns:**
- **"Column Mismatch Errors"** → INSERT/RETURNING column count discrepancies
- **"Schema Evolution Drift"** → Application queries not updated after schema changes
- **"Query Construction Anti-Patterns"** → Missing explicit column specifications

## Error Handling Issues

| Symptom | Community Term | Quick Fix |
|---------|----------------|-----------|
| Generic "Internal server error" | Debugging Blind Spot | Add specific error logging |
| No error correlation across services | Error Cascade Masking | Implement correlation IDs |
| Lost original error context | Observability Failure | Preserve error chain with context |

**Common Patterns:**
- **"Debugging Blind Spots"** → Generic error responses with no actionable information
- **"Error Cascade Masking"** → Root causes hidden behind generic error responses
- **"Observability Failures"** → Lack of specific error logging for troubleshooting

## Multi-Layer Failure Patterns

| Scenario | Community Term | Resolution Strategy |
|----------|----------------|-------------------|
| Multiple small issues combine | Death by a Thousand Paper Cuts | Systematic layer isolation and priority-based fixes |
| Stack layers become misaligned | Infrastructure Configuration Drift | Configuration validation across all layers |
| Working in dev, failing in prod | Environment Configuration Mismatch | Align development and production environments |

## Error Message to Pattern Mapping

### TypeScript Compilation Errors
```
"Cannot find module './module.ts'" → Module Resolution Conflict
"Import path cannot end with '.ts'" → The .js Extension Paradox
"Module not found: Error: Can't resolve" → Build Tool Configuration Issue
```

### Database Operation Errors
```
"ERROR 1136: Column count doesn't match" → Column Mismatch Error
"duplicate key value violates unique constraint" → Schema Constraint Issue
"column \"X\" of relation \"Y\" does not exist" → Schema Evolution Drift
```

### Runtime Module Errors
```
"ERR_MODULE_NOT_FOUND: Cannot find module" → Module Resolution Conflict
"Cannot resolve module" → ESM Import Error
"Unexpected token 'export'" → CommonJS/ESM Mismatch
```

## Quick Diagnostic Questions

### For TypeScript Issues
1. **"Does TypeScript compile?"** → `npx tsc --noEmit`
2. **"Do imports use correct extensions?"** → Check for `.ts` in import paths
3. **"Is moduleResolution aligned with deployment?"** → Check tsconfig.json vs runtime

### For Database Issues
1. **"Do INSERT and RETURNING columns match?"** → Count columns and compare
2. **"Has schema changed recently?"** → Check migration history
3. **"Are column names spelled correctly?"** → Verify against current schema

### For Error Handling Issues
1. **"Is specific error information logged?"** → Check logs for detail level
2. **"Can errors be correlated across requests?"** → Look for correlation IDs
3. **"Is error context preserved?"** → Trace error through handling chain

### For Multi-Layer Issues
1. **"Which layers are failing?"** → Test each layer independently
2. **"When did the failure start?"** → Correlate with recent changes
3. **"Is configuration aligned?"** → Validate config across all layers

## Resolution Workflow Quick Guide

### Step 1: Categorize the Error
- **Compilation Error** → TypeScript/build issue
- **Runtime Error** → Module resolution/environment issue
- **Database Error** → Schema/query issue
- **Generic Error** → Error handling issue

### Step 2: Apply Layer-Specific Fix
- **TypeScript Layer** → Fix imports, update config
- **Database Layer** → Align schema and queries
- **Error Handling Layer** → Add specific logging
- **Integration Layer** → Test all layers together

### Step 3: Validate Fix
- **Individual Layer** → Test the specific layer that was fixed
- **Integration** → Test interaction with other layers
- **End-to-End** → Test complete workflow

## Emergency Debugging Commands

### TypeScript Issues
```bash
# Check compilation
npx tsc --noEmit

# Trace module resolution
npx tsc --traceResolution | grep "module-name"

# Check configuration
npx tsc --showConfig
```

### Database Issues
```bash
# Check table structure
psql -c "\\d table_name"

# Test query manually
psql -c "SELECT * FROM table_name LIMIT 1"

# Check recent migrations
npm run db:migration:status
```

### Module Resolution Issues
```bash
# Test module loading
node -e "console.log(require.resolve('./path/to/module'))"

# Check file existence
find . -name "problematic-module.*"

# Test import in Node.js
node -e "import('./path/to/module.js')"
```

## Community Resources

### Most Referenced Error Discussions
- **TypeScript Handbook - Module Resolution** → Official guidance on import patterns
- **Stack Overflow - "An import path cannot end with '.ts'"** → Community solutions
- **PostgreSQL Documentation - RETURNING Clause** → Database query construction
- **Node.js Documentation - ES Modules** → Runtime module requirements

### Best Practice Sources
- **TypeScript Best Practices** → Consistent import conventions
- **Database Migration Guides** → Schema evolution strategies  
- **Error Handling Patterns** → Observability and debugging practices
- **Development Workflow Guides** → Prevention and validation approaches

## Related Documentation

- [Backend Error Taxonomy](../backend-error-taxonomy.md) - Comprehensive error pattern guide
- [Debugging Workflows](../debugging-workflows.md) - Systematic troubleshooting procedures
- [Error Prevention Checklist](../error-prevention-checklist.md) - Proactive prevention measures