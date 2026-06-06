# Migration Dependency Validation

## Understanding

Prevent deployment failures caused by missing PostgreSQL role dependencies in database migrations. The system detects when migrations contain `GRANT` statements referencing roles that don't exist, which causes deployment failures like ff48c627.

## Problem Statement

Database migrations with `GRANT ... TO [role]` statements fail when the referenced role doesn't exist in the target database. Current deployment pipeline has no validation for role dependencies, leading to:

- Failed deployments due to missing PostgreSQL roles
- Container restart loops in Railway
- Manual infrastructure remediation required
- 17-day recovery cycles from failure to stable deployment

## Solution Approach

Implement precommit validation that:

1. **Parses migration files** for role dependency patterns
2. **Cross-references** GRANT statements with existing role definitions  
3. **Validates dependencies** before allowing commits
4. **Suggests remediation** when dependencies are missing

## Technical Requirements

### Detection Patterns
- Extract `GRANT ... TO [role]` statements from SQL migrations
- Identify `CREATE ROLE [role]` statements in migration history
- Flag missing role definitions before deployment

### Integration Points
- Precommit hook integration with existing git workflow
- Extension of current validation patterns (test-railway-config.js)
- Integration with existing deployment scripts

### Validation Logic
```javascript
function validateMigrationDependencies(migrationFiles) {
  const roleGrants = extractRoleGrants(migrationFiles);
  const roleDefinitions = extractRoleDefinitions(migrationFiles);
  const missingRoles = roleGrants.filter(role => !roleDefinitions.includes(role));
  
  return {
    valid: missingRoles.length === 0,
    missing: missingRoles,
    suggestions: generateRemediationSuggestions(missingRoles)
  };
}
```

## Success Criteria

- ✅ Detect missing role dependencies before commit
- ✅ Prevent ff48c627-type deployment failures
- ✅ Integrate seamlessly with existing development workflow
- ✅ Provide clear remediation guidance
- ✅ Zero false positives on existing migrations