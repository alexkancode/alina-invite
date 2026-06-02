# Railway Static Assets Implementation Plan

## Overview

Fix Railway static file serving for `/alina` subdirectories by implementing custom `nixpacks.toml` and `Caddyfile` configuration.

## Implementation Steps

### Step 1: Create nixpacks.toml Configuration
**File**: `nixpacks.toml`
**Purpose**: Configure Railway build process to use Caddy for static file serving

**Configuration Requirements**:
- Set provider to static site with Caddy
- Define build command for Astro
- Configure start command to run Caddy
- Specify port and static directory

### Step 2: Create Caddyfile Configuration
**File**: `Caddyfile`
**Purpose**: Configure Caddy web server to serve static assets from `/alina` paths

**Routing Requirements**:
- Handle `/alina/*` paths to serve from `/public/alina/`
- Maintain existing static file serving for root-level assets
- Set appropriate headers for image files
- Implement fallback for non-static requests

### Step 3: Validation Strategy
**Local Testing**:
- Verify existing functionality remains intact
- Test build process with new configuration

**Production Testing**:
- Deploy to Railway with new configuration
- Validate `/alina/*` paths return HTTP 200
- Test admin photo gallery end-to-end

## Technical Implementation Details

### nixpacks.toml Structure
```toml
[providers]
static = "caddy"

[variables]
BUILD_CMD = "npm run build"
START_CMD = "caddy run --config Caddyfile"

[build]
cmd = "$BUILD_CMD"

[start]
cmd = "$START_CMD"
```

### Caddyfile Structure
```caddyfile
:$PORT {
    root * ./dist
    
    # Serve /alina paths from public/alina
    handle_path /alina/* {
        root * ./public/alina
        file_server
    }
    
    # Default static file serving
    file_server
    
    # Fallback for non-static content
    try_files {path} /index.html
}
```

## Testing Requirements

### Unit Tests
- Configuration file validation
- Build process verification

### Integration Tests
- HTTP status code verification for `/alina/*` paths
- Image content type validation
- Admin gallery functionality test

### Smoke Tests
- Upload photo workflow
- Gallery display workflow
- Static asset accessibility

## Risk Assessment

**Low Risk**:
- Configuration-only changes
- No code modifications required
- Reversible via Railway dashboard

**Mitigation**:
- Test locally before deployment
- Backup current Railway configuration
- Gradual rollout validation

## Success Metrics

- [ ] `/alina/thumbs/photo.jpg` returns HTTP 200
- [ ] `/alina/minigame/photo.jpg` returns HTTP 200  
- [ ] `/alina/admin-uploads/photo.jpg` returns HTTP 200
- [ ] Admin gallery displays photos correctly
- [ ] Photo upload workflow functions end-to-end
- [ ] Existing functionality unchanged