# Overlay Upload Fix - Implementation Plan

## Overview

Fix the 500 internal server error in overlay upload API by addressing import issues, database query problems, and adding comprehensive error handling.

## Phase 1: Root Cause Analysis

### 1.1 Import Path Corrections

**File**: `src/pages/api/admin/upload-overlay.ts`
- Fix import from `securityValidator.js` to `securityValidator.ts`
- Fix import from `imageOptimizer.js` to `imageOptimizer.ts`
- Ensure TypeScript compilation works correctly

### 1.2 Database Query Analysis

**Current Issue**: INSERT statement missing values for columns that RETURNING clause expects
```sql
-- Current problematic query:
INSERT INTO overlay_assets (..., active) VALUES (..., false)
RETURNING id, original_name, jpeg_path, blend_mode, opacity, active
-- blend_mode and opacity not provided but expected in RETURNING
```

**Solution**: Provide default values or use table defaults

## Phase 2: Database Query Fixes

### 2.1 Complete INSERT Statement

**File**: `src/pages/api/admin/upload-overlay.ts` (lines 54-73)
- Add `blend_mode` and `opacity` values to INSERT
- Use sensible defaults: `blend_mode: 'overlay'`, `opacity: 0.8`
- Ensure all RETURNING columns have corresponding INSERT values

### 2.2 Error Handling Enhancement

**Add specific error logging**:
- Database connection errors
- File system permission errors
- Validation errors with details
- Processing pipeline errors

## Phase 3: File System Validation

### 3.1 Directory Permissions

**File**: `src/pages/api/admin/upload-overlay.ts` (lines 42-43)
- Verify `public/overlays` directory creation works
- Add error handling for mkdir failures
- Test write permissions before attempting file operations

### 3.2 File Processing Pipeline

**Current Issue**: Processing pipeline created but not used
- Remove unused `OverlayImageOptimizer` pipeline creation
- Or implement actual image processing if needed
- Simplify for now to just validate and store

## Phase 4: Comprehensive Testing

### 4.1 Unit Tests

**File**: `tests/unit/admin/overlayUpload.test.ts`
- Test file validation scenarios
- Test database operations with mocked pool
- Test file system operations
- Test error conditions

### 4.2 Integration Tests

**File**: `tests/integration/overlay-upload-api.test.ts`
- Test complete upload flow with real files
- Test various image formats (JPEG, PNG, WebP)
- Test file size limits and validation
- Test malformed requests

### 4.3 API Testing

**Create test utilities**:
- CURL scripts for happy path testing
- Error scenario testing (invalid files, oversized files)
- Boundary condition testing

## Implementation Order

1. **Fix import paths** (immediate compilation fix)
2. **Fix database query** (core functionality fix)
3. **Add error logging** (debugging support)
4. **Test file system operations** (validation)
5. **Add comprehensive tests** (regression prevention)
6. **Deploy and validate** (end-to-end verification)

## Code Quality Checklist

### Import Organization
- **Correct TypeScript imports** - Use `.js` extension only for compiled output
- **No misplaced utilities** - Keep overlay-specific code in overlay namespace
- **Single responsibility** - Upload endpoint focuses only on upload logic

### Database Operations
- **Proper error handling** - Catch and log specific database errors
- **Transaction safety** - Consider wrapping file + DB operations in transaction
- **Column completeness** - All INSERT columns match RETURNING expectations

### File System Safety
- **Permission validation** - Check directory write access before operations
- **Error recovery** - Clean up partial uploads on failure
- **Path validation** - Prevent directory traversal attacks

### Testing Coverage
- **Unit tests** - All validation and processing functions tested
- **Integration tests** - Full upload flow tested with real files
- **Error scenarios** - All failure modes tested and handled

## Risk Mitigation

**Low Risk Changes**:
- Import path fixes are compilation-only changes
- Database query completion maintains existing functionality
- Error logging additions don't change behavior

**Medium Risk Changes**:
- File system operations need careful permission testing
- Database transaction handling needs validation

**Testing Safety Net**:
- Comprehensive test suite validates all scenarios
- CURL-based testing ensures API works end-to-end
- Error logging provides debugging information for issues

## Expected Outcomes

- Upload endpoint returns 201 for successful uploads
- Clear 400 errors for validation failures
- No more 500 errors for valid operations
- Proper error messages for debugging failed uploads
- Files correctly stored in filesystem and database