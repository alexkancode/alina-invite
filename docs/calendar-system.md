# Calendar Notification System

## Overview

This system generates RFC 5545-compliant ICS calendar files with dual reminder functionality for Alina's Birthday Party. The implementation includes:

- **1 Week Email Reminder**: ACTION:EMAIL with TRIGGER:-P1W
- **1 Day Popup Reminder**: ACTION:DISPLAY with TRIGGER:-P1D
- **Cross-platform compatibility**: Google Calendar, Outlook 2026, Apple Calendar
- **Personalized calendar events** for RSVP attendees

## API Endpoints

### Generic Calendar Download
```
GET /api/calendar/party.ics
```
- Returns generic party calendar without personalization
- Safe for sharing publicly
- Includes dual reminders

### Personalized Calendar Download
```
GET /api/calendar/[rsvpId].ics
```
- Returns personalized calendar with guest name
- Only available for guests who RSVP'd "yes"
- Includes personalized description
- Unique UID to prevent duplicate imports

## Calendar Features

### Event Details
- **Event**: Alina's Birthday Party
- **Date**: July 11, 2026
- **Time**: 3:00 PM - 6:00 PM CDT
- **Location**: 3220 Alabama CT, Houston, TX 77027
- **Timezone**: America/Chicago

### Reminder Configuration
1. **Email Reminder (P1W)**: One week before event
   - Triggers email notification in supported calendar apps
   - Subject: "Party Reminder: Alina's Birthday Party"
   - Body: "Alina's Birthday Party reminder - One week to go!"

2. **Popup Reminder (P1D)**: One day before event
   - Triggers popup/notification in calendar apps
   - Message: "Alina's Birthday Party tomorrow!"

### RFC 5545 Compliance Features
- Proper line folding (max 75 characters)
- Text escaping for special characters (`,`, `;`, `\\`, `\n`)
- VTIMEZONE definitions for accurate time handling
- Unique UIDs based on event + guest information
- Microsoft Outlook 2026 compatibility

## Frontend Integration

### RSVP Form Enhancement
When a guest submits an RSVP with "attending: yes":

1. **API Response includes**:
   ```json
   {
     "success": true,
     "entry": { "id": 123, "name": "John Doe", ... },
     "calendarUrl": "/api/calendar/123.ics"
   }
   ```

2. **UI Updates**:
   - Calendar download notification appears
   - RSVP status button changes to download mode
   - Calendar button switches from Google Calendar to ICS download

3. **Download Experience**:
   - Files named: `alina-birthday-party-{guest-name}.ics`
   - Browser downloads directly to device
   - Users can import into any calendar app

### Calendar Button Behavior
- **Before RSVP**: Links to Google Calendar with generic event
- **After "Yes" RSVP**: Downloads personalized ICS file
- **After "No" RSVP**: Remains as Google Calendar link

## Usage Examples

### For Guests
1. RSVP "Yes" on the party website
2. Download personalized calendar file automatically or via button
3. Import into preferred calendar app (Google, Outlook, Apple, etc.)
4. Receive reminders 1 week and 1 day before the party

### For Developers
```typescript
import { generatePersonalizedICS, generateGenericICS } from './lib/calendarGenerator';

// Generate personalized calendar
const ics = generatePersonalizedICS('John Doe', '123');

// Generate generic calendar
const genericICS = generateGenericICS();
```

## Calendar App Compatibility

### Google Calendar ✅
- Supports both EMAIL and DISPLAY alarms
- Properly imports timezone information
- Handles text escaping correctly

### Microsoft Outlook 2026 ✅
- RFC 5545 strict compliance implemented
- VALARM components positioned after event properties
- Proper VTIMEZONE definitions included

### Apple Calendar ✅
- Native support for ICS format
- Reminder notifications work on iOS/macOS
- Timezone handling accurate

### Other Calendar Apps ✅
- Standard RFC 5545 format ensures broad compatibility
- Fallback reminders if specific ACTION types not supported
- Clean text formatting for all calendar clients

## Technical Implementation

### File Structure
```
src/lib/calendarGenerator.ts          # Core ICS generation logic
src/pages/api/calendar/[rsvpId].ics.ts # Personalized calendar endpoint
src/pages/api/calendar/party.ics.ts   # Generic calendar endpoint
tests/calendar.test.ts               # Comprehensive test suite
```

### Key Functions
- `generateICS()`: Core RFC 5545 compliant ICS generation
- `generatePersonalizedICS()`: Creates guest-specific calendar
- `generateGenericICS()`: Creates public calendar version
- `escapeICSText()`: Handles special character escaping
- `foldLine()`: Implements RFC 5545 line folding

This implementation provides a robust, user-friendly calendar notification system that ensures guests receive timely reminders about Alina's Birthday Party through their preferred calendar applications.