# Implementation Plan: Spotify Network Error Debug

## Phase 1: Immediate Diagnosis

### 1.1 Direct API Testing
**Target:** Verify if API endpoint is accessible
- [ ] Test production API directly: `curl "https://yait.social/api/music-search?q=test"`
- [ ] Test local API: `curl "http://localhost:4321/api/music-search?q=test"`
- [ ] Compare response headers and status codes
- [ ] Check for CORS headers in production

### 1.2 Browser Network Analysis
**Target:** Inspect actual network request from browser
- [ ] Open browser dev tools on production site
- [ ] Monitor Network tab during search
- [ ] Examine request URL, headers, and response
- [ ] Check for redirect or authentication issues

## Phase 2: Regression Analysis

### 2.1 Git History Investigation
**Target:** Identify when functionality broke
```bash
# Check recent commits affecting search functionality
git log --oneline --since="2 weeks ago" -- src/components/MusicSearchWidgetDynamic.astro
git log --oneline --since="2 weeks ago" -- src/components/spotify-combobox/
git log --oneline --since="2 weeks ago" -- src/pages/api/music-search.ts
```

### 2.2 Configuration Changes
**Target:** Find environment or build changes
- [ ] Check recent changes to astro.config.mjs
- [ ] Verify .env file changes
- [ ] Review Railway deployment configuration
- [ ] Check for package.json dependency updates

### 2.3 Deployment History
**Target:** Correlate with deployment timeline
- [ ] Check Railway deployment logs for recent builds
- [ ] Identify last known working deployment
- [ ] Compare build outputs between working and broken states

## Phase 3: URL Construction Analysis

### 3.1 Frontend URL Building
**Target:** Verify fetch URL in SpotifyCombobox.ts
```typescript
// Current implementation examination
const response = await fetch(
  `/api/music-search?q=${encodeURIComponent(query)}&maxResults=10`
);
```

**Investigation Points:**
- [ ] Relative vs absolute URL handling
- [ ] Base URL configuration in production
- [ ] Browser's resolution of relative paths

### 3.2 Production URL Behavior
**Target:** Test actual URLs being requested
- [ ] Add console logging to track exact fetch URLs
- [ ] Test URL construction in different environments
- [ ] Verify protocol (HTTP vs HTTPS) handling

## Phase 4: Environment Specific Issues

### 4.1 CORS Configuration
**Target:** Check for cross-origin issues
```bash
# Test CORS headers
curl -H "Origin: https://yait.social" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     "https://yait.social/api/music-search"
```

### 4.2 Content Security Policy
**Target:** Check for CSP blocking requests
- [ ] Examine CSP headers in production
- [ ] Verify fetch API is allowed
- [ ] Check for connect-src restrictions

### 4.3 Railway Specific Issues
**Target:** Identify platform-specific problems
- [ ] Check Railway service health status
- [ ] Verify internal networking configuration
- [ ] Test from Railway's internal network vs external

## Phase 5: Comprehensive Smoke Testing

### 5.1 API Endpoint Tests
**Target:** Systematic endpoint validation

```bash
#!/bin/bash
# comprehensive-api-test.sh

API_BASE="https://yait.social/api/music-search"
LOCAL_BASE="http://localhost:4321/api/music-search"

test_endpoint() {
  local base="$1"
  local name="$2"
  
  echo "Testing $name:"
  
  # Basic query
  echo "  Basic query:"
  curl -w "  Status: %{http_code}, Time: %{time_total}s\n" \
       -s "$base?q=queen&maxResults=1" -o /tmp/response.json
  
  # Check response format
  echo "  Response format:"
  if jq -e '.success' /tmp/response.json > /dev/null 2>&1; then
    echo "    ✅ Valid JSON with success field"
  else
    echo "    ❌ Invalid response format"
    head -c 100 /tmp/response.json
  fi
  
  # Headers check
  echo "  Headers:"
  curl -I -s "$base?q=test" | grep -E "(Content-Type|Access-Control|X-)"
  
  echo ""
}

test_endpoint "$API_BASE" "Production"
test_endpoint "$LOCAL_BASE" "Local"
```

### 5.2 Frontend Integration Tests
**Target:** Browser-based functionality tests

```javascript
// browser-console-test.js
async function testSpotifySearch() {
  console.log('Testing Spotify search...');
  
  try {
    const response = await fetch('/api/music-search?q=test&maxResults=1');
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      console.log('✅ API working correctly');
    } else {
      console.log('❌ API returned error:', data);
    }
  } catch (error) {
    console.log('❌ Network error:', error);
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
  }
}

// Test in browser console
testSpotifySearch();
```

### 5.3 Network Debugging Tools
**Target:** Deep network diagnostics

```bash
# network-debug.sh
echo "Network debugging for Spotify search..."

# DNS resolution
echo "1. DNS Resolution:"
nslookup yait.social

# Connectivity
echo "2. Basic connectivity:"
curl -I https://yait.social

# API specific
echo "3. API endpoint:"
curl -v "https://yait.social/api/music-search?q=test" 2>&1 | grep -E "(> |< |* )"

# SSL certificate
echo "4. SSL certificate:"
openssl s_client -connect yait.social:443 -servername yait.social </dev/null 2>/dev/null | grep -A5 "Certificate chain"
```

## Phase 6: Root Cause Resolution

### 6.1 Common Fixes
**Target:** Apply likely solutions based on investigation

**URL Construction Fix:**
```typescript
// If relative URLs are the issue
const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
const response = await fetch(`${baseUrl}/api/music-search?q=${query}`);
```

**CORS Headers Fix:**
```javascript
// In API endpoint
export async function GET({ request }: APIContext) {
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
  return response;
}
```

**Environment Configuration Fix:**
```javascript
// astro.config.mjs
export default defineConfig({
  // ... other config
  vite: {
    server: {
      proxy: process.env.NODE_ENV === 'production' ? {} : {
        '/api': 'http://localhost:4321'
      }
    }
  }
});
```

### 6.2 Validation Process
**Target:** Ensure fix works across environments
- [ ] Test fix in local development
- [ ] Deploy to staging/production
- [ ] Run comprehensive smoke tests
- [ ] Verify no regression in other functionality

## Phase 7: Prevention Measures

### 7.1 Monitoring Implementation
**Target:** Prevent future regressions
- [ ] Add network error logging to SpotifyCombobox
- [ ] Implement health check endpoint
- [ ] Set up automated API testing in CI/CD

### 7.2 Documentation Updates
**Target:** Document solution and debugging process
- [ ] Update troubleshooting guide
- [ ] Document network debugging procedures
- [ ] Add regression test cases

## Success Metrics

1. **API Accessibility**: 100% success rate for direct API testing
2. **Frontend Integration**: Search dropdown working in production
3. **Error Handling**: Clear error messages instead of silent failures
4. **Regression Prevention**: Automated tests catch similar issues
5. **Documentation**: Complete debugging guide for future issues

## Risk Mitigation

### Potential Issues:
1. **Cache Problems**: Browser/CDN caching old broken code
2. **Environment Differences**: Production vs development config drift
3. **Race Conditions**: Network timing issues in production
4. **Authentication**: Spotify API key issues in production

### Mitigation Strategies:
1. Clear browser cache and test in incognito mode
2. Environment configuration validation scripts
3. Request timeout and retry logic
4. API key validation in health checks