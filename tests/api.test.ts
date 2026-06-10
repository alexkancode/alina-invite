import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4321';

// These tests run against the live Astro dev server.
// Start it with `npm run dev` before running tests.

let testIpCounter = 0;

function uniqueIp(): string {
  testIpCounter++;
  return `10.0.${Math.floor(testIpCounter / 256)}.${testIpCounter % 256}`;
}

async function post(body: unknown, ip?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ip) headers['x-forwarded-for'] = ip;
  return fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

async function get(params = '') {
  const url = params ? `${BASE}/api/rsvp?${params}` : `${BASE}/api/rsvp`;
  return fetch(url);
}

beforeAll(async () => {
  try {
    await fetch(BASE);
  } catch {
    throw new Error('Dev server not running. Start it with: npm run dev');
  }
});

describe('POST /api/rsvp', () => {
  // ── Happy paths ──

  it('accepts a valid RSVP with attendance yes', async () => {
    const ip = uniqueIp();
    const res = await post({ name: 'Alice', message: 'See you there!', attending: 'yes' }, ip);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entry.name).toBe('Alice');
    expect(json.entry.attending).toBe('yes');
    expect(json.entry.message).toBe('See you there!');
    expect(json.entry.timestamp).toBeTruthy();
  });

  it('accepts a valid RSVP with attendance no', async () => {
    const ip = uniqueIp();
    const res = await post({ name: 'Bob', message: 'Sorry, can\'t make it', attending: 'no' }, ip);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entry.attending).toBe('no');
  });

  it('accepts RSVP without a message (optional field)', async () => {
    const ip = uniqueIp();
    const res = await post({ name: 'Charlie', attending: 'yes' }, ip);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entry.message).toBe('');
  });

  it('accepts RSVP with empty string message', async () => {
    const ip = uniqueIp();
    const res = await post({ name: 'Dana', message: '', attending: 'yes' }, ip);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entry.message).toBe('');
  });

  it('returns entry with ISO timestamp', async () => {
    const ip = uniqueIp();
    const res = await post({ name: 'Eve', attending: 'no' }, ip);
    const json = await res.json();
    const date = new Date(json.entry.timestamp);
    expect(date.getTime()).not.toBeNaN();
  });

  it('returns Content-Type application/json', async () => {
    const ip = uniqueIp();
    const res = await post({ name: 'Frank', attending: 'yes' }, ip);
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('allows same IP to update their RSVP', async () => {
    const ip = uniqueIp();
    await post({ name: 'Updater', attending: 'yes' }, ip);
    const res = await post({ name: 'Updater-v2', attending: 'no', message: 'changed mind' }, ip);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entry.name).toBe('Updater-v2');
    expect(json.entry.attending).toBe('no');
  });

  it('rejects name taken by a different IP', async () => {
    const ip1 = uniqueIp();
    const ip2 = uniqueIp();
    await post({ name: 'UniqueName', attending: 'yes' }, ip1);
    const res = await post({ name: 'UniqueName', attending: 'no' }, ip2);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBeTruthy();
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
    const ip = uniqueIp();
    await post({ name: unique, message: 'tracking test', attending: 'yes' }, ip);

    const res = await get();
    const json = await res.json();
    const found = json.rsvps.find((r: { name: string }) => r.name === unique);
    expect(found).toBeTruthy();
    expect(found.attending).toBe('yes');
    expect(found).not.toHaveProperty('message');
  });
});

describe('GET /api/rsvp?check=name', () => {
  it('returns exists:false for unknown name', async () => {
    const res = await get(`check=NobodyHere-${Date.now()}`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.exists).toBe(false);
  });

  it('returns exists:true and sameIp:true for own RSVP', async () => {
    const ip = uniqueIp();
    const name = `Checker-${Date.now()}`;
    await post({ name, attending: 'yes' }, ip);

    const res = await fetch(`${BASE}/api/rsvp?check=${encodeURIComponent(name)}`, {
      headers: { 'x-forwarded-for': ip },
    });
    const json = await res.json();
    expect(json.exists).toBe(true);
    expect(json.sameIp).toBe(true);
    expect(json.attending).toBe('yes');
  });

  it('returns exists:true and sameIp:false for another IP', async () => {
    const ip1 = uniqueIp();
    const ip2 = uniqueIp();
    const name = `OtherChecker-${Date.now()}`;
    await post({ name, attending: 'no' }, ip1);

    const res = await fetch(`${BASE}/api/rsvp?check=${encodeURIComponent(name)}`, {
      headers: { 'x-forwarded-for': ip2 },
    });
    const json = await res.json();
    expect(json.exists).toBe(true);
    expect(json.sameIp).toBe(false);
  });
});
