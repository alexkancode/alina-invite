import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory store keyed by IP for deduplication (would be Supabase/D1 in production)
const rsvpsByIp = new Map<string, { name: string; message: string; attending: string; timestamp: string }>();

function getClientIp(request: Request): string {
  // Cloudflare Workers
  return request.headers.get('CF-Connecting-IP')
    // Proxied / forwarded
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    // Local dev fallback
    ?? '127.0.0.1';
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

export const GET: APIRoute = async () => {
  // Return all RSVPs without exposing IP addresses
  const rsvps = Array.from(rsvpsByIp.values());
  console.log(`[RSVP] Listing ${rsvps.length} responses`);
  return new Response(JSON.stringify({ rsvps, count: rsvps.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
