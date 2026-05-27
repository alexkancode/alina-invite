import type { APIRoute } from 'astro';
import { Profanease } from 'profanease';
import en from 'profanease/langs/en';

export const prerender = false;

// ── Profanity filter ──
const filter = new Profanease({ languages: [en] });

// ── In-memory stores ──
export const rsvpsByIp = new Map<string, { name: string; message: string; attending: string; timestamp: string }>();
const flaggedInputs: Array<{ ip: string; field: string; value: string; timestamp: string }> = [];

export function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? '127.0.0.1';
}

/** Find if a name is already taken and by which IP */
export function findByName(name: string): { ip: string; entry: { name: string; message: string; attending: string; timestamp: string } } | null {
  const normalized = name.trim().toLowerCase();
  for (const [ip, entry] of rsvpsByIp) {
    if (entry.name.trim().toLowerCase() === normalized) {
      return { ip, entry };
    }
  }
  return null;
}

/** Check text for profanity and log if flagged */
function checkProfanity(text: string, field: string, ip: string): boolean {
  if (filter.check(text)) {
    flaggedInputs.push({ ip, field, value: text, timestamp: new Date().toISOString() });
    console.log(`[FLAGGED] ${field}: "${text}" from ${ip} (${flaggedInputs.length} total flags)`);
    return true;
  }
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, message, attending } = body;

  if (!name || !attending) {
    return new Response(JSON.stringify({ error: 'Name and attendance required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = getClientIp(request);

  // Profanity check on name and message
  if (checkProfanity(name, 'name', ip) || (message && checkProfanity(message, 'message', ip))) {
    return new Response(JSON.stringify({ error: 'Sorry, that has been flagged as inappropriate.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if name is taken by a different IP
  const existing = findByName(name);
  if (existing && existing.ip !== ip) {
    return new Response(JSON.stringify({ error: 'Name already taken by another guest' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const entry = {
    name,
    message: message || '',
    attending,
    timestamp: new Date().toISOString(),
  };

  rsvpsByIp.set(ip, entry);
  console.log(`[RSVP] ${attending === 'yes' ? '✓' : '✗'} ${name} — "${message}" (${rsvpsByIp.size} unique guests)`);

  return new Response(JSON.stringify({ success: true, entry }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const checkName = url.searchParams.get('check');

  // Name check mode: GET /api/rsvp?check=Bob
  if (checkName) {
    const ip = getClientIp(request);

    // Also check profanity on the name being checked
    if (filter.check(checkName)) {
      return new Response(JSON.stringify({ exists: false, flagged: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = findByName(checkName);

    if (!existing) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      exists: true,
      sameIp: existing.ip === ip,
      attending: existing.entry.attending,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Flagged inputs review: GET /api/rsvp?flagged=true
  if (url.searchParams.get('flagged') === 'true') {
    return new Response(JSON.stringify({ flagged: flaggedInputs, count: flaggedInputs.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Default: list all RSVPs (no IPs exposed)
  const rsvps = Array.from(rsvpsByIp.values());
  console.log(`[RSVP] Listing ${rsvps.length} responses`);
  return new Response(JSON.stringify({ rsvps, count: rsvps.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
