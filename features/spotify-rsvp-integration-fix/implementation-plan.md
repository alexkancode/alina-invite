# Implementation Plan: Spotify RSVP Integration Fix

## Phase 1: Diagnosis and Analysis

### 1.1 Debug Current SpotifyCombobox Implementation
**Target:** Identify why song selection isn't working

```typescript
// Investigation areas in SpotifyCombobox.ts:
- selectTrack() method implementation
- Event handler binding for result item clicks
- Hidden field update logic
- State management for selected track
```

**Steps:**
- [ ] Review current selectTrack() method in SpotifyCombobox.ts
- [ ] Check event handler attachment for dropdown items
- [ ] Verify hidden input field selector and update mechanism
- [ ] Test selection flow in browser developer tools

### 1.2 Analyze Form Submission Flow
**Target:** Understand current RSVP form processing

- [ ] Review RSVP form structure in main page
- [ ] Check form submission handler
- [ ] Verify hidden field name matches expected backend field
- [ ] Analyze current database schema for RSVP table

## Phase 2: Frontend Fix - SpotifyCombobox Selection

### 2.1 Fix Selection Event Handling
**Target:** `src/components/spotify-combobox/SpotifyCombobox.ts`

```typescript
// Enhanced selectTrack method
public selectTrack(track: SpotifyTrack | null): void {
  if (track) {
    // Create complete song data object
    const songData = {
      title: track.title,
      artist: track.artist,
      year: track.year,
      spotifyUrl: track.spotifyUrl,
      spotifyId: track.spotifyId
    };

    // Update hidden form field with JSON
    this.hiddenInput.value = JSON.stringify(songData);

    // Update display input
    this.searchInput.value = `${track.title} - ${track.artist} (${track.year})`;

    // Update internal state
    this.setState({
      selectedTrack: track,
      isOpen: false,
      highlightedIndex: -1,
      results: []
    });

    // Dispatch change event for form validation
    this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // Clear selection
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    this.setState({ selectedTrack: null });
  }
}
```

### 2.2 Enhance Result Item Click Handling
**Target:** Ensure click events properly trigger selection

```typescript
// In createResultItem method
private createResultItem(track: SpotifyTrack, index: number): HTMLLIElement {
  const li = document.createElement('li');
  // ... existing setup ...

  // Enhanced click handler
  li.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Call selectTrack with proper track data
    this.selectTrack(track);
    
    // Provide user feedback
    this.searchInput.focus();
  });

  return li;
}
```

### 2.3 Add Visual Feedback for Selection
**Target:** Clear indication when song is selected

```typescript
// Add selection state to component
private updateSelectionDisplay(): void {
  if (this.state.selectedTrack) {
    this.searchInput.classList.add('spotify-selected');
    this.searchInput.setAttribute('data-selected', 'true');
  } else {
    this.searchInput.classList.remove('spotify-selected');
    this.searchInput.removeAttribute('data-selected');
  }
}
```

## Phase 3: Backend Integration - RSVP Processing

### 3.1 Update RSVP API Endpoint
**Target:** `src/pages/api/rsvp.ts` or equivalent

```typescript
interface RSVPSubmission {
  name: string;
  attending: 'yes' | 'no';
  favoriteSong?: string; // JSON string
}

interface SongData {
  title: string;
  artist: string;
  year: number;
  spotifyUrl: string;
  spotifyId: string;
}

export async function POST({ request }: APIContext) {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const attending = formData.get('attending') as string;
  const favoriteSongJson = formData.get('favoriteSong') as string;

  let songData: SongData | null = null;
  
  // Parse song data if provided
  if (favoriteSongJson && favoriteSongJson.trim()) {
    try {
      songData = JSON.parse(favoriteSongJson);
    } catch (error) {
      console.warn('Invalid song data format:', favoriteSongJson);
    }
  }

  // Save to database with song metadata
  await saveRSVPWithSong({
    name,
    attending: attending === 'yes',
    song: songData
  });
}
```

### 3.2 Database Schema Enhancement
**Target:** Migration for RSVP table song fields

```sql
-- Migration: Add song fields to RSVP table
ALTER TABLE rsvps ADD COLUMN song_title VARCHAR(255);
ALTER TABLE rsvps ADD COLUMN song_artist VARCHAR(255);
ALTER TABLE rsvps ADD COLUMN song_year INTEGER;
ALTER TABLE rsvps ADD COLUMN song_spotify_url TEXT;
ALTER TABLE rsvps ADD COLUMN song_spotify_id VARCHAR(100);
```

**Database Function:**
```typescript
// src/lib/rsvpDatabase.ts
interface RSVPWithSong {
  name: string;
  attending: boolean;
  song?: SongData | null;
}

export async function saveRSVPWithSong(data: RSVPWithSong): Promise<void> {
  const client = await getDbClient();
  
  await client.query(
    `INSERT INTO rsvps (name, attending, song_title, song_artist, song_year, song_spotify_url, song_spotify_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      data.name,
      data.attending,
      data.song?.title || null,
      data.song?.artist || null,
      data.song?.year || null,
      data.song?.spotify_url || null,
      data.song?.spotify_id || null
    ]
  );
}
```

## Phase 4: Form Validation and Error Handling

### 4.1 Client-Side Validation
**Target:** Validate song data before submission

```typescript
// Form submission validation
function validateRSVPForm(formData: FormData): boolean {
  const favoriteSong = formData.get('favoriteSong') as string;
  
  if (favoriteSong && favoriteSong.trim()) {
    try {
      const songData = JSON.parse(favoriteSong);
      return songData.title && songData.artist && songData.spotifyUrl;
    } catch {
      return false;
    }
  }
  
  return true; // Song is optional
}
```

### 4.2 Error State Handling
**Target:** Graceful handling of selection failures

```typescript
// Add error state to SpotifyCombobox
private handleSelectionError(error: string): void {
  console.warn('Song selection error:', error);
  
  // Show user-friendly feedback
  this.searchInput.classList.add('spotify-error');
  this.searchInput.setAttribute('aria-describedby', 'spotify-error-message');
  
  // Reset after delay
  setTimeout(() => {
    this.searchInput.classList.remove('spotify-error');
  }, 3000);
}
```

## Phase 5: Testing Strategy

### 5.1 Unit Tests
**Target:** `tests/unit/spotify-rsvp-integration.test.ts`

```typescript
describe('SpotifyCombobox Selection', () => {
  test('selectTrack updates hidden field with JSON', () => {
    const track = createMockTrack();
    combobox.selectTrack(track);
    
    const hiddenValue = hiddenInput.value;
    const parsedData = JSON.parse(hiddenValue);
    
    expect(parsedData.title).toBe(track.title);
    expect(parsedData.artist).toBe(track.artist);
    expect(parsedData.spotifyUrl).toBe(track.spotifyUrl);
  });

  test('clicking result item triggers selection', () => {
    const track = createMockTrack();
    const resultItem = combobox.createResultItem(track, 0);
    
    resultItem.click();
    
    expect(hiddenInput.value).toContain(track.title);
    expect(searchInput.value).toContain(track.title);
  });
});
```

### 5.2 Integration Tests
**Target:** `tests/integration/rsvp-song-submission.test.ts`

```typescript
describe('RSVP with Song Submission', () => {
  test('form submission includes song data', async () => {
    await fillRSVPForm({ name: 'Test User', attending: 'yes' });
    await selectSong('Dancing Queen', 'ABBA');
    await submitForm();
    
    const savedRSVP = await getLastRSVP();
    expect(savedRSVP.song_title).toBe('Dancing Queen');
    expect(savedRSVP.song_artist).toBe('ABBA');
  });

  test('RSVP works without song selection', async () => {
    await fillRSVPForm({ name: 'Test User', attending: 'yes' });
    await submitForm();
    
    const savedRSVP = await getLastRSVP();
    expect(savedRSVP.song_title).toBeNull();
    expect(savedRSVP.name).toBe('Test User');
  });
});
```

### 5.3 End-to-End Tests
**Target:** Browser-based testing with Playwright

```typescript
test('complete RSVP with song selection flow', async ({ page }) => {
  await page.goto('/');
  
  // Fill RSVP form
  await page.fill('[name="name"]', 'Test User');
  await page.check('[value="yes"]');
  
  // Search and select song
  await page.fill('#spotify-search', 'queen');
  await page.waitForSelector('.spotify-result-item');
  await page.click('.spotify-result-item:first-child');
  
  // Verify selection
  const hiddenValue = await page.inputValue('[name="favoriteSong"]');
  expect(JSON.parse(hiddenValue)).toHaveProperty('title');
  
  // Submit and verify
  await page.click('[type="submit"]');
  await expect(page).toHaveURL(/\/success/);
});
```

## Phase 6: Database Migration

### 6.1 Create Migration File
**Target:** `migrations/0008_add_song_fields_to_rsvps.sql`

```sql
-- Add song metadata columns to RSVP table
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_title VARCHAR(255);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_artist VARCHAR(255);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_year INTEGER;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_spotify_url TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_spotify_id VARCHAR(100);

-- Add index for song searches
CREATE INDEX IF NOT EXISTS idx_rsvps_song_title ON rsvps(song_title);
CREATE INDEX IF NOT EXISTS idx_rsvps_song_artist ON rsvps(song_artist);
```

### 6.2 Update Database Types
**Target:** `src/lib/types/database.ts`

```typescript
interface RSVPRecord {
  id: number;
  name: string;
  attending: boolean;
  song_title: string | null;
  song_artist: string | null;
  song_year: number | null;
  song_spotify_url: string | null;
  song_spotify_id: string | null;
  created_at: Date;
}
```

## Implementation Quality Checklist

### Code Organization
- [ ] Selection logic properly encapsulated in SpotifyCombobox class
- [ ] Database functions in appropriate data access layer
- [ ] Form validation utilities in dedicated validation module
- [ ] No duplicate functionality across components

### Testing Coverage
- [ ] Unit tests for selection mechanism
- [ ] Integration tests for form submission
- [ ] End-to-end tests for complete user flow
- [ ] Edge case handling (malformed JSON, missing fields)

### Performance
- [ ] Minimal DOM manipulation during selection
- [ ] Efficient event handling without memory leaks
- [ ] Optimized database queries with proper indexing
- [ ] No unnecessary re-renders or state updates

### Error Handling
- [ ] Graceful handling of JSON parse errors
- [ ] Database constraint validation
- [ ] User-friendly error messages
- [ ] Fallback behavior when selection fails

## Success Metrics

1. **Selection Reliability**: 100% success rate for dropdown item clicks
2. **Data Integrity**: All selected songs properly stored in database
3. **User Experience**: Clear visual feedback for selection state
4. **Performance**: Selection response time under 100ms
5. **Compatibility**: Works across target browsers and devices

## Risk Mitigation

### Potential Issues:
1. **Event Handler Conflicts**: Multiple click handlers interfering
2. **State Synchronization**: Hidden field and display getting out of sync
3. **JSON Serialization**: Malformed data breaking form submission
4. **Database Constraints**: Song data exceeding field limits

### Mitigation Strategies:
1. Use event.stopPropagation() and proper event delegation
2. Single source of truth for selection state with validation
3. Robust JSON parsing with error handling
4. Database field validation and length constraints