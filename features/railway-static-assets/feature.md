# Railway Static Assets Fix

## Problem Statement

Railway deployment fails to serve static assets from subdirectories in the `/public/alina/` path structure, causing admin photo gallery to display empty despite photos being uploaded and stored correctly.

## Root Cause Analysis

**Current State:**
- Local development: Static files serve correctly from `/alina/*` paths
- Production (Railway): Basic static files work, but subdirectory paths return 404
- Photos exist in database and filesystem but are not web-accessible

**Technical Issue:**
Railway's default Railpack build system does not properly configure static file serving for nested subdirectories within the `/public` folder.

## Solution Requirements

**Primary Goal:**
Enable Railway to serve static files from `/public/alina/` subdirectories including:
- `/alina/thumbs/`
- `/alina/minigame/` 
- `/alina/admin-uploads/`
- `/alina/original/`

**Implementation Approach:**
Based on Railway documentation, implement custom `nixpacks.toml` and `Caddyfile` configuration to explicitly handle static file serving for the `/alina` path structure.

## Success Criteria

- [ ] Admin photo gallery displays uploaded photos in production
- [ ] All `/alina/*` subdirectory paths return HTTP 200 instead of 404
- [ ] Photo upload and display workflow functions end-to-end in production
- [ ] Local development remains unaffected
- [ ] No breaking changes to existing functionality

## Technical Scope

**Files to Add:**
- `nixpacks.toml` - Railway build configuration
- `Caddyfile` - Web server configuration for static assets

**Files to Modify:**
- None (configuration-only fix)

**Testing Requirements:**
- Validate static file access via HTTP requests
- Test admin photo gallery functionality
- Verify photo upload-to-display workflow