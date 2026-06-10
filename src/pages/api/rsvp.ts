import type { APIRoute } from 'astro';
import { Profanease } from 'profanease';
import en from 'profanease/langs/en';
import { createHash } from 'crypto';
import pool from '../../lib/db';
import { parseRsvpSong } from '../../lib/rsvpSong';

export const prerender = false;

const filter = new Profanease({ languages: [en] });

// In-memory store for development when database is not connected
const devRsvps: Array<{
  name: string;
  message: string;
  attending: string;
  timestamp: string;
  song_title?: string;
  song_artist?: string;
  song_year?: number;
  song_spotify_url?: string;
  song_spotify_id?: string;
  song_album_art_url?: string;
  ip_hash: string;
}> = [];

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
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Request body must be JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const name = typeof body.name === 'string' ? body.name : '';
  const message = typeof body.message === 'string' ? body.message : '';
  const attending = typeof body.attending === 'string' ? body.attending : '';
  const favoriteSong = parseRsvpSong(body.favoriteSong);

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
  try {
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
    favoriteSong: favoriteSong || null,
  };

  // Extract song fields for database insertion
  const songTitle = favoriteSong?.title || null;
  const songArtist = favoriteSong?.artist || null;
  const songYear = favoriteSong?.year || null;
  const songSpotifyUrl = favoriteSong?.spotifyUrl || null;
  const songSpotifyId = favoriteSong?.spotifyId || null;
  const songAlbumArtUrl = favoriteSong?.albumArtUrl || null;

  // Insert or update RSVP and get the ID
  const { rows: insertRows } = await pool.query(
    `INSERT INTO rsvps (name, message, attending, ip_hash, song_title, song_artist, song_year, song_spotify_url, song_spotify_id, song_album_art_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (ip_hash) DO UPDATE SET
       name = EXCLUDED.name,
       message = EXCLUDED.message,
       attending = EXCLUDED.attending,
       song_title = EXCLUDED.song_title,
       song_artist = EXCLUDED.song_artist,
       song_year = EXCLUDED.song_year,
       song_spotify_url = EXCLUDED.song_spotify_url,
       song_spotify_id = EXCLUDED.song_spotify_id,
       song_album_art_url = COALESCE(
         EXCLUDED.song_album_art_url,
         CASE WHEN rsvps.song_spotify_id = EXCLUDED.song_spotify_id
              THEN rsvps.song_album_art_url END
       ),
       updated_at = now()
     RETURNING id`,
    [name.trim(), entry.message, attending, ipHash, songTitle, songArtist, songYear, songSpotifyUrl, songSpotifyId, songAlbumArtUrl]
  );

  const rsvpId = insertRows[0].id;

  return new Response(JSON.stringify({
    success: true,
    entry: { ...entry, id: rsvpId },
    calendarUrl: attending === 'yes' ? `/api/calendar/${rsvpId}.ics` : null
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  } catch (dbError) {
    console.error('Database connection error:', dbError.message);

    // Store in development memory when database is not available
    const existingIndex = devRsvps.findIndex(r => r.ip_hash === ipHash);
    const previous = existingIndex >= 0 ? devRsvps[existingIndex] : null;
    const preservedArt = favoriteSong?.albumArtUrl
      || (previous && previous.song_spotify_id === favoriteSong?.spotifyId ? previous.song_album_art_url : null);
    const devEntry = {
      name,
      message: message || '',
      attending,
      timestamp: new Date().toISOString(),
      song_title: favoriteSong?.title || null,
      song_artist: favoriteSong?.artist || null,
      song_year: favoriteSong?.year || null,
      song_spotify_url: favoriteSong?.spotifyUrl || null,
      song_spotify_id: favoriteSong?.spotifyId || null,
      song_album_art_url: preservedArt || null,
      ip_hash: ipHash
    };

    if (existingIndex >= 0) {
      // Update existing RSVP
      devRsvps[existingIndex] = devEntry;
    } else {
      // Add new RSVP
      devRsvps.push(devEntry);
    }

    // Return a development-friendly response when database is not available
    return new Response(JSON.stringify({
      success: true,
      entry: {
        name,
        message: message || '',
        attending,
        timestamp: new Date().toISOString(),
        favoriteSong: favoriteSong || null,
        id: 'dev-' + Date.now()
      },
      calendarUrl: attending === 'yes' ? `/api/calendar/dev-${Date.now()}.ics` : null,
      dev_note: 'Database not connected - using mock response for development'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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

    try {
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

    } catch (dbError) {
      console.error('Database connection error (name check):', dbError.message);

      // Check in-memory store for development
      const existing = devRsvps.find(r => r.name.toLowerCase() === checkName.toLowerCase());

      if (!existing) {
        return new Response(JSON.stringify({
          exists: false,
          dev_note: 'Database not connected - checked in-memory store'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        exists: true,
        sameIp: existing.ip_hash === ipHash,
        attending: existing.attending,
        dev_note: 'Database not connected - found in in-memory store'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Default: list all RSVPs (no IPs/hashes exposed)
  try {
    const { rows } = await pool.query(
      `SELECT name, message, attending, created_at as timestamp,
              song_title, song_artist, song_year, song_spotify_url, song_spotify_id,
              song_album_art_url
       FROM rsvps ORDER BY created_at`
    );

    return new Response(JSON.stringify({ rsvps: rows, count: rows.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (dbError) {
    console.error('Database connection error (list RSVPs):', dbError.message);

    // Return mock data + submitted RSVPs for development
    const baseMockRsvps = [
      {
        name: "Alex K",
        attending: "yes",
        message: "Can't wait to celebrate!",
        song_title: "Bohemian Rhapsody",
        song_artist: "Queen",
        timestamp: "2026-01-15T10:30:00Z"
      },
      {
        name: "Sarah M",
        attending: "yes",
        message: "So excited!",
        song_title: "Stayin' Alive",
        song_artist: "Bee Gees",
        timestamp: "2026-01-14T15:20:00Z"
      },
      {
        name: "Mike R",
        attending: "no",
        message: "Sorry, can't make it",
        timestamp: "2026-01-13T09:15:00Z"
      }
    ];

    // Add dynamically submitted RSVPs from in-memory store
    const allRsvps = [...baseMockRsvps, ...devRsvps.map(r => ({
      name: r.name,
      attending: r.attending,
      message: r.message,
      song_title: r.song_title,
      song_artist: r.song_artist,
      song_year: r.song_year,
      song_spotify_url: r.song_spotify_url,
      song_spotify_id: r.song_spotify_id,
      song_album_art_url: r.song_album_art_url,
      timestamp: r.timestamp
    }))];

    return new Response(JSON.stringify({
      rsvps: allRsvps,
      count: allRsvps.length,
      dev_note: `Using mock data for development - database not connected (${devRsvps.length} dynamic RSVPs)`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
