# Backend Error Taxonomy

A comprehensive guide to common backend error patterns, their community terminology, and systematic approaches to prevention and debugging.

## Overview

Backend systems often fail due to combinations of small misconfigurations across multiple layers, creating complex debugging scenarios. This taxonomy provides standardized terminology and systematic approaches for identifying, preventing, and resolving these issues.

## Error Pattern Categories

### 1. TypeScript Import Path Issues

**Common Terminology:**
- **"The .js Extension Paradox"** - Using `.js` imports for `.ts` files in modern module systems
- **"Module Resolution Conflicts"** - Mismatched import paths between development and runtime environments
- **"ESM Import Errors"** - Extension-related failures in ES module contexts

**Typical Symptoms:**
- `ERR_MODULE_NOT_FOUND` during runtime
- "An import path cannot end with a '.ts' extension" compilation errors
- Module resolution failures in production environments

**Root Causes:**
- Extension mismatch between TypeScript and runtime expectations
- Module resolution settings not aligned with deployment target
- Build tool assumptions about extension handling

**Resolution Strategies:**
- Remove extensions from relative imports
- Configure `moduleResolution` to match deployment environment
- Use build tools to handle extension transformation
- Apply consistent import patterns across project

### 2. Database Query Mismatches

**Common Terminology:**
- **"Column Mismatch Errors"** - INSERT/RETURNING column count discrepancies
- **"Schema Evolution Drift"** - Applications lagging behind database structure changes
- **"Query Construction Anti-Patterns"** - Missing explicit column specifications

**Typical Symptoms:**
- "Column count doesn't match value count" database errors
- Constraint violations on newly added columns
- Null value errors for non-nullable fields

**Root Causes:**
- INSERT statements missing columns expected by RETURNING clauses
- Application queries not updated after schema changes
- Reliance on implicit column ordering instead of explicit specification

**Resolution Strategies:**
- Always specify columns explicitly in INSERT statements
- Ensure INSERT and RETURNING clauses match exactly
- Implement schema validation in CI/CD pipeline
- Use database migrations with rollback procedures

### 3. Error Handling Failures

**Common Terminology:**
- **"Debugging Blind Spots"** - Generic error responses with no actionable information
- **"Error Cascade Masking"** - Root causes hidden behind generic error responses
- **"Observability Failures"** - Lack of specific error logging for troubleshooting

**Typical Symptoms:**
- Generic 500 Internal Server Error responses
- No correlation between error symptoms and root causes
- Missing context for debugging failed operations

**Root Causes:**
- Catch-all error handlers without specific logging
- Error context lost during exception propagation
- Missing error correlation across system layers

**Resolution Strategies:**
- Implement specific error logging at each failure point
- Preserve error context through exception handling chain
- Provide different error detail levels for development vs production
- Create error correlation IDs for multi-service debugging

## Multi-Layered Failure Patterns

### Infrastructure Configuration Drift

**Definition:** Multiple stack layers (TypeScript compilation, database schema, error handling) becoming misaligned over time, creating compound failures.

**Characteristics:**
- Each individual issue appears simple to fix
- Combination makes debugging extremely difficult
- Generic error messages mask root causes
- Issues span multiple application layers

**Prevention Strategies:**
- Regular configuration validation across all layers
- Automated testing of integration points
- Documentation of configuration dependencies
- Version control for all configuration files

### Death by a Thousand Paper Cuts

**Definition:** Multiple small misconfigurations that individually seem insignificant but combine to create seemingly complex problems.

**Common Scenarios:**
- Import path + schema mismatch + poor error logging
- Configuration drift + missing validation + generic errors
- Build tool assumptions + runtime differences + no observability

**Resolution Approach:**
1. Systematic isolation of each layer
2. Individual validation of each configuration
3. Step-by-step elimination of misconfigurations
4. Comprehensive testing of interactions

## Community Best Practices

### TypeScript Module Management

**Explicit Configuration:**
- Set `moduleResolution` explicitly in tsconfig.json
- Document import patterns in project README
- Use consistent extension handling across team

**Build Tool Integration:**
- Configure bundlers to handle extension resolution
- Test module loading in target environment
- Validate import paths during CI/CD

### Database Schema Management

**Version Control:**
- All schema changes tracked in migration files
- Application updates coupled with schema changes
- Rollback procedures tested for each migration

**Validation Integration:**
- Schema validation in test suites
- Column specification enforcement in code reviews
- Automated detection of query/schema mismatches

### Error Handling Standards

**Observability Requirements:**
- Specific error logging at each failure point
- Error correlation across service boundaries
- Context preservation through exception chains

**Development vs Production:**
- Detailed error information in development
- Safe error messages in production
- Debug information available through logging systems

## Quick Reference

### Diagnostic Questions

**For TypeScript Issues:**
- Are import paths using correct extensions?
- Does moduleResolution match deployment target?
- Are build tools handling extensions correctly?

**For Database Issues:**
- Do INSERT and RETURNING columns match exactly?
- Has schema changed without application updates?
- Are column names explicitly specified?

**For Error Handling:**
- Is specific error information being logged?
- Are error contexts preserved through handling?
- Is debugging information available for diagnosis?

### Resolution Workflows

1. **Identify Layer** - Determine which system layer is failing
2. **Isolate Configuration** - Test each configuration independently  
3. **Validate Assumptions** - Verify expected behavior matches actual
4. **Implement Fixes** - Address root causes systematically
5. **Add Prevention** - Implement measures to prevent recurrence

## Related Documentation

- [Error Prevention Checklist](error-prevention-checklist.md)
- [Debugging Workflows](debugging-workflows.md)
- [TypeScript Import Issues](error-patterns/typescript-import-issues.md)
- [Database Query Mismatches](error-patterns/database-query-mismatches.md)