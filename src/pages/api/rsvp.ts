import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory store for the MVP demo (would be Supabase/D1 in production)
const rsvps: Array<{ name: string; message: string; attending: string; timestamp: string }> = [];

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, message, attending } = body;

  if (!name || !attending) {
    return new Response(JSON.stringify({ error: 'Name and attendance required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const entry = {
    name,
    message: message || '',
    attending,
    timestamp: new Date().toISOString(),
  };

  rsvps.push(entry);
  console.log(`[RSVP] ${attending === 'yes' ? '✓' : '✗'} ${name} — "${message}" (${rsvps.length} total)`);

  return new Response(JSON.stringify({ success: true, entry }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async () => {
  console.log(`[RSVP] Listing ${rsvps.length} responses`);
  return new Response(JSON.stringify({ rsvps, count: rsvps.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
