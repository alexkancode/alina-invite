# API Testing Guide

## Overview

This document provides comprehensive testing procedures for the application's API endpoints, with specific focus on the Spotify integration and music search functionality.

## Testing Commands

### Music Search API Tests

#### Basic Functionality
```bash
# Test basic music search
curl -s "http://localhost:4321/api/music-search?q=bohemian%20rhapsody&maxResults=2"

# Test with Spotify integration enabled
curl -s "http://localhost:4321/api/music-search?q=dancing%20queen&includeSpotify=true&maxResults=2"

# Test Spotify-primary strategy
curl -s "http://localhost:4321/api/music-search?q=hotel%20california&includeSpotify=true&spotifyPrimary=true&maxResults=2"
```

#### Error Handling Tests
```bash
# Test empty query error handling
curl -s "http://localhost:4321/api/music-search?q=&includeSpotify=true"

# Test malformed parameters
curl -s "http://localhost:4321/api/music-search?q=test&maxResults=abc"

# Test unknown song fallback
curl -s "http://localhost:4321/api/music-search?q=unknown%20song%20xyz&includeSpotify=true&includeFallback=true"
```

#### Backwards Compatibility Tests
```bash
# Test without Spotify integration
curl -s "http://localhost:4321/api/music-search?q=bohemian&includeSpotify=false&maxResults=2"

# Test legacy behavior
curl -s "http://localhost:4321/api/music-search?q=bohemian&includeFallback=true"
```

### Expected Response Formats

#### Successful Spotify Integration Response
```json
{
  "success": true,
  "songs": [{
    "id": "spotify-track-id",
    "title": "Song Title",
    "artist": "Artist Name",
    "year": 1975,
    "source": "spotify",
    "spotifyId": "4iV5W9uYEdYUVa79Axb7Rh",
    "spotifyUri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
    "spotifyUrl": "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
    "previewUrl": "https://p.scdn.co/mp3-preview/...",
    "youtubeSearchUrl": "https://www.youtube.com/results?search_query=..."
  }],
  "source": "spotify",
  "totalFound": 1,
  "sourcesUsed": ["spotify"],
  "searchStrategy": "spotify-primary"
}
```

#### Fallback Response Format
```json
{
  "success": true,
  "songs": [{
    "id": "cur-19",
    "title": "Song Title",
    "artist": "Artist Name",
    "year": 1975,
    "source": "curated",
    "youtubeSearchUrl": "https://www.youtube.com/results?search_query=..."
  }],
  "source": "fallback",
  "totalFound": 1,
  "sourcesUsed": ["curated"],
  "searchStrategy": "fallback-only"
}
```

#### Error Response Format
```json
{
  "error": "Search query is required"
}
```

## Validation Checklist

### Spotify Integration Health Check
- [ ] `spotifyId` fields present in responses when `includeSpotify=true`
- [ ] `sourcesUsed` includes "spotify" when integration working
- [ ] `searchStrategy` reflects requested strategy
- [ ] Fallback to YouTube maintained for backwards compatibility

### Performance Validation
- [ ] API responses under 2 seconds for normal queries
- [ ] Error responses under 500ms
- [ ] Proper timeout handling for external API calls

### Environment Variable Validation
```bash
# Check if Spotify credentials are loaded
node -e "console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Not set'); console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Not set');"
```

## Troubleshooting Common Issues

### Spotify Integration Not Working
**Symptoms**: No `spotifyId` fields, `sourcesUsed` only includes "musicbrainz" or "curated"

**Check**:
1. Environment variables loaded: Run env validation command above
2. Credentials valid: Verify Client ID/Secret in Spotify Dashboard
3. API rate limits: Check for 429 responses in logs

### API Returning Only Fallback Results
**Symptoms**: `"source": "fallback"`, `"sourcesUsed": ["curated"]`

**Check**:
1. Network connectivity to external APIs
2. MusicBrainz API rate limiting (1 req/sec)
3. Query format and special characters

### Empty Results
**Symptoms**: `"songs": []`, `"success": false`

**Check**:
1. Query too specific or misspelled
2. Year filter (70s songs only)
3. API timeout issues

## Automated Testing

Run the full test suite:
```bash
npm run test:api
```

Run specific integration tests:
```bash
npx vitest run tests/integration/spotify-preview-integration.test.ts
```

## Performance Testing

Monitor API response times:
```bash
# Time API responses
time curl -s "http://localhost:4321/api/music-search?q=bohemian&includeSpotify=true" > /dev/null
```

Load testing with multiple concurrent requests:
```bash
# Run 10 concurrent requests
for i in {1..10}; do
  curl -s "http://localhost:4321/api/music-search?q=test$i&includeSpotify=true" &
done
wait
```