import { beforeAll, describe, expect, test } from 'vitest';

const BASE = 'http://localhost:4321';

let testIpCounter = 0;

function uniqueIp(): string {
  testIpCounter++;
  return `10.9.${Math.floor(testIpCounter / 256)}.${testIpCounter % 256}`;
}

function uniqueName(prefix: string): string {
  return `${prefix} ${testIpCounter}-${process.pid}`;
}

async function postJson(body: unknown, ip: string) {
  return fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

beforeAll(async () => {
  try {
    await fetch(BASE);
  } catch {
    throw new Error('Dev server not running. Start it with: npm run dev');
  }
});

describe('RSVP song submission over the browser JSON contract', () => {
  const songData = {
    title: 'Dancing Queen',
    artist: 'ABBA',
    year: 1976,
    spotifyUrl: 'https://open.spotify.com/track/0GjEhVFGZW8afUYGChu3Rr',
    spotifyId: '0GjEhVFGZW8afUYGChu3Rr',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27370f7a1b35d5165c85b95a0e0'
  };

  test('saves an RSVP with a song object exactly as index.astro submits it', async () => {
    const ip = uniqueIp();
    const name = uniqueName('Song Submitter');

    const res = await postJson({
      name,
      message: 'Saved my jam',
      attending: 'yes',
      favoriteSong: songData
    }, ip);

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.entry.name).toBe(name);
    expect(result.entry.favoriteSong).toMatchObject(songData);
  });

  test('returns the stored song fields in the RSVP list', async () => {
    const ip = uniqueIp();
    const name = uniqueName('Song Lister');

    await postJson({ name, attending: 'yes', favoriteSong: songData }, ip);

    const listRes = await fetch(`${BASE}/api/rsvp`);
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    const saved = list.rsvps.find((r: { name: string }) => r.name === name);

    expect(saved).toBeDefined();
    expect(saved.song_title).toBe(songData.title);
    expect(saved.song_artist).toBe(songData.artist);
    expect(Number(saved.song_year)).toBe(songData.year);
    expect(saved.song_spotify_url).toBe(songData.spotifyUrl);
    expect(saved.song_spotify_id).toBe(songData.spotifyId);
    expect(saved.song_album_art_url).toBe(songData.albumArtUrl);
  });

  test('accepts an RSVP with no song', async () => {
    const ip = uniqueIp();
    const name = uniqueName('No Song');

    const res = await postJson({ name, attending: 'yes', favoriteSong: null }, ip);

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.entry.favoriteSong).toBeNull();
  });

  test('degrades a malformed favoriteSong to null instead of rejecting the RSVP', async () => {
    const ip = uniqueIp();
    const name = uniqueName('Bad Song Shape');

    const res = await postJson({ name, attending: 'yes', favoriteSong: 'not an object' }, ip);

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.entry.favoriteSong).toBeNull();
  });

  test('rejects a missing name with 400', async () => {
    const res = await postJson({ attending: 'yes', favoriteSong: songData }, uniqueIp());
    expect(res.status).toBe(400);
  });

  test('rejects a non-JSON body with 400, not 500', async () => {
    const res = await postJson('this is not json {', uniqueIp());
    expect(res.status).toBe(400);
  });
});
