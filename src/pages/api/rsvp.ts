import type { APIRoute } from 'astro';
import { Profanease } from 'profanease';
import en from 'profanease/langs/en';
import { createHash } from 'crypto';
import pool from '../../lib/db';

export const prerender = false;

const filter = new Profanease({ languages: [en] });

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT || 'default-salt')).digest('hex');
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? '127.0.0.1';
}

function checkProfanity(text: string, field: string, ip: string): boolean {
  if (filter.check(text)) {
    console.log(`[FLAGGED] ${field}: "${text}" from ${hashIp(ip).slice(0, 8)}...`);
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
  const ipHash = hashIp(ip);

  if (checkProfanity(name, 'name', ip) || (message && checkProfanity(message, 'message', ip))) {
    return new Response(JSON.stringify({ error: 'Sorry, that has been flagged as inappropriate.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if name is taken by a different IP
  const { rows: existing } = await pool.query(
    'SELECT ip_hash FROM rsvps WHERE lower(name) = lower($1)',
    [name.trim()]
  );

  if (existing.length > 0 && existing[0].ip_hash !== ipHash) {
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

  await pool.query(
    `INSERT INTO rsvps (name, message, attending, ip_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (ip_hash) DO UPDATE SET
       name = EXCLUDED.name,
       message = EXCLUDED.message,
       attending = EXCLUDED.attending,
       updated_at = now()`,
    [name.trim(), entry.message, attending, ipHash]
  );

  return new Response(JSON.stringify({ success: true, entry }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const checkName = url.searchParams.get('check');

  if (checkName) {
    const ip = getClientIp(request);
    const ipHash = hashIp(ip);

    if (filter.check(checkName)) {
      return new Response(JSON.stringify({ exists: false, flagged: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { rows } = await pool.query(
      'SELECT ip_hash, attending FROM rsvps WHERE lower(name) = lower($1)',
      [checkName.trim()]
    );

    if (rows.length === 0) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      exists: true,
      sameIp: rows[0].ip_hash === ipHash,
      attending: rows[0].attending,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Default: list all RSVPs (no IPs/hashes exposed)
  const { rows } = await pool.query(
    'SELECT name, message, attending, created_at as timestamp FROM rsvps ORDER BY created_at'
  );

  return new Response(JSON.stringify({ rsvps: rows, count: rows.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
