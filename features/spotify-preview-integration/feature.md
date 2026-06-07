# Spotify Preview Integration Feature

## Overview
Replace the existing "Preview on YouTube" button functionality with "Open with Spotify" integration that uses Spotify deep-linking and Web Playback SDK for seamless music playback across devices.

## Current State Analysis
- **YouTube Integration**: Music search results include `youtubeSearchUrl` for YouTube search links
- **Preview Button**: MusicSearchWidget shows "🎵 Preview on YouTube" button linking to YouTube search
- **Spotify Infrastructure**: SpotifyClient already exists with track search capabilities
- **API Endpoint**: `/api/music-search` returns song data with YouTube URLs

## User Requirements

### Primary User Journey
1. User searches for a song using the music search widget
2. Search results display songs with enhanced metadata
3. User selects a song 
4. **NEW**: "🎵 Open with Spotify" button appears instead of YouTube preview
5. Clicking opens the song directly in Spotify app (if installed) or Spotify web player

### Cross-Platform Behavior
- **Mobile**: Attempt Spotify app deep-link first, fallback to web player
- **Desktop**: Primary web player, option to try desktop app
- **No Spotify Account**: Graceful fallback to preview snippet or search

## Technical Requirements

### Deep-Linking Pattern
```javascript
// Primary: Spotify URI for app deep-linking
spotify:track:{spotifyId}

// Fallback: Spotify web player URL
https://open.spotify.com/track/{spotifyId}
```

### Enhanced API Response
Extend music search API response to include Spotify metadata:
```json
{
  "id": "song-id",
  "title": "Song Title",
  "artist": "Artist Name",
  "spotifyId": "4iV5W9uYEdYUVa79Axb7Rh",
  "spotifyUri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
  "spotifyUrl": "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
  "previewUrl": "https://p.scdn.co/mp3-preview/...",
  "source": "spotify"
}
```

### Fallback Strategy
1. **Primary**: Spotify app deep-link (mobile) or web player (desktop)
2. **Secondary**: Spotify web preview (30-second snippet)
3. **Tertiary**: YouTube search link (current behavior)

## User Experience Principles

### Progressive Enhancement
- Spotify integration enhances existing functionality
- YouTube fallback maintains backward compatibility
- Works without JavaScript (falls back to basic links)

### Cross-Device Consistency
- Mobile-first approach for app detection
- Desktop optimization for web player
- Unified visual design across platforms

### Performance Requirements
- Deep-link attempt: 500ms timeout
- Spotify API calls: < 2 seconds response time
- Graceful degradation on API failures

## Success Criteria

### Functional Requirements
- ✅ Spotify deep-links work on mobile devices with Spotify app installed
- ✅ Web player integration works on all desktop browsers
- ✅ Fallback to YouTube maintains existing functionality
- ✅ No JavaScript errors on unsupported browsers

### User Experience Goals
- 90%+ successful Spotify integration rate
- Sub-1-second response time for preview actions
- Clear visual feedback during loading states
- Accessible interaction patterns

## Implementation Phases

### Phase 1: Core Integration
- Extend music search service with Spotify track matching
- Update API endpoint to return Spotify metadata
- Implement Spotify deep-linking service

### Phase 2: UI Enhancement
- Replace YouTube preview button with Spotify integration
- Add loading states and error handling
- Implement cross-platform detection

### Phase 3: Advanced Features
- Web Playbook SDK integration for embedded preview
- Enhanced metadata display (album art, popularity)
- User preference storage for preview method

## Technical Constraints

### Spotify API Limitations
- Rate limiting: 2000 requests per hour per client
- Search results limited to 50 tracks per request
- Preview URLs may not be available for all tracks

### Browser Security
- Deep-linking requires user gesture (click) to function
- HTTPS required for Web Playback SDK
- Cross-origin restrictions on iframe embeds

### Device Compatibility
- iOS: Spotify app detection unreliable
- Android: Deep-linking works reliably
- Desktop: Web player preferred for consistency

## Risk Mitigation

### API Dependencies
- **Risk**: Spotify API downtime or rate limiting
- **Mitigation**: Robust fallback to YouTube search
- **Monitoring**: API health checks and error tracking

### User Experience
- **Risk**: App detection false positives/negatives  
- **Mitigation**: Timeout-based fallback strategy
- **Testing**: Cross-device testing on multiple browsers

### Technical Debt
- **Risk**: Increased complexity in music search flow
- **Mitigation**: Clean separation of concerns, comprehensive tests
- **Documentation**: Clear API contracts and fallback behavior

## Quality Assurance

### Testing Strategy
- **Unit Tests**: Spotify integration service methods
- **Integration Tests**: End-to-end music search to preview flow
- **Contract Tests**: API response validation
- **Manual Tests**: Cross-device preview functionality

### Monitoring & Analytics
- Preview button click rates (Spotify vs YouTube)
- Deep-link success rates by platform
- API response times and error rates
- User engagement with music preview features