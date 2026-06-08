# Spotify-Only Music Search API Tests

Comprehensive CURL smoke tests for the simplified spotify-only music search implementation.

## Quick Test Commands

### Happy Path Tests

**Basic Spotify Search**
```bash
curl -s "http://localhost:4321/api/music-search?q=bohemian%20rhapsody" | python3 -m json.tool
```

**Search with Results Limit**
```bash
curl -s "http://localhost:4321/api/music-search?q=queen&maxResults=3" | python3 -m json.tool
```

**70s Music Discovery**
```bash
curl -s "http://localhost:4321/api/music-search?q=dancing%20queen" | python3 -m json.tool
```

**Legacy Parameter Compatibility**
```bash
curl -s "http://localhost:4321/api/music-search?q=beatles&includeSpotify=false&spotifyPrimary=true&includeFallback=true" | python3 -m json.tool
```

### Error Handling Tests

**Missing Query Parameter**
```bash
curl -s "http://localhost:4321/api/music-search" | python3 -m json.tool
```

**Empty Query**
```bash
curl -s "http://localhost:4321/api/music-search?q=" | python3 -m json.tool
```

**Whitespace Query**
```bash
curl -s "http://localhost:4321/api/music-search?q=%20%20%20" | python3 -m json.tool
```

### Edge Cases

**Non-existent Song**
```bash
curl -s "http://localhost:4321/api/music-search?q=xyzqwerty12345nonexistent" | python3 -m json.tool
```

**Special Characters**
```bash
curl -s "http://localhost:4321/api/music-search?q=rock%20%26%20roll" | python3 -m json.tool
```

**Unicode Characters**
```bash
curl -s "http://localhost:4321/api/music-search?q=café%20music" | python3 -m json.tool
```

**Large Result Set**
```bash
curl -s "http://localhost:4321/api/music-search?q=love&maxResults=20" | python3 -m json.tool
```

**Minimum Result Set**
```bash
curl -s "http://localhost:4321/api/music-search?q=queen&maxResults=1" | python3 -m json.tool
```

## Response Validation Commands

### Check Required Fields
```bash
# Verify success response structure
curl -s "http://localhost:4321/api/music-search?q=test" | grep -E '"success":|"songs":|"source":|"totalFound":'

# Verify error response structure  
curl -s "http://localhost:4321/api/music-search" | grep -E '"error":'
```

### Validate Enhanced Metadata
```bash
# Check for Spotify-specific fields
curl -s "http://localhost:4321/api/music-search?q=bohemian%20rhapsody" | grep -E '"spotifyId":|"albumArtUrl":|"previewUrl":'

# Verify 70s decade filtering
curl -s "http://localhost:4321/api/music-search?q=queen" | grep -o '"year":[0-9]*'
```

### Performance Testing
```bash
# Response time measurement
time curl -s "http://localhost:4321/api/music-search?q=test" > /dev/null

# Multiple concurrent requests
for i in {1..5}; do
  curl -s "http://localhost:4321/api/music-search?q=test$i" > /dev/null &
done
wait
```

## Expected Response Formats

### Successful Search Response
```json
{
  "success": true,
  "songs": [
    {
      "id": "spotify-track-id",
      "title": "Song Title",
      "artist": "Artist Name", 
      "year": 1975,
      "source": "spotify",
      "spotifyId": "spotify-track-id",
      "albumArtUrl": "https://i.scdn.co/image/...",
      "explicit": false,
      "youtubeSearchUrl": "https://www.youtube.com/results?search_query=..."
    }
  ],
  "source": "spotify",
  "totalFound": 1,
  "cached": false
}
```

### Empty Results Response
```json
{
  "success": true,
  "songs": [],
  "source": "spotify", 
  "totalFound": 0,
  "cached": false
}
```

### Error Response
```json
{
  "error": "Search query is required"
}
```

### API Error Response
```json
{
  "success": false,
  "songs": [],
  "source": "error",
  "totalFound": 0,
  "error": "Music search temporarily unavailable",
  "cached": false
}
```

## Feature Flag Tests

### Check Feature Flag Status
```bash
# Verify music search is enabled
node scripts/feature-flags.js list | grep musicSearch
```

### Test Feature Flag Protection
```bash
# Disable feature flag and test 403 response
node scripts/feature-flags.js disable musicSearch
curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:4321/api/music-search?q=test"

# Re-enable feature flag
node scripts/feature-flags.js enable musicSearch
```

## Automated Test Suite

Run all tests with validation:

```bash
#!/bin/bash

echo "=== Spotify-Only API Smoke Tests ==="
BASE_URL="http://localhost:4321/api/music-search"

# Test 1: Basic functionality
echo "Test 1: Basic Spotify search"
response=$(curl -s "$BASE_URL?q=bohemian%20rhapsody")
echo "$response" | grep -q '"success":true' && echo "✓ PASS" || echo "✗ FAIL"

# Test 2: Enhanced metadata
echo "Test 2: Enhanced metadata present"
echo "$response" | grep -q '"spotifyId":' && echo "✓ PASS" || echo "✗ FAIL"

# Test 3: 70s filtering
echo "Test 3: 70s decade filtering"
year=$(echo "$response" | grep -o '"year":[0-9]*' | head -1 | cut -d: -f2)
if [ "$year" -ge 1970 ] && [ "$year" -le 1979 ]; then
    echo "✓ PASS (Year: $year)"
else
    echo "✗ FAIL (Year: $year)"
fi

# Test 4: Error handling
echo "Test 4: Error handling"
error_response=$(curl -s "$BASE_URL")
echo "$error_response" | grep -q '"error":' && echo "✓ PASS" || echo "✗ FAIL"

# Test 5: Performance
echo "Test 5: Performance check"
start_time=$(date +%s%N)
curl -s "$BASE_URL?q=test" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))
echo "Response time: ${response_time}ms"
[ $response_time -lt 1000 ] && echo "✓ PASS" || echo "⚠ SLOW"

echo "=== Tests Complete ==="
```

## Common Issues & Debugging

### If Tests Fail

1. **Server not running**: Start with `npm run dev`
2. **Feature flag disabled**: Enable with `node scripts/feature-flags.js enable musicSearch`
3. **Spotify credentials**: Check `.env` file has `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
4. **Network issues**: Verify internet connection for Spotify API

### Debug Commands
```bash
# Check server status
curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321/"

# Check feature flag
node scripts/feature-flags.js status musicSearch

# Check Spotify credentials
grep SPOTIFY .env

# View server logs
# (Check terminal running npm run dev)
```

## Integration with CI/CD

These tests can be integrated into automated workflows:

```yaml
# Example GitHub Action step
- name: API Smoke Tests
  run: |
    npm run dev &
    sleep 10
    bash SPOTIFY_API_TESTS.md # Extract and run test commands
```

---

**Note**: Tests assume local development server running on `localhost:4321`. Update `BASE_URL` for other environments.