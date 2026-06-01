# Error Prevention Checklist

Proactive measures to prevent common backend error patterns before they occur.

## TypeScript Import Issues Prevention

### Module Resolution Configuration

- [ ] **Set explicit moduleResolution** in tsconfig.json
  - Use `"bundler"` for applications with build tools
  - Use `"node16"` or `"nodenext"` for Node.js native modules
  - Document choice in project README

- [ ] **Configure extension handling**
  - Remove extensions from relative imports: `import { foo } from './module'`
  - Use `.js` extensions only when required by moduleResolution setting
  - Test import resolution with `tsc --traceResolution`

- [ ] **Validate build tool alignment**
  - Ensure bundler configuration matches TypeScript settings
  - Test module loading in target deployment environment
  - Verify extension handling in production builds

### Development Workflow

- [ ] **Import path validation in CI/CD**
  - Add linting rules for consistent import patterns
  - Validate TypeScript compilation in automated tests
  - Check for extension mismatches in code reviews

- [ ] **Team documentation**
  - Document project import conventions
  - Provide examples of correct import patterns
  - Include troubleshooting guide for module resolution issues

## Database Query Mismatch Prevention

### Schema Management

- [ ] **Explicit column specification**
  - Always specify columns in INSERT statements
  - Match INSERT and RETURNING clauses exactly
  - Avoid reliance on implicit column ordering

- [ ] **Schema evolution workflow**
  - Couple application updates with schema changes
  - Test migrations on production-scale data
  - Implement rollback procedures for all schema changes

- [ ] **Database constraint validation**
  - Add NOT NULL constraints at database level
  - Implement CHECK constraints for data validation
  - Use foreign key constraints to ensure referential integrity

### Query Construction Standards

- [ ] **Column validation in tests**
  - Test INSERT/RETURNING clause alignment
  - Validate query construction against current schema
  - Add integration tests for database operations

- [ ] **Code review requirements**
  - Review all database queries for column specification
  - Verify schema changes include application updates
  - Check for hardcoded column assumptions

## Error Handling Failure Prevention

### Logging Standards

- [ ] **Specific error logging**
  - Log specific error information at each failure point
  - Include context information for debugging
  - Use structured logging for error analysis

- [ ] **Error correlation**
  - Implement error correlation IDs across services
  - Preserve error context through exception chains
  - Track errors across multiple system layers

### Error Response Design

- [ ] **Environment-appropriate error details**
  - Provide detailed error information in development
  - Return safe error messages in production
  - Maintain debug information in logging systems

- [ ] **Error handling coverage**
  - Implement specific handlers for expected failure modes
  - Avoid generic catch-all error handling
  - Test error scenarios in automated test suites

## Multi-Layer Configuration Validation

### Integration Testing

- [ ] **Cross-layer testing**
  - Test TypeScript compilation with target module system
  - Validate database operations against current schema
  - Verify error handling provides useful information

- [ ] **Configuration drift detection**
  - Regular validation of configuration alignment
  - Automated testing of integration points
  - Documentation of configuration dependencies

### Deployment Validation

- [ ] **Pre-deployment testing**
  - Test module loading in production environment
  - Validate database migrations on realistic data
  - Verify error handling in production-like conditions

- [ ] **Post-deployment monitoring**
  - Monitor for module resolution errors
  - Track database constraint violations
  - Alert on increased error rates or generic error responses

## Team Process Integration

### Code Review Standards

- [ ] **Import pattern review**
  - Verify correct extension usage
  - Check for consistent import patterns
  - Validate module resolution compatibility

- [ ] **Database change review**
  - Ensure column specifications are explicit
  - Verify application updates accompany schema changes
  - Check for proper error handling

### Documentation Maintenance

- [ ] **Keep configuration documented**
  - Update README for any module resolution changes
  - Document database schema evolution procedures
  - Maintain error handling standards documentation

- [ ] **Team training**
  - Onboard new team members on import conventions
  - Train on database best practices
  - Share error handling standards

## Checklist Usage

### Before Development

Run through relevant sections based on planned changes:
- TypeScript sections for module/import changes
- Database sections for schema or query changes  
- Error handling sections for API or service changes

### During Code Review

Focus on prevention measures for areas being modified:
- Validate import patterns match project standards
- Check database operations against schema requirements
- Verify error handling provides appropriate information

### Pre-Deployment

Complete validation across all layers:
- Test module resolution in target environment
- Validate database operations against production schema
- Verify error handling works in production conditions

## Regular Maintenance

### Weekly
- [ ] Review error logs for patterns indicating configuration drift
- [ ] Validate TypeScript compilation with latest dependencies
- [ ] Check database query performance and error rates

### Monthly  
- [ ] Update documentation for any configuration changes
- [ ] Review and update error handling standards
- [ ] Validate prevention measures are being followed

### Quarterly
- [ ] Comprehensive review of all configuration alignment
- [ ] Update checklists based on lessons learned
- [ ] Team retrospective on prevention effectiveness