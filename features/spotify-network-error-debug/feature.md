# Feature: Spotify Network Error Debug

## Issue Description
The Spotify search combobox is not working - users are not getting search results dropdown and seeing NetworkError messages in the console when attempting to fetch from the API endpoint.

## Error Details
- **Console Error**: `Search failed: TypeError: NetworkError when attempting to fetch resource`
- **File**: `MusicSearchWidgetDynamic.astro_astro_type_script_index_0_lang.BVt614AZ.js:1:2066`
- **Symptoms**: No dropdown results appearing for search queries
- **Previous State**: Feature was working before (regression)

## Debugging Strategy

### 1. Regression Analysis
- Examine recent commits to identify when functionality broke
- Compare working vs non-working states
- Identify configuration changes that might affect network requests

### 2. Network Diagnostics
- Test API endpoint directly with CURL
- Verify production vs local environment differences  
- Check for CORS or authentication issues
- Validate endpoint URL construction

### 3. Frontend Analysis
- Examine fetch request construction in SpotifyCombobox.ts
- Verify relative vs absolute URL handling
- Check for environment-specific URL differences

## Success Criteria
1. Identify root cause of NetworkError
2. Restore working Spotify search functionality
3. Implement comprehensive smoke tests to prevent regression
4. Verify fix works in both local and production environments

## Technical Context
- Component: `MusicSearchWidgetDynamic.astro`
- Search Logic: `SpotifyCombobox.ts`
- API Endpoint: `/api/music-search`
- Environment: Production deployment on Railway