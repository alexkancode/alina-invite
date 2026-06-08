# Dynamic Spotify Combobox - Production Smoke Tests

## API Endpoint Testing

### Happy Path Tests

#### Test 1: Basic Search Query
```bash
curl -s "https://yait.social/api/music-search?q=queen&maxResults=5"
```

**Expected Result**: JSON response with 5 Queen songs from the 70s including enhanced metadata

**Validation**:
```bash
curl -s "https://yait.social/api/music-search?q=queen&maxResults=5" | jq '.songs[0] | keys'
```

Should include: `["albumArtUrl", "artist", "explicit", "id", "source", "spotifyId", "title", "year", "youtubeSearchUrl"]`

#### Test 2: Specific Song Search
```bash
curl -s "https://yait.social/api/music-search?q=bohemian%20rhapsody&maxResults=1"
```

**Expected Result**: Bohemian Rhapsody by Queen with 1975 year and album artwork

#### Test 3: Artist Search
```bash
curl -s "https://yait.social/api/music-search?q=bee%20gees&maxResults=3"
```

**Expected Result**: Multiple Bee Gees songs from 1970s with Stayin' Alive likely included

#### Test 4: Album Search
```bash
curl -s "https://yait.social/api/music-search?q=night%20fever&maxResults=2"
```

**Expected Result**: Saturday Night Fever era songs with enhanced metadata

### Edge Case Tests

#### Test 5: Empty Query
```bash
curl -s "https://yait.social/api/music-search"
```

**Expected Result**: 400 error with "Search query is required" message

#### Test 6: Very Long Query
```bash
curl -s "https://yait.social/api/music-search?q=this%20is%20a%20very%20long%20search%20query%20that%20might%20not%20match%20anything&maxResults=1"
```

**Expected Result**: Success response with empty songs array if no matches

#### Test 7: Special Characters
```bash
curl -s "https://yait.social/api/music-search?q=don't%20stop%20me%20now&maxResults=1"
```

**Expected Result**: Queen's "Don't Stop Me Now" with proper character handling

#### Test 8: Numeric Query
```bash
curl -s "https://yait.social/api/music-search?q=1975&maxResults=3"
```

**Expected Result**: Songs from 1975 or with "1975" in title/artist

### Performance Tests

#### Test 9: Response Time Measurement
```bash
time curl -s "https://yait.social/api/music-search?q=dancing%20queen&maxResults=10" > /dev/null
```

**Expected Result**: Sub-500ms response time

#### Test 10: Large Result Set
```bash
curl -s "https://yait.social/api/music-search?q=rock&maxResults=10"
```

**Expected Result**: 10 rock songs from 70s with full metadata, good performance

### Unhappy Path Tests

#### Test 11: Invalid maxResults
```bash
curl -s "https://yait.social/api/music-search?q=queen&maxResults=invalid"
```

**Expected Result**: Should handle gracefully, likely defaulting to reasonable number

#### Test 12: Extremely Large maxResults
```bash
curl -s "https://yait.social/api/music-search?q=queen&maxResults=1000"
```

**Expected Result**: Should cap results at reasonable limit (likely 15-20)

#### Test 13: SQL Injection Attempt
```bash
curl -s "https://yait.social/api/music-search?q='; DROP TABLE--&maxResults=1"
```

**Expected Result**: Treated as literal search query, no database impact

#### Test 14: XSS Attempt
```bash
curl -s "https://yait.social/api/music-search?q=<script>alert('test')</script>&maxResults=1"
```

**Expected Result**: Properly escaped in response, no script execution

## UI Integration Testing

### Test 15: Full DOM Structure Check
```bash
curl -s "https://yait.social" | grep -A20 -B5 "music.*search\|groovy.*tune\|favoriteSong"
```

**Expected Result**: Should show dynamic combobox structure, not static dropdown

### Test 16: JavaScript Integration Check
```bash
curl -s "https://yait.social" | grep -o "SpotifyCombobox\|spotify-combobox\|music-search"
```

**Expected Result**: References to dynamic combobox JavaScript

### Test 17: Progressive Enhancement Check
```bash
curl -s "https://yait.social" | grep -c "select.*name.*favoriteSong\|spotify-search"
```

**Expected Result**: Should find both fallback select and enhanced search input

## Metadata Validation Tests

#### Test 18: Album Art URLs
```bash
curl -s "https://yait.social/api/music-search?q=dancing%20queen&maxResults=1" | jq '.songs[0].albumArtUrl'
```

**Expected Result**: Valid Spotify CDN URL (i.scdn.co domain)

#### Test 19: Spotify URLs
```bash
curl -s "https://yait.social/api/music-search?q=bohemian%20rhapsody&maxResults=1" | jq '.songs[0] | {spotifyId, spotifyUrl: ("https://open.spotify.com/track/" + .spotifyId)}'
```

**Expected Result**: Valid Spotify track ID and constructible URL

#### Test 20: Year Filtering
```bash
curl -s "https://yait.social/api/music-search?q=queen&maxResults=10" | jq '.songs[].year' | sort | uniq
```

**Expected Result**: All years should be between 1970-1979

## Comprehensive Test Script

Create a comprehensive test runner:

```bash
#!/bin/bash
# Dynamic Spotify Combobox Smoke Tests

API_BASE="https://yait.social/api/music-search"
PASS=0
FAIL=0

test_api() {
  local name="$1"
  local query="$2"
  local expected_pattern="$3"
  
  echo "Testing: $name"
  result=$(curl -s "$API_BASE?q=$query&maxResults=3")
  
  if echo "$result" | grep -q "$expected_pattern"; then
    echo "  ✅ PASS"
    ((PASS++))
  else
    echo "  ❌ FAIL: $result"
    ((FAIL++))
  fi
}

# Run tests
test_api "Basic Queen Search" "queen" "Dancing Queen\\|Don't Stop Me Now"
test_api "ABBA Search" "abba" "Dancing Queen"
test_api "Bee Gees Search" "bee%20gees" "Stayin.*Alive"
test_api "Empty Results" "xyznonexistent123" '"songs":\[\]'
test_api "Special Characters" "don't%20stop" "Don't Stop Me Now"

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

## Visual UI Testing

Since this is a UI component, visual testing is crucial:

### Test 21: Screenshot Production UI
```bash
# Take screenshot of production site
gnome-screenshot -f ~/production-ui-before.png

# Navigate to production site and test combobox interaction
firefox https://yait.social
```

### Test 22: Form Integration Check
Verify the hidden input field gets populated correctly when a song is selected.

### Test 23: Keyboard Navigation
Test arrow keys, enter, escape functionality with actual browser.

### Test 24: Mobile Responsiveness  
Test on mobile viewport to ensure touch interactions work properly.

## Success Criteria

**API Tests**: All endpoints return valid JSON with required fields
**Performance**: Response times under 500ms for typical queries
**Security**: No injection vulnerabilities, proper escaping
**UI Integration**: Dynamic combobox replaces static dropdown
**Accessibility**: ARIA attributes present and functional
**Progressive Enhancement**: Fallback works without JavaScript

Run these tests after deployment to validate the dynamic Spotify combobox implementation.