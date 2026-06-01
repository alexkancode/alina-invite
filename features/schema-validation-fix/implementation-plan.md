# Schema Validation Fix - Implementation Plan

## Overview

Fix Zod validation errors by updating schemas to match actual API response field names and adding proper field mapping to maintain component interface compatibility.

## Phase 1: API Response Analysis

### 1.1 Document Actual API Response Structures

**File**: `src/schemas/actualApiResponses.ts`
- Define Zod schemas matching actual API response fields
- Include all database fields returned by APIs
- Add optional field handling for null values

**Photos API Schema**:
```typescript
const ActualPhotoSchema = z.object({
  id: z.string(),
  upload_date: z.string(),
  is_approved: z.boolean(),
  original_filename: z.string(),
  file_size: z.number(),
  upload_ip: z.string(),
  is_hidden: z.boolean(),
  moderation_notes: z.string().nullable()
});
```

**Overlays API Schema**:
```typescript
const ActualOverlaySchema = z.object({
  id: z.string(),
  filename: z.string(),
  display_name: z.string(),
  file_size: z.number(),
  is_active: z.boolean(),
  opacity: z.number(),
  blend_mode: z.string(),
  created_by: z.string(),
  description: z.string().optional()
});
```

### 1.2 Create Field Mapping Utilities

**File**: `src/lib/admin/fieldMappers.ts`
- Transform actual API fields to component interface fields
- Handle missing/null values with sensible defaults
- Type-safe mapping functions

**Single responsibility functions**:
- `mapApiPhotoToComponent(apiPhoto: ActualPhoto): PhotoAsset`
- `mapApiOverlayToComponent(apiOverlay: ActualOverlay): OverlayAsset`
- `generatePhotoPath(id: string, filename: string): string`

## Phase 2: Schema Updates

### 2.1 Update Response Handlers

**File**: `src/lib/admin/apiResponseHandlers.ts`
- Replace existing schemas with actual API schemas
- Add field mapping after validation
- Maintain existing function signatures for backward compatibility

**Changes**:
- `parsePhotosResponse()`: Validate with actual schema, then map fields
- `parseOverlaysResponse()`: Validate with actual schema, then map fields
- Keep existing error handling and fallback behavior

### 2.2 Path Generation Logic

**File**: `src/lib/admin/pathGenerators.ts`
- Generate file paths based on actual storage structure
- Handle different photo types (admin uploads, user uploads, thumbnails)
- Consistent URL generation across components

**Functions**:
- `generatePhotoUrl(id: string, filename: string, type: 'full' | 'thumb' | 'minigame'): string`
- `generateOverlayUrl(filename: string): string`

## Phase 3: Enhanced Error Handling

### 3.1 Validation Error Recovery

**File**: `src/lib/admin/validationErrorHandler.ts`
- Handle partial validation failures gracefully
- Skip invalid records instead of failing entire response
- Log validation issues for debugging

**Interface**:
```typescript
interface ValidationResult<T> {
  valid: T[];
  invalid: ValidationError[];
  totalCount: number;
}
```

### 3.2 Fallback Field Values

**File**: `src/lib/admin/fallbackValues.ts`
- Provide sensible defaults for missing fields
- Handle legacy data format differences
- Consistent fallback behavior

## Phase 4: Comprehensive Testing

### 4.1 Schema Validation Tests

**File**: `tests/unit/admin/actualApiSchemas.test.ts`
- Test actual API response validation
- Test field mapping functions
- Test error scenarios with malformed data

### 4.2 Field Mapping Tests

**File**: `tests/unit/admin/fieldMappers.test.ts`
- Test all mapping functions with real API data
- Test edge cases (null values, missing fields)
- Test path generation with various inputs

### 4.3 Integration Tests

**File**: `tests/integration/schema-validation-fixed.test.ts`
- Test complete flow from API to component
- Test with actual API response format
- Verify no console validation errors

## Code Quality Checklist

### Function Organization
- **No misplaced utilities**: Field mappers in `src/lib/admin/`, schemas in `src/schemas/`
- **Single responsibility**: Each mapper function handles one type transformation
- **No duplication**: Reuse existing path generation patterns from codebase

### Type Safety
- **Proper interfaces**: All mapping functions strongly typed
- **Schema validation**: Runtime validation before mapping
- **Error boundaries**: Invalid records don't break entire response

### Testing Coverage
- **Unit tests**: All mapper functions and schemas tested independently
- **Integration tests**: Full API-to-component flow validated
- **Edge case tests**: Null values, missing fields, malformed responses

### Error Handling
- **Graceful degradation**: Invalid records filtered out, valid ones preserved
- **Logging**: Validation errors logged for debugging
- **Fallback behavior**: Default values for missing required fields

## Implementation Order

1. **Document actual API schemas** based on real response analysis
2. **Create field mapping utilities** with comprehensive tests
3. **Update response handlers** to use new schemas and mapping
4. **Add validation error recovery** for partial failures
5. **Update integration tests** to verify fix works end-to-end
6. **Deploy and validate** no console errors appear

## Risk Mitigation

**Low Risk Changes**:
- Only validation and mapping layer changes
- Component interfaces remain unchanged
- Backward compatibility maintained for existing functionality

**Testing Safety Net**:
- TDD approach ensures no regressions
- Real API response testing validates assumptions
- Integration tests confirm end-to-end functionality