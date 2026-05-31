/**
 * RFC 5545-compliant ICS calendar generation for party invitations
 * Features:
 * - Dual VALARM components (1 week email + 1 day popup)
 * - 2026 Microsoft Outlook compatibility
 * - Cross-platform calendar support
 * - Unique UIDs to prevent duplicate imports
 */

import { createHash } from 'crypto';

export interface PartyEventDetails {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  rsvpId?: string;
  guestName?: string;
}

/**
 * Format date for ICS (UTC format: YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for ICS with timezone (YYYYMMDDTHHMMSS)
 * This keeps the date in local time rather than converting to UTC
 */
function formatICSDateTZ(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escape text for ICS format (RFC 5545)
 * Handles special characters: comma, semicolon, backslash, newline
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Fold long lines for ICS format (max 75 octets per line)
 * RFC 5545 requires line folding for long content
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  let folded = '';
  let pos = 0;

  while (pos < line.length) {
    if (pos === 0) {
      // First line can be up to 75 characters
      folded += line.substring(0, Math.min(75, line.length));
      pos = Math.min(75, line.length);
    } else {
      // Continuation lines start with space and can have 74 more characters
      folded += '\r\n ';
      folded += line.substring(pos, Math.min(pos + 74, line.length));
      pos = Math.min(pos + 74, line.length);
    }
  }

  return folded;
}

/**
 * Generate unique UID for the event
 * Uses party date and guest info to create consistent but unique identifier
 */
function generateUID(eventDetails: PartyEventDetails): string {
  const baseString = `${eventDetails.startDate.toISOString()}-${eventDetails.title}-${eventDetails.location}`;
  if (eventDetails.guestName) {
    const hash = createHash('md5').update(`${baseString}-${eventDetails.guestName}`).digest('hex');
    return `${hash}@party.calendar`;
  }
  const hash = createHash('md5').update(baseString).digest('hex');
  return `${hash}@party.calendar`;
}

/**
 * Convert timezone name to standard format
 */
function normalizeTimezone(tz: string): string {
  // Common timezone mappings
  const tzMap: Record<string, string> = {
    'America/New_York': 'America/New_York',
    'America/Chicago': 'America/Chicago',
    'America/Denver': 'America/Denver',
    'America/Los_Angeles': 'America/Los_Angeles',
    'EST': 'America/New_York',
    'CST': 'America/Chicago',
    'MST': 'America/Denver',
    'PST': 'America/Los_Angeles'
  };

  return tzMap[tz] || tz;
}

/**
 * Generate RFC 5545-compliant ICS content with dual reminders
 */
export function generateICS(eventDetails: PartyEventDetails): string {
  const now = new Date();
  const uid = generateUID(eventDetails);
  const timezone = normalizeTimezone(eventDetails.timezone);

  // Generate DTSTAMP (current time in UTC)
  const dtstamp = formatICSDate(now);

  // Format event times
  const dtstart = formatICSDateTZ(eventDetails.startDate);
  const dtend = formatICSDateTZ(eventDetails.endDate);

  // Personalized description if guest name is provided
  let description = eventDetails.description;
  if (eventDetails.guestName) {
    description = `Hi ${eventDetails.guestName}!\n\n${description}\n\nWe can't wait to celebrate with you!`;
  }

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Party Calendar//Party System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    '',
    'BEGIN:VTIMEZONE',
    `TZID:${timezone}`,
    'BEGIN:STANDARD',
    'DTSTART:20071104T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'TZNAME:EST',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:20070311T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'TZNAME:EDT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    '',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${timezone}:${dtstart}`,
    `DTEND;TZID=${timezone}:${dtend}`,
    foldLine(`SUMMARY:${escapeICSText(eventDetails.title)}`),
    foldLine(`DESCRIPTION:${escapeICSText(description)}`),
    foldLine(`LOCATION:${escapeICSText(eventDetails.location)}`),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    '',
    // Email reminder - 1 week before
    'BEGIN:VALARM',
    'ACTION:EMAIL',
    foldLine(`DESCRIPTION:${escapeICSText(eventDetails.title)} reminder - One week to go!`),
    foldLine(`SUMMARY:Party Reminder: ${escapeICSText(eventDetails.title)}`),
    'TRIGGER:-P1W',
    'END:VALARM',
    '',
    // Popup reminder - 1 day before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    foldLine(`DESCRIPTION:${escapeICSText(eventDetails.title)} tomorrow!`),
    'TRIGGER:-P1D',
    'END:VALARM',
    '',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
}

/**
 * Get default party event details for Alina's Birthday Party
 */
export function getDefaultPartyDetails(): Omit<PartyEventDetails, 'guestName' | 'rsvpId'> {
  // July 11th, 2026, 3-6pm Central Time (Houston, TX)
  // Create dates explicitly in local timezone
  const startDate = new Date(2026, 6, 11, 15, 0, 0); // 3 PM (month is 0-indexed)
  const endDate = new Date(2026, 6, 11, 18, 0, 0);   // 6 PM

  return {
    title: "Alina's Birthday Party",
    description: "You're invited to Alina Kancewick's first birthday! Join us for an afternoon of celebration, fun, and cake. There will be activities for all ages, delicious food, and plenty of opportunities to make wonderful memories together.",
    location: "3220 Alabama CT, Houston, TX 77027",
    startDate,
    endDate,
    timezone: 'America/Chicago'
  };
}

/**
 * Generate personalized ICS for a specific RSVP guest
 */
export function generatePersonalizedICS(guestName: string, rsvpId?: string): string {
  const partyDetails: PartyEventDetails = {
    ...getDefaultPartyDetails(),
    guestName,
    rsvpId
  };

  return generateICS(partyDetails);
}

/**
 * Generate generic ICS for the party (no personalization)
 */
export function generateGenericICS(): string {
  const partyDetails: PartyEventDetails = {
    ...getDefaultPartyDetails()
  };

  return generateICS(partyDetails);
}