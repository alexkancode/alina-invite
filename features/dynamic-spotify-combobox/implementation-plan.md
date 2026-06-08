# Dynamic Spotify Combobox - Implementation Plan

## Overview

Build a high-performance, accessible Spotify search combobox that replaces the static dropdown with real-time music discovery. The component will be positioned outside the RSVP modal, featuring rich result display with album art, interactive controls, and comprehensive keyboard navigation.

## Implementation Strategy

### Phase 1: Component Architecture and Foundation

#### 1.1 Core Component Structure
**File**: `src/components/MusicSearchWidget.astro` (Replace existing)
**Objective**: Enhance existing component with dynamic Spotify search functionality

**Component Interface**:
```typescript
interface SpotifyComboboxProps {
  name: string;
  defaultValue?: SpotifyTrack | null;
  onSelectionChange?: (track: SpotifyTrack | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  year: number;
  albumArtUrl?: string;
  previewUrl?: string;
  spotifyUrl: string;
  spotifyId: string;
}
```

**Component Structure**:
```typescript
class SpotifyCombobox {
  private searchInput: HTMLInputElement;
  private resultsList: HTMLUListElement;
  private hiddenInput: HTMLInputElement;
  private debounceTimer: number | null = null;
  private cache: Map<string, SpotifyTrack[]> = new Map();
  private selectedTrack: SpotifyTrack | null = null;
  private highlightedIndex: number = -1;
  
  constructor(container: HTMLElement) {
    this.initializeElements();
    this.bindEvents();
    this.setupAccessibility();
  }
}
```

#### 1.2 HTML Structure with ARIA Pattern
**Template Structure**:
```astro
<div class="spotify-combobox-container" data-testid="spotify-combobox">
  <label for="spotify-search" class="sr-only">Search for your favorite 70s song</label>
  
  <div class="relative">
    <input
      type="text"
      id="spotify-search"
      role="combobox"
      aria-controls="spotify-results"
      aria-expanded="false"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      placeholder="Search for songs, artists, albums..."
      class="spotify-search-input"
    />
    
    <div 
      id="spotify-results" 
      role="listbox"
      aria-label="Search results"
      class="spotify-results-dropdown hidden"
    >
      <!-- Results populated via JavaScript -->
    </div>
  </div>
  
  <input type="hidden" name={name} id={`${name}-value`} />
</div>
```

#### 1.3 CSS Architecture with Existing Patterns
**Strategy**: Reuse existing MusicSearchWidget styling patterns and color scheme
**Colors**: warm-cream text, metallic-silver placeholders, phi-spacing, existing border styles

**Enhanced Styles** (Building on existing patterns):
```css
.spotify-search-input {
  /* Reuse existing input styling pattern from MusicSearchWidget */
  @apply w-full px-phi-md py-phi-sm rounded-lg text-phi-base text-warm-cream 
         placeholder-metallic-silver/50 focus:outline-none transition-colors;
  background: rgba(255,255,255,0.06);
  border: 2px solid hsl(270, 30%, 40%);
}

.spotify-results-dropdown {
  @apply absolute top-full left-0 right-0 z-50 mt-1 bg-white/95 
         backdrop-blur-sm border border-purple-200 rounded-lg shadow-lg 
         max-h-80 overflow-y-auto;
}

.spotify-result-item {
  @apply flex items-center gap-3 p-3 cursor-pointer hover:bg-purple-50 
         focus:bg-purple-50 focus:outline-none;
}

.spotify-result-highlighted {
  @apply bg-purple-100 ring-2 ring-pink-300;
}
```

### Phase 2: Search Logic and API Integration

#### 2.1 Debounced Search Implementation
**File**: `src/lib/spotify-search-client.ts`
**Objective**: Efficient search with race condition handling

**Debouncer Class**:
```typescript
class SearchDebouncer {
  private timer: number | null = null;
  private currentRequestId: number = 0;
  
  debounce<T>(
    fn: (...args: any[]) => Promise<T>, 
    delay: number
  ): (...args: any[]) => Promise<T> {
    return (...args) => {
      return new Promise((resolve, reject) => {
        if (this.timer) {
          clearTimeout(this.timer);
        }
        
        const requestId = ++this.currentRequestId;
        
        this.timer = window.setTimeout(async () => {
          try {
            const result = await fn(...args);
            
            if (requestId === this.currentRequestId) {
              resolve(result);
            }
          } catch (error) {
            if (requestId === this.currentRequestId) {
              reject(error);
            }
          }
        }, delay);
      });
    };
  }
}
```

#### 2.2 API Client Integration
**Enhanced API Integration** (Reuse existing SpotifyMusicService):
```typescript
class SpotifySearchClient {
  private spotifyService: SpotifyMusicService;
  private debouncer = new SearchDebouncer();
  private readonly DEBOUNCE_DELAY = 200; // 200ms
  
  constructor() {
    this.debouncedSearch = this.debouncer.debounce(
      this.performSearch.bind(this), 
      this.DEBOUNCE_DELAY
    );
  }
  
  async search(query: string): Promise<SpotifyTrack[]> {
    if (!this.isValidQuery(query)) {
      return [];
    }
    
    const cacheKey = this.generateCacheKey(query);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached.tracks;
    }
    
    return this.debouncedSearch(query, cacheKey);
  }
  
  private async performSearch(query: string, cacheKey: string): Promise<SpotifyTrack[]> {
    try {
      const response = await fetch(
        `/api/music-search?q=${encodeURIComponent(query)}&maxResults=10`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.songs) {
        const tracks = this.transformToSpotifyTracks(data.songs);
        this.setCache(cacheKey, tracks);
        return tracks;
      }
      
      return [];
    } catch (error) {
      console.warn('Spotify search failed:', error);
      return [];
    }
  }
}
```

#### 2.3 Cache Management
**Cache Interface**:
```typescript
interface CachedResult {
  tracks: SpotifyTrack[];
  timestamp: number;
  query: string;
}

class CacheManager {
  private cache: Map<string, CachedResult> = new Map();
  private readonly TTL = 5 * 60 * 1000;
  
  set(key: string, tracks: SpotifyTrack[], query: string): void {
    this.cache.set(key, {
      tracks,
      timestamp: Date.now(),
      query
    });
    
    this.cleanupExpired();
  }
  
  get(key: string): SpotifyTrack[] | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.tracks;
  }
  
  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Phase 3: Result Display and Interaction

#### 3.1 Result Item Component
**Result Item Structure**:
```typescript
class SpotifyResultItem {
  private element: HTMLLIElement;
  private track: SpotifyTrack;
  private onSelect: (track: SpotifyTrack) => void;
  private onPlay: (track: SpotifyTrack) => void;
  
  constructor(track: SpotifyTrack, callbacks: ResultItemCallbacks) {
    this.track = track;
    this.onSelect = callbacks.onSelect;
    this.onPlay = callbacks.onPlay;
    this.element = this.createElement();
    this.bindEvents();
  }
  
  private createElement(): HTMLLIElement {
    const li = document.createElement('li');
    li.role = 'option';
    li.id = `spotify-option-${this.track.id}`;
    li.className = 'spotify-result-item';
    li.setAttribute('data-track-id', this.track.id);
    
    li.innerHTML = `
      <div class="spotify-result-content">
        ${this.track.albumArtUrl ? `
          <img 
            src="${this.track.albumArtUrl}" 
            alt="Album cover for ${this.track.title}"
            class="spotify-album-art"
            loading="lazy"
          />
        ` : `
          <div class="spotify-album-placeholder">🎵</div>
        `}
        
        <div class="spotify-track-info">
          <div class="spotify-track-title-artist">
            <span class="spotify-track-title">${this.escapeHtml(this.track.title)}</span>
            <span class="spotify-track-separator"> - </span>
            <span class="spotify-track-artist">${this.escapeHtml(this.track.artist)}</span>
          </div>
          <div class="spotify-track-year">${this.track.year}</div>
        </div>
        
        <div class="spotify-track-actions">
          ${this.track.previewUrl ? `
            <button 
              type="button"
              class="spotify-play-button"
              title="Play preview"
              aria-label="Play preview of ${this.track.title}"
            >
              ▶
            </button>
          ` : ''}
          
          <button 
            type="button"
            class="spotify-open-button"
            title="Open in Spotify"
            aria-label="Open ${this.track.title} in Spotify"
          >
            🎧
          </button>
        </div>
      </div>
    `;
    
    return li;
  }
}
```

#### 3.2 Audio Preview Integration
**Audio Manager**:
```typescript
class AudioPreviewManager {
  private currentAudio: HTMLAudioElement | null = null;
  private playButton: HTMLButtonElement | null = null;
  
  async playPreview(previewUrl: string, button: HTMLButtonElement): Promise<void> {
    try {
      this.stopCurrentPreview();
      
      this.currentAudio = new Audio(previewUrl);
      this.playButton = button;
      
      button.textContent = '⏸';
      button.disabled = true;
      
      this.currentAudio.addEventListener('ended', () => this.handlePreviewEnd());
      this.currentAudio.addEventListener('error', () => this.handlePreviewError());
      
      await this.currentAudio.play();
      button.disabled = false;
      
    } catch (error) {
      this.handlePreviewError();
      throw new Error('Preview playback failed');
    }
  }
  
  stopCurrentPreview(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    if (this.playButton) {
      this.playButton.textContent = '▶';
      this.playButton.disabled = false;
      this.playButton = null;
    }
  }
}
```

#### 3.3 Spotify Deep-Linking
**Deep Link Handler**:
```typescript
class SpotifyDeepLinkHandler {
  openInSpotify(track: SpotifyTrack): void {
    const spotifyUrl = `spotify:track:${track.spotifyId}`;
    const webUrl = `https://open.spotify.com/track/${track.spotifyId}`;
    
    if (this.isSpotifyAppAvailable()) {
      window.location.href = spotifyUrl;
      
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 1000);
    } else {
      window.open(webUrl, '_blank');
    }
  }
  
  private isSpotifyAppAvailable(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
}
```

### Phase 4: Accessibility and Keyboard Navigation

#### 4.1 Keyboard Event Handler
**Navigation Controller**:
```typescript
class KeyboardNavigationController {
  private combobox: SpotifyCombobox;
  private highlightedIndex: number = -1;
  
  constructor(combobox: SpotifyCombobox) {
    this.combobox = combobox;
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateNext();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.navigatePrevious();
        break;
        
      case 'Enter':
        event.preventDefault();
        this.selectHighlighted();
        break;
        
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
        
      case 'Home':
        event.preventDefault();
        this.navigateFirst();
        break;
        
      case 'End':
        event.preventDefault();
        this.navigateLast();
        break;
    }
  }
  
  private navigateNext(): void {
    const results = this.combobox.getVisibleResults();
    
    if (results.length === 0) return;
    
    this.highlightedIndex = this.highlightedIndex < results.length - 1 
      ? this.highlightedIndex + 1 
      : 0;
      
    this.updateHighlight();
    this.scrollIntoView();
  }
}
```

#### 4.2 ARIA State Management
**ARIA Controller**:
```typescript
class AriaStateManager {
  private input: HTMLInputElement;
  private listbox: HTMLUListElement;
  
  constructor(input: HTMLInputElement, listbox: HTMLUListElement) {
    this.input = input;
    this.listbox = listbox;
  }
  
  setExpanded(expanded: boolean): void {
    this.input.setAttribute('aria-expanded', expanded.toString());
    
    if (expanded) {
      this.listbox.classList.remove('hidden');
    } else {
      this.listbox.classList.add('hidden');
      this.clearActiveDescendant();
    }
  }
  
  setActiveDescendant(optionId: string | null): void {
    if (optionId) {
      this.input.setAttribute('aria-activedescendant', optionId);
    } else {
      this.input.removeAttribute('aria-activedescendant');
    }
  }
  
  announceResultCount(count: number): void {
    const announcement = count === 0 
      ? 'No results found' 
      : `${count} result${count === 1 ? '' : 's'} available`;
      
    this.createAriaLiveAnnouncement(announcement);
  }
}
```

### Phase 5: Integration and Progressive Enhancement

#### 5.1 Form Integration
**Form Value Handler**:
```typescript
class FormIntegration {
  private hiddenInput: HTMLInputElement;
  private displayInput: HTMLInputElement;
  
  updateSelection(track: SpotifyTrack | null): void {
    if (track) {
      this.hiddenInput.value = JSON.stringify({
        id: track.id,
        title: track.title,
        artist: track.artist,
        year: track.year,
        spotifyId: track.spotifyId
      });
      
      this.displayInput.value = `${track.title} - ${track.artist}`;
    } else {
      this.hiddenInput.value = '';
      this.displayInput.value = '';
    }
    
    this.dispatchChangeEvent();
  }
  
  private dispatchChangeEvent(): void {
    this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

#### 5.2 Progressive Enhancement
**Component Initialization**:
```typescript
class SpotifyComboboxInitializer {
  static initialize(container: HTMLElement): SpotifyCombobox | null {
    if (!this.isJavaScriptCapable()) {
      return null; // Fallback to static select
    }
    
    if (!this.isFeatureEnabled()) {
      return null; // Feature flag disabled
    }
    
    try {
      return new SpotifyCombobox(container);
    } catch (error) {
      console.warn('Failed to initialize Spotify combobox:', error);
      return null; // Graceful degradation
    }
  }
  
  private static isFeatureEnabled(): boolean {
    return window.FEATURE_FLAGS?.musicSearch === true;
  }
}
```

## Implementation Quality Standards

### Code Quality Checklist
- [ ] No utility functions in wrong files (all in appropriate modules)
- [ ] No inline styles (using Tailwind utility classes)
- [ ] No duplicated utility functions (reuse existing debouncer patterns)
- [ ] No duplicated style rules (consistent Tailwind usage)
- [ ] Everything implemented with testable interfaces
- [ ] Single-purpose functions with clear responsibilities
- [ ] No comments added to code
- [ ] Full unit and integration test coverage

### File Structure
```
src/components/
├── MusicSearchWidget.astro               # Enhanced existing component
├── spotify-combobox/
│   ├── SpotifyCombobox.ts               # Core component logic
│   ├── KeyboardNavigationController.ts  # Keyboard handling
│   ├── AriaStateManager.ts              # Accessibility
│   ├── AudioPreviewManager.ts           # Audio playback
│   └── types.ts                         # TypeScript interfaces

src/lib/
├── spotifyMusicService.ts               # Existing - reuse caching
```

### Testing Strategy
```
tests/unit/spotify-combobox/
├── SpotifyCombobox.test.ts              # Component behavior
├── SpotifySearchClient.test.ts          # API integration
├── KeyboardNavigation.test.ts           # Keyboard handling
├── AudioPreview.test.ts                 # Audio functionality
└── FormIntegration.test.ts              # Form value updates

tests/integration/
├── spotify-combobox-integration.test.ts # Full component integration
└── accessibility.test.ts                # Screen reader compatibility
```

## Success Metrics and Validation

### Performance Targets
- **Search Response Time**: <250ms perceived latency
- **Bundle Size Impact**: <15KB gzipped JavaScript
- **Memory Usage**: <5MB for 100 cached searches
- **Accessibility Score**: 100% WCAG 2.1 AA compliance

### Testing Requirements
- **Unit Test Coverage**: >90% for all component modules
- **Integration Test Coverage**: Full user interaction flows
- **Accessibility Testing**: Screen reader and keyboard navigation
- **Performance Testing**: Search latency and memory usage
- **Cross-Browser Testing**: Modern browsers and mobile devices

This implementation plan provides a comprehensive, tested, and accessible solution for dynamic Spotify music search that avoids common combobox pitfalls while delivering excellent user experience and performance.