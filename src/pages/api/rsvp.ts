import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory store keyed by IP for deduplication (would be Supabase/D1 in production)
export const rsvpsByIp = new Map<string, { name: string; message: string; attending: string; timestamp: string }>();

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

  // Upsert — replaces any previous RSVP from this IP
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

  // Default: list all RSVPs (no IPs exposed)
  const rsvps = Array.from(rsvpsByIp.values());
  console.log(`[RSVP] Listing ${rsvps.length} responses`);
  return new Response(JSON.stringify({ rsvps, count: rsvps.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
