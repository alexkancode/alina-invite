# Feature: Localhost Detection Automation

## Problem Statement
Hardcoded localhost connections in production-critical code can cause deployment failures. Our recent issue where `scripts/migrate.ts` had hardcoded localhost database parameters caused Railway deployment to crash with ECONNREFUSED errors.

## Requirement
Create automated detection and prevention mechanisms to catch hardcoded localhost references that could break production deployments before they reach production.

## Detection Targets

### 1. Database Connection Hardcoding
- Hardcoded `host: 'localhost'` in database clients
- Hardcoded `localhost:5432` connection strings
- Missing environment variable usage for production connections

### 2. API Endpoint Hardcoding
- Hardcoded `http://localhost:PORT` URLs in fetch calls
- Missing environment-aware base URL configuration
- Absolute localhost references in production-destined code

### 3. Service Configuration Hardcoding
- Redis connections to localhost
- External service URLs pointing to localhost
- File system paths assuming local development structure

## Solution Approaches

### 1. Custom ESLint Rule
Create rule to detect hardcoded localhost patterns in production-critical files

### 2. Pre-commit Hook
Git hook to scan changed files for localhost patterns before commit

### 3. CI/CD Pipeline Check
Automated check in build process to prevent deployment with localhost references

### 4. File Pattern Analysis
Static analysis to identify problematic patterns in database, API, and configuration code

## Success Criteria
1. Detect hardcoded localhost in database connection code
2. Prevent commits with production-breaking localhost references
3. Provide clear error messages with suggested fixes
4. Allow legitimate localhost usage in development/test files
5. Integrate seamlessly into existing development workflow

## Technical Context
- **Recent Issue**: `scripts/migrate.ts` with hardcoded localhost caused Railway crash
- **File Types**: `.ts`, `.js`, `.mjs` files with database/API connections
- **Deployment Platform**: Railway (uses DATABASE_URL environment variable)
- **Development Setup**: Local Docker containers with localhost connections