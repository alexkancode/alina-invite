import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4321';

// These tests run against the live Astro dev server.
// Start it with `npm run dev` before running tests.

async function post(body: unknown) {
  return fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function get() {
  return fetch(`${BASE}/api/rsvp`);
}

beforeAll(async () => {
  // Verify server is running
  try {
    await fetch(BASE);
  } catch {
    throw new Error('Dev server not running. Start it with: npm run dev');
  }
});

describe('POST /api/rsvp', () => {
  // ── Happy paths ──

  it('accepts a valid RSVP with attendance yes', async () => {
    const res = await post({ name: 'Alice', message: 'See you there!', attending: 'yes' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entry.name).toBe('Alice');
    expect(json.entry.attending).toBe('yes');
    expect(json.entry.message).toBe('See you there!');
    expect(json.entry.timestamp).toBeTruthy();
  });

  it('accepts a valid RSVP with attendance no', async () => {
    const res = await post({ name: 'Bob', message: 'Sorry, can\'t make it', attending: 'no' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entry.attending).toBe('no');
  });

  it('accepts RSVP without a message (optional field)', async () => {
    const res = await post({ name: 'Charlie', attending: 'yes' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entry.message).toBe('');
  });

  it('accepts RSVP with empty string message', async () => {
    const res = await post({ name: 'Dana', message: '', attending: 'yes' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entry.message).toBe('');
  });

  it('returns entry with ISO timestamp', async () => {
    const res = await post({ name: 'Eve', attending: 'no' });
    const json = await res.json();
    const date = new Date(json.entry.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });

  it('returns Content-Type application/json', async () => {
    const res = await post({ name: 'Frank', attending: 'yes' });
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  // ── Unhappy paths ──

  it('rejects when name is missing', async () => {
    const res = await post({ message: 'hello', attending: 'yes' });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('rejects when attending is missing', async () => {
    const res = await post({ name: 'Grace', message: 'hello' });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('rejects when both name and attending are missing', async () => {
    const res = await post({ message: 'just a message' });
    expect(res.status).toBe(400);
  });

  it('rejects an empty object', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
  });

  it('rejects when name is empty string', async () => {
    const res = await post({ name: '', attending: 'yes' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/rsvp', () => {
  it('returns a list of RSVPs', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.rsvps)).toBe(true);
    expect(typeof json.count).toBe('number');
  });

  it('returns Content-Type application/json', async () => {
    const res = await get();
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('count matches rsvps array length', async () => {
    const res = await get();
    const json = await res.json();
    expect(json.count).toBe(json.rsvps.length);
  });

  it('reflects previously posted RSVPs', async () => {
    const unique = `Tester-${Date.now()}`;
    await post({ name: unique, message: 'tracking test', attending: 'yes' });

    const res = await get();
    const json = await res.json();
    const found = json.rsvps.find((r: { name: string }) => r.name === unique);
    expect(found).toBeTruthy();
    expect(found.message).toBe('tracking test');
  });
});
