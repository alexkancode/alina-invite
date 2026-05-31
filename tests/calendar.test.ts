import { describe, test, expect } from 'vitest';
import {
  generateICS,
  generatePersonalizedICS,
  generateGenericICS,
  getDefaultPartyDetails
} from '../src/lib/calendarGenerator';

describe('Calendar Generation', () => {
  test('generates valid ICS with required components', () => {
    const partyDetails = getDefaultPartyDetails();
    const ics = generateICS(partyDetails);

    // Check basic ICS structure
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Party Calendar//Party System//EN');

    // Check event details
    expect(ics).toContain("SUMMARY:Alina's Birthday Party");
    expect(ics).toContain('LOCATION:3220 Alabama CT\\, Houston\\, TX 77027');
    expect(ics).toContain('TZID:America/Chicago');

    // Check for dual VALARM components
    const alarmMatches = ics.match(/BEGIN:VALARM/g);
    expect(alarmMatches).toBeTruthy();
    expect(alarmMatches?.length).toBe(2);

    // Check specific alarm types
    expect(ics).toContain('ACTION:EMAIL');
    expect(ics).toContain('ACTION:DISPLAY');
    expect(ics).toContain('TRIGGER:-P1W'); // 1 week
    expect(ics).toContain('TRIGGER:-P1D'); // 1 day
  });

  test('generates personalized ICS with guest name', () => {
    const ics = generatePersonalizedICS('John Doe');

    expect(ics).toContain('Hi John Doe!');
    expect(ics).toContain("We can't wait to celebrate with yo");

    // Should have unique UID based on guest name
    expect(ics).toContain('UID:');
    expect(ics).toContain('@party.calendar');
  });

  test('generates generic ICS without personalization', () => {
    const ics = generateGenericICS();

    expect(ics).not.toContain('Hi ');
    expect(ics).not.toContain("We can't wait to celebrate with you!");
    expect(ics).toContain("You're invited to Alina Kancewick's first birthday");
  });

  test('properly escapes ICS text', () => {
    const partyDetails = {
      ...getDefaultPartyDetails(),
      title: 'Test;Party,With\\Special\nChars',
      description: 'Line 1\nLine 2; with, special\\chars'
    };

    const ics = generateICS(partyDetails);

    expect(ics).toContain('SUMMARY:Test\\;Party\\,With\\\\Special\\nChars');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2\\; with\\, special\\\\chars');
  });

  test('properly folds long lines', () => {
    const partyDetails = {
      ...getDefaultPartyDetails(),
      description: 'This is a very long description that should be folded according to RFC 5545 requirements because it exceeds the maximum line length of 75 octets and needs proper line continuation.'
    };

    const ics = generateICS(partyDetails);
    const lines = ics.split('\r\n');

    // Check that no line exceeds 75 characters (except continuation lines starting with space)
    for (const line of lines) {
      if (!line.startsWith(' ')) {
        expect(line.length).toBeLessThanOrEqual(75);
      }
    }

    // Check that folded lines have proper continuation
    const descriptionLines = lines.filter(line =>
      line.startsWith('DESCRIPTION:') || (line.startsWith(' ') && lines[lines.indexOf(line) - 1]?.includes('DESCRIPTION'))
    );
    expect(descriptionLines.length).toBeGreaterThan(1);
  });

  test('generates correct date format for July 11, 2026', () => {
    const ics = generateGenericICS();

    // Should contain correct date/time for the party
    expect(ics).toContain('20260711T150000'); // 3 PM local
    expect(ics).toContain('20260711T180000'); // 6 PM local
  });

  test('includes proper timezone information', () => {
    const ics = generateGenericICS();

    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('END:VTIMEZONE');
    expect(ics).toContain('TZID:America/Chicago');
    expect(ics).toContain('TZNAME:EST');
    expect(ics).toContain('TZNAME:EDT');
  });

  test('alarm descriptions are informative', () => {
    const ics = generatePersonalizedICS('Alice');

    expect(ics).toContain('Party reminder - One week to go!');
    expect(ics).toContain('Party tomorrow!');
    expect(ics).toContain("Party Reminder: Alina's Birthday Party");
  });
});