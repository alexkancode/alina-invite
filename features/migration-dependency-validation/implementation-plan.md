# Migration Dependency Validation Implementation Plan

## File Structure

```
scripts/
├── migration-validator.js           # Main validation script
├── sql-parser.js                   # SQL parsing utilities  
├── role-dependency-checker.js      # Dependency validation logic
└── pre-commit-hook.js              # Git hook integration

tests/
├── unit/
│   ├── sql-parser.test.js          # SQL parsing tests
│   ├── role-dependency-checker.test.js  # Dependency logic tests
│   └── migration-validator.test.js  # Main validator tests
└── integration/
    └── migration-validation-integration.test.js  # End-to-end tests

.git/hooks/
└── pre-commit                      # Git hook entry point
```

## Implementation Components

### 1. SQL Parser (`scripts/sql-parser.js`)

**Purpose**: Extract role-related statements from SQL files
**Interface**:
```javascript
export function extractRoleGrants(sqlContent: string): string[]
export function extractRoleCreations(sqlContent: string): string[]  
export function extractGrantStatements(sqlContent: string): GrantStatement[]
```

**Responsibilities**:
- Parse SQL files for `GRANT ... TO [role]` patterns
- Extract `CREATE ROLE [role]` statements
- Handle SQL comments and multi-line statements
- Return structured data for dependency checking

### 2. Role Dependency Checker (`scripts/role-dependency-checker.js`)

**Purpose**: Validate role dependencies across migration files
**Interface**:
```javascript
export function validateRoleDependencies(migrationFiles: string[]): ValidationResult
export function buildRoleRegistry(migrationFiles: string[]): Set<string>
export function findMissingRoles(grants: string[], roles: Set<string>): string[]
export function generateRemediationSuggestions(missingRoles: string[]): string[]
```

**Responsibilities**:
- Cross-reference grants with role definitions
- Build comprehensive role registry from all migrations
- Identify missing role dependencies
- Generate actionable remediation suggestions

### 3. Migration Validator (`scripts/migration-validator.js`)

**Purpose**: Main validation orchestration
**Interface**:
```javascript
export function validateMigrations(migrationDir: string): ValidationResult
export function getAllMigrationFiles(directory: string): string[]
export function formatValidationOutput(result: ValidationResult): string
```

**Responsibilities**:
- Discover migration files in directory
- Orchestrate SQL parsing and dependency checking
- Format user-friendly validation output
- Provide exit codes for git hook integration

### 4. Pre-commit Hook (`scripts/pre-commit-hook.js`)

**Purpose**: Git hook integration
**Interface**:
```javascript
export function runPreCommitValidation(): Promise<boolean>
export function handleValidationFailure(result: ValidationResult): void
```

**Responsibilities**:
- Execute validation on git commit
- Handle validation results appropriately
- Provide clear feedback to developer
- Exit with appropriate codes for git

## Data Structures

### GrantStatement
```javascript
interface GrantStatement {
  privileges: string[];
  objectType: string;
  objectName: string;
  grantee: string;
  fileName: string;
  lineNumber: number;
}
```

### ValidationResult  
```javascript
interface ValidationResult {
  valid: boolean;
  missingRoles: string[];
  grantStatements: GrantStatement[];
  roleDefinitions: string[];
  suggestions: string[];
  errors: string[];
}
```

## Integration Points

### Existing Code Reuse
- Extend `test-railway-config.js` pattern for configuration validation
- Reuse file system utilities from existing scripts
- Integrate with existing deployment script error handling patterns

### New Utilities Placement
- `sql-parser.js`: New utility, appropriate location in scripts/
- `role-dependency-checker.js`: New utility, specific to this feature
- No duplication with existing utilities confirmed

## Testing Strategy

### Unit Tests
1. **SQL Parser Tests**:
   - Parse various GRANT statement formats
   - Extract CREATE ROLE statements correctly  
   - Handle SQL comments and edge cases
   - Validate line number tracking

2. **Dependency Checker Tests**:
   - Validate role dependency logic
   - Test missing role detection
   - Verify remediation suggestion generation
   - Edge cases: circular dependencies, case sensitivity

3. **Migration Validator Tests**:
   - File discovery and reading
   - Integration of parser and checker components
   - Error handling and output formatting
   - Performance with large migration sets

### Integration Tests
1. **End-to-End Validation**:
   - Real migration files from repository
   - Complete validation workflow
   - Git hook integration testing
   - Error scenarios and recovery

2. **Canary Tests**:
   - Type contract validation for interfaces
   - API compatibility checks
   - Configuration schema validation

### Test Data
- Use real migration file examples from repository
- Create minimal reproduction cases for edge scenarios
- Mock file system operations for isolated testing

## Error Handling

### Graceful Failures
- Invalid SQL syntax: Log warning, continue validation
- File read errors: Report specific file issues
- Parser errors: Provide context and line numbers
- Missing migration directory: Clear user guidance

### User Feedback
- Clear error messages with file names and line numbers
- Actionable remediation suggestions
- Exit codes appropriate for git hook usage
- Colored output for improved readability

## Performance Considerations

### Optimization Strategies
- Cache parsed migration results during single validation run
- Lazy loading of migration files
- Early exit on first missing dependency (configurable)
- Minimal file I/O through efficient batching

### Scalability
- Handle repositories with 100+ migration files
- Reasonable memory usage with large SQL files  
- Fast execution time for git hook usage (< 1 second)

## Security Considerations

### SQL Injection Prevention
- No dynamic SQL execution
- Pure parsing approach without evaluation
- Safe regex patterns for statement extraction

### File System Safety
- Validate migration file paths
- Prevent directory traversal attacks
- Read-only file operations

## Implementation Phases

### Phase 1: Core Parsing and Validation
1. Implement SQL parser with role extraction
2. Build dependency checker with validation logic
3. Create comprehensive unit tests
4. Validate against existing migration files

### Phase 2: Integration and Git Hooks
1. Implement main migration validator orchestration
2. Create pre-commit hook integration
3. Add integration tests
4. Test with actual git workflow

### Phase 3: User Experience and Polish
1. Improve error messages and formatting
2. Add configuration options
3. Performance optimization
4. Documentation and examples

## Configuration Options

### Validation Settings
```javascript
const config = {
  migrationDir: './migrations',
  enableStrictMode: false,          // Fail on warnings
  ignoreRoles: ['postgres', 'public'], // System roles to ignore
  requireRoleCreation: true,        // Require explicit CREATE ROLE statements
  enableSuggestions: true           // Generate remediation suggestions
};
```

## Success Metrics

- Zero false positives on existing migration files
- 100% detection rate for role dependency issues
- < 1 second execution time for validation
- Clear user feedback in 100% of failure cases
- Zero security vulnerabilities in SQL parsing