# RSVP API Bug Report

**Issue ID**: Legacy RSVP Bug  
**Severity**: Medium  
**Status**: Open  
**Affects**: Legacy RSVP functionality  
**Does NOT affect**: Week 2 photo upload/selection features

## Summary

The RSVP API endpoint returns a `409 Conflict` status code instead of the expected `200 OK` when a user submits a valid RSVP with `attending: false` (declining the invitation).

## Bug Details

### Expected Behavior
```http
POST /api/rsvp
Content-Type: application/json

{
  "name": "Bob",
  "attending": false,
  "message": "Sorry, can't make it!"
}
```

**Expected Response**: `200 OK` with success confirmation

### Actual Behavior
**Actual Response**: `409 Conflict`

### Test Failure
```
FAIL tests/api.test.ts > POST /api/rsvp > accepts a valid RSVP with attendance no
AssertionError: expected 409 to be 200 // Object.is equality
```

## Technical Analysis

### Root Cause (Suspected)
The `409 Conflict` status suggests the RSVP system is treating `attending: false` as some kind of duplicate or conflicting state, possibly due to:

1. **Business logic issue**: Server may be incorrectly validating "no" responses
2. **Duplicate detection**: Logic may be treating declined RSVPs as conflicting with existing data
3. **State management**: Possible issue with how attendance status is processed

### Code Investigation Needed
- Review `/src/pages/api/rsvp.ts` endpoint logic
- Check attendance validation rules
- Verify database constraints and unique indexes
- Review IP-based duplicate detection logic

## Impact Assessment

### ✅ **No Impact On Current Development**
- Week 2 photo upload and selection features are **completely unaffected**
- This is an isolated legacy issue in the RSVP system
- Photo functionality is fully operational and tested

### ⚠️ **User Experience Impact**
- Users may be unable to decline invitations properly
- Could lead to confusion or frustration for guests
- May result in inaccurate attendance tracking

## Reproduction Steps

1. Start the development server: `npm run dev`
2. Send POST request to `/api/rsvp` with `attending: false`
3. Observe `409 Conflict` response instead of `200 OK`

Alternatively:
```bash
npm run test:api -- tests/api.test.ts -t "accepts a valid RSVP with attendance no"
```

## Workaround

Currently no workaround available. Users may need to:
- RSVP with `attending: true` and add clarification in message
- Contact event organizer directly

## Priority & Timeline

**Priority**: Medium (affects user experience but not core functionality)  
**Suggested Timeline**: Address in Week 3 or dedicated maintenance sprint  
**Blocking**: No - does not block photo upload feature development

## Investigation Notes

### Working RSVP Scenarios
The following RSVP scenarios work correctly:
- ✅ `attending: true` with message
- ✅ `attending: true` without message  
- ✅ Empty message handling
- ✅ IP-based duplicate prevention
- ✅ Name validation
- ✅ GET requests for RSVP list

### Failing Scenario
- ❌ `attending: false` (returns 409 instead of 200)

## Related Files

- `src/pages/api/rsvp.ts` - Main RSVP API endpoint
- `tests/api.test.ts` - Test showing the failure
- Database migration for RSVP table structure

## Resolution Strategy

1. **Code Review**: Examine the `attending: false` handling logic
2. **Database Investigation**: Check for constraint violations  
3. **Business Logic Audit**: Verify attendance status validation rules
4. **Test Expansion**: Add more specific test cases for edge cases
5. **Fix Implementation**: Address root cause
6. **Regression Testing**: Ensure fix doesn't break working functionality

## Contact

**Reported by**: Claude Code (Week 2 development session)  
**Date**: 2026-05-28  
**Context**: Discovered during Week 2 photo feature testing, isolated from main development track

---

*This bug is documented separately to ensure Week 2 photo upload functionality can proceed without being blocked by unrelated legacy issues.*