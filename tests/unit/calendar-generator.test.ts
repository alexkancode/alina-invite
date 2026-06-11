import { describe, expect, test } from 'vitest';
import { generateGenericICS, generatePersonalizedICS } from '../../src/lib/calendarGenerator';

const bodies = [
  ['generic', generateGenericICS()],
  ['personalized', generatePersonalizedICS('Test Guest', '42')]
] as const;

describe.each(bodies)('ICS validity for Apple parsers (%s)', (_label, ics) => {
  test('begins with BEGIN:VCALENDAR as the very first bytes', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
  });

  test('uses CRLF line endings exclusively', () => {
    expect(ics.replace(/\r\n/g, '').includes('\n')).toBe(false);
    expect(ics.replace(/\r\n/g, '').includes('\r')).toBe(false);
  });

  test('contains no blank lines', () => {
    const lines = ics.split('\r\n');
    expect(lines.filter(l => l === '')).toHaveLength(0);
  });

  test('contains no EMAIL alarms', () => {
    expect(ics).not.toContain('ACTION:EMAIL');
  });

  test('has display alarms for one week and one day before', () => {
    expect(ics.match(/ACTION:DISPLAY/g)).toHaveLength(2);
    expect(ics).toContain('TRIGGER:-P1W');
    expect(ics).toContain('TRIGGER:-P1D');
  });

  test('names the Chicago timezone correctly', () => {
    expect(ics).toContain('TZNAME:CST');
    expect(ics).toContain('TZNAME:CDT');
    expect(ics).not.toContain('TZNAME:EST');
    expect(ics).not.toContain('TZNAME:EDT');
  });

  test('carries the required identity fields', () => {
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toMatch(/PRODID:.+/);
    expect(ics).toMatch(/UID:.+@/);
    expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    expect(ics).toContain('METHOD:PUBLISH');
  });

  test('keeps every line within 75 octets', () => {
    for (const line of ics.split('\r\n')) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
  });

  test('event runs 3pm to 6pm in America/Chicago', () => {
    expect(ics).toContain('DTSTART;TZID=America/Chicago:20260711T150000');
    expect(ics).toContain('DTEND;TZID=America/Chicago:20260711T180000');
  });
});
