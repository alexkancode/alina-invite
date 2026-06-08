# Dynamic Music Search Testing Guide

## Test Environment
- **Local Server**: http://localhost:4321  
- **API Endpoint**: http://localhost:4321/api/music-search
- **Component**: MusicSearchWidget.astro (updated)

## API Smoke Tests

### Happy Path Tests
```bash
# Test 1: Basic Spotify search functionality
curl "http://localhost:4321/api/music-search?q=dancing%20queen&maxResults=1"

# Expected: JSON response with enhanced metadata
# Should include: albumArtUrl, spotifyId, explicit flag

# Test 2: Search with multiple results
curl "http://localhost:4321/api/music-search?q=queen&maxResults=3"

# Expected: Multiple Spotify results with 70s filtering
```

### Error Handling Tests
```bash
# Test 3: Empty query
curl "http://localhost:4321/api/music-search"

# Expected: 400 error with "Search query is required"

# Test 4: Feature flag check
node scripts/feature-flags.js list | grep musicSearch

# Expected: musicSearch: enabled
```

## UI Integration Tests

### Browser Testing Steps

1. **Open Application**
   ```
   Navigate to: http://localhost:4321
   ```

2. **Locate Music Selection**
   - Look for "select a groovy tune" text or similar music selection area
   - Should show a search input, NOT a static dropdown

3. **Test Dynamic Search**
   - Click on the music selection area
   - Verify a search input appears (not dropdown with 4 static options)
   - Type "queen" and wait for results
   - Should see real-time search results with album art

4. **Verify Enhanced Metadata**
   - Search results should show:
     - Album artwork (if available)
     - Song title and artist
     - Year (1970s only)
     - Spotify source indicator
     - Explicit content flag (if applicable)

5. **Test Song Selection**
   - Click on a search result
   - Should show Spotify preview options
   - Verify "Open with Spotify" button appears
   - Check form data is properly populated

### Expected Behavior Changes

#### Before Fix (Broken State)
- Clicking "select a groovy tune" → Static dropdown with 4 hardcoded options
- No search functionality
- Limited song choices
- No enhanced metadata

#### After Fix (Working State)  
- Clicking music selection → Dynamic search input appears
- Real-time search results from Spotify API
- Enhanced metadata with album art
- Spotify deep-linking integration
- Fallback to static dropdown if JavaScript disabled

### Test Scenarios

#### Scenario 1: Normal Search Flow
```
1. User clicks music selection
2. Search input appears
3. User types "dancing queen"
4. Results appear with album art
5. User clicks result
6. Spotify preview options appear
7. Form data updated correctly
```

#### Scenario 2: Empty Results
```
1. User searches for "xyzqwerty12345nonexistent"
2. "No songs found" message appears
3. Custom song option offered
4. Graceful handling without crashes
```

#### Scenario 3: API Error
```
1. Simulate API failure (disconnect network)
2. Search shows "temporarily unavailable" message
3. No JavaScript errors in console
4. Graceful degradation
```

#### Scenario 4: Progressive Enhancement
```
1. Disable JavaScript in browser
2. Page loads with static dropdown fallback
3. 4 hardcoded options available
4. Form submission still works
```

## Performance Validation

### Response Time Tests
```bash
# Test API response times
time curl -s "http://localhost:4321/api/music-search?q=test" > /dev/null

# Expected: Sub-500ms response time
```

### Search Debouncing
- Type quickly in search box
- Verify API calls are debounced (not sent for every keystroke)
- Only triggers after 300ms of inactivity

### Memory Usage
- Open browser dev tools
- Perform multiple searches
- Verify no memory leaks from repeated API calls

## Error Scenarios to Test

1. **Network Connectivity**
   - Disconnect internet → Graceful error message

2. **Feature Flag Disabled**
   - Disable musicSearch flag → Static fallback appears

3. **API Endpoint Issues**
   - Invalid response format → Error handling active

4. **Browser Compatibility**
   - Test in different browsers
   - Verify progressive enhancement works

## Success Criteria

### ✓ Functional Requirements
- [ ] Dynamic search replaces static dropdown
- [ ] Real-time Spotify search results  
- [ ] Enhanced metadata display (album art, etc.)
- [ ] Spotify deep-linking integration
- [ ] Graceful error handling
- [ ] Progressive enhancement fallback

### ✓ Performance Requirements
- [ ] Sub-500ms API response times
- [ ] Debounced search input (300ms)
- [ ] No memory leaks from repeated searches
- [ ] Responsive UI on mobile and desktop

### ✓ User Experience Requirements  
- [ ] Intuitive search interface
- [ ] Clear loading states
- [ ] Helpful error messages
- [ ] Accessible keyboard navigation
- [ ] Visual feedback for actions

## Debugging Commands

### Check Server Logs
```bash
tail -f /tmp/server-test.log
```

### Verify Feature Flag Status
```bash
node scripts/feature-flags.js status musicSearch
```

### Test API Directly
```bash
# Comprehensive API test
curl -v "http://localhost:4321/api/music-search?q=bohemian%20rhapsody" | jq .
```

### Browser Console Commands
```javascript
// Test search widget initialization
document.querySelector('.music-search-widget')

// Check for JavaScript errors
console.error

// Test API call manually
fetch('/api/music-search?q=test').then(r => r.json()).then(console.log)
```

---

**Next Steps After Testing:**
1. Verify all test scenarios pass
2. Test in production environment
3. Monitor for user experience improvements
4. Validate enhanced metadata displays correctly