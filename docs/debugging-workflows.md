# Debugging Workflows

Systematic approaches to diagnosing and resolving multi-layered backend error patterns.

## General Debugging Strategy

### 1. Error Categorization

**Immediate Assessment:**
- Identify which system layers are involved
- Determine if error is intermittent or consistent
- Check for recent changes in affected areas

**Layer Identification:**
- **Compilation/Build Issues:** TypeScript, module resolution, build tools
- **Runtime Issues:** Module loading, dependency resolution, environment configuration
- **Database Issues:** Query construction, schema mismatches, connection problems
- **Application Issues:** Business logic, error handling, service integration

### 2. Systematic Isolation

**Top-Down Approach:**
1. Start with the most visible error symptoms
2. Work backwards to identify root causes
3. Isolate each layer independently
4. Test assumptions at each level

**Bottom-Up Validation:**
1. Verify basic configuration at each layer
2. Test individual components in isolation
3. Gradually combine components to identify interaction issues
4. Validate full integration

## TypeScript Import Issue Debugging

### Step 1: Error Message Analysis

**Common Error Patterns:**
```
ERR_MODULE_NOT_FOUND: Cannot resolve module 'X'
An import path cannot end with a '.ts' extension
Relative import paths need explicit file extensions
```

**Diagnostic Commands:**
```bash
# Trace module resolution
npx tsc --traceResolution | grep "Module name 'X'"

# Check TypeScript configuration
cat tsconfig.json | jq '.compilerOptions.moduleResolution'

# Validate file existence
find . -name "*.ts" | grep "problematic-module"
```

### Step 2: Configuration Validation

**Module Resolution Settings:**
- Check `moduleResolution` in tsconfig.json
- Verify alignment with deployment target
- Test with different resolution strategies

**Import Pattern Validation:**
- Review import statements for extension usage
- Check for consistency across project
- Validate against project standards

### Step 3: Environment Testing

**Build Environment:**
```bash
# Test TypeScript compilation
npx tsc --noEmit

# Check bundler behavior
npm run build

# Validate output structure
ls -la dist/
```

**Runtime Environment:**
```bash
# Test module loading
node -e "console.log(require.resolve('./path/to/module'))"

# Check module resolution
node --trace-module-resolution your-app.js
```

## Database Query Mismatch Debugging

### Step 1: Error Analysis

**Common Error Patterns:**
```
Column count doesn't match value count
Column 'X' cannot be null
Unknown column 'Y' in field list
```

**Database Error Inspection:**
```sql
-- Check table structure (MySQL)
DESCRIBE your_table;

-- PostgreSQL table structure  
psql -c "\d your_table"

-- Verify column constraints
SHOW COLUMNS FROM your_table;

-- Check recent schema changes
SHOW CREATE TABLE your_table;
```

### Step 2: Query Validation

**Column Alignment Check:**
1. Compare INSERT column list with VALUES list
2. Verify RETURNING clause matches available columns
3. Check for schema changes affecting query structure

**Testing Approach:**
```sql
-- Test INSERT portion separately
INSERT INTO your_table (col1, col2, col3) VALUES ('val1', 'val2', 'val3');

-- Test RETURNING portion
SELECT col1, col2, col3 FROM your_table WHERE id = last_insert_id();

-- Combine and validate
INSERT INTO your_table (col1, col2, col3) 
VALUES ('val1', 'val2', 'val3')
RETURNING id, col1, col2, col3;
```

### Step 3: Schema Synchronization

**Application vs Database:**
- Compare application query expectations with actual schema
- Check for missing migrations or rollbacks
- Validate column types and constraints

**Resolution Workflow:**
1. Identify schema differences
2. Update application queries or run missing migrations
3. Test with realistic data
4. Verify error resolution

## Multi-Layer Error Debugging

### Step 1: Layer Isolation

**Systematic Testing:**
1. **Compilation Layer:** Does TypeScript compile without errors?
2. **Module Layer:** Do imports resolve correctly in isolation?
3. **Database Layer:** Do queries execute successfully in isolation?
4. **Integration Layer:** Do all components work together?

**Isolation Commands:**
```bash
# TypeScript compilation
npx tsc --noEmit

# Module resolution
node -e "require('./src/your-module')"

# Database query
psql -d your_db -c "YOUR_QUERY_HERE"

# Application integration
npm test -- --testPathPattern=integration
```

### Step 2: Error Correlation

**Timeline Analysis:**
- When did the error first appear?
- What changes were made around that time?
- Are multiple systems showing related errors?

**Context Gathering:**
- Application logs with timestamps
- Database query logs
- Build/deployment logs
- System configuration changes

### Step 3: Systematic Resolution

**Priority Order:**
1. Fix compilation/build issues first
2. Resolve module resolution problems
3. Address database schema mismatches
4. Verify error handling improvements

**Validation After Each Fix:**
- Test the specific layer that was fixed
- Verify no new issues were introduced
- Check integration with other layers
- Update prevention measures

## Error Handling Debug Workflow

### Step 1: Error Context Analysis

**Information Gathering:**
- What specific operation was being performed?
- What error information is available in logs?
- Can the error be reproduced consistently?

**Context Enhancement:**
```javascript
// Add detailed logging
try {
  // your operation
} catch (error) {
  console.error('Operation context:', { 
    operation: 'specific-operation',
    inputs: sanitizedInputs,
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack
  });
  throw error;
}
```

### Step 2: Error Path Tracing

**Follow the Error:**
1. Identify where error originates
2. Track error handling through application layers
3. Check what information is lost in handling
4. Verify what information reaches error response

**Debugging Enhancements:**
- Add correlation IDs to track errors across services
- Include operation context in error objects
- Preserve stack traces through error handling
- Log error details before returning generic responses

### Step 3: Error Resolution Validation

**Testing Error Scenarios:**
- Create unit tests for specific error conditions
- Verify error information is preserved and useful
- Test error handling under various conditions
- Validate that fixes resolve original issues

## Workflow Integration

### When to Use Each Workflow

**TypeScript Issues:** Import errors, compilation failures, module resolution problems
**Database Issues:** Query failures, constraint violations, schema mismatches
**Multi-Layer Issues:** Complex failures spanning multiple systems
**Error Handling Issues:** Generic errors, missing debug information, poor observability

### Tool Recommendations

**TypeScript Debugging:**
- `tsc --traceResolution` for module resolution issues
- `npx tsc --noEmit` for compilation validation
- IDE TypeScript language server for real-time feedback

**Database Debugging:**
- Database query logging for SQL analysis
- Schema comparison tools for drift detection
- Query performance tools for optimization

**Integration Debugging:**
- Application logs with structured logging
- Error correlation tools for multi-service debugging
- End-to-end testing tools for integration validation

### Documentation Updates

After resolving issues:
- Update this documentation with new patterns discovered
- Add specific error messages to pattern recognition guides
- Improve prevention checklists based on lessons learned
- Share solutions with team through knowledge documentation