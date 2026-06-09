# Feature: Spotify RSVP Integration Fix

## Problem Statement
The Spotify search combobox allows users to search and select songs, but the selection is not properly saving to the RSVP form. When users select a song from the dropdown, the selection doesn't populate the hidden form field, resulting in no song data being submitted with the RSVP.

## Current Issues
1. **Selection Not Persisting**: Song selection from dropdown doesn't update the hidden form field
2. **Missing Database Storage**: RSVP submissions don't include selected song metadata
3. **Incomplete Data Tracking**: Need to store song name, artist, year, and Spotify URL

## Requirements

### 1. Fix Combobox Selection Handling
- Ensure clicking on dropdown items properly updates the hidden form field
- Display selected song in the input field
- Maintain selection state until form submission

### 2. Enhanced Database Storage
- Store complete song metadata with RSVP records
- Track: song name, artist, year, Spotify URL
- Maintain data integrity and relationships

### 3. Form Integration Validation
- Verify hidden field value is included in form submission
- Ensure proper JSON serialization of song data
- Handle edge cases (no selection, malformed data)

## Technical Context

### Current Implementation
- **Component**: `MusicSearchWidgetDynamic.astro` with progressive enhancement
- **JavaScript**: `SpotifyCombobox.ts` handles search and display logic
- **Form Field**: Hidden input `favoriteSong` should receive JSON data
- **Database**: RSVP table needs song data fields

### Expected Behavior
1. User searches for song using combobox
2. User clicks on song from dropdown results
3. Selected song appears in input field
4. Hidden form field contains JSON: `{"title": "...", "artist": "...", "year": ..., "spotifyUrl": "..."}`
5. Form submission includes song data
6. Database stores complete song metadata with RSVP

## Success Criteria
1. **Selection Works**: Clicking dropdown items updates form field and displays selection
2. **Data Persistence**: Selected song data persists until form submission
3. **Database Integration**: RSVP records include complete song metadata
4. **UI Feedback**: User sees selected song clearly indicated
5. **Error Handling**: Graceful handling when no song selected or invalid data

## Implementation Scope
- Debug and fix SpotifyCombobox selection event handlers
- Update RSVP form processing to handle song data
- Enhance database schema for song metadata storage
- Add form validation for song data integrity
- Test end-to-end selection and submission flow