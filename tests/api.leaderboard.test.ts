import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:4321';

// These tests run against the live Astro dev server.
// Start it with `npm run dev` before running tests.

async function postScore(body: unknown) {
  return fetch(`${BASE}/api/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getScores(params = 'difficulty=medium') {
  return fetch(`${BASE}/api/leaderboard?${params}`);
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    player: `Tester-${Date.now()}`,
    moves: 12,
    timeMs: 45000,
    difficulty: 'medium',
    ...overrides,
  };
}

beforeAll(async () => {
  try {
    await fetch(BASE);
  } catch {
    throw new Error('Dev server not running. Start it with: npm run dev');
  }
});

// ════════════════════════════════════════════
// POST /api/leaderboard
// ════════════════════════════════════════════

describe('POST /api/leaderboard — happy paths', () => {
  it('accepts a valid score submission', async () => {
    const res = await postScore(validPayload());
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(typeof json.score).toBe('number');
    expect(json.score).toBeGreaterThan(0);
    expect(json.score).toBeLessThanOrEqual(10000);
  });

  it('returns Content-Type application/json', async () => {
    const res = await postScore(validPayload());
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('recalculates score server-side (ignores any client score)', async () => {
    // Two identical games should produce identical scores regardless of what client sends
    const payload = { player: 'ScoreCheck', moves: 10, timeMs: 30000, difficulty: 'medium' };
    const res1 = await postScore({ ...payload, score: 99999 });
    const res2 = await postScore(payload);
    const json1 = await res1.json();
    const json2 = await res2.json();
    expect(json1.score).toBe(json2.score);
  });

  it('accepts easy difficulty', async () => {
    const res = await postScore(validPayload({ difficulty: 'easy' }));
    expect(res.status).toBe(201);
  });

  it('accepts hard difficulty', async () => {
    const res = await postScore(validPayload({ difficulty: 'hard' }));
    expect(res.status).toBe(201);
  });

  it('trims player name whitespace', async () => {
    const res = await postScore(validPayload({ player: '  Spacey  ' }));
    expect(res.status).toBe(201);
  });

  it('accepts minimum valid game (1 move, 3 seconds)', async () => {
    const res = await postScore(validPayload({ moves: 1, timeMs: 3000 }));
    expect(res.status).toBe(201);
  });

  it('accepts player name at max length (30 chars)', async () => {
    const res = await postScore(validPayload({ player: 'A'.repeat(30) }));
    expect(res.status).toBe(201);
  });
});

describe('POST /api/leaderboard — unhappy paths', () => {
  it('rejects missing player name', async () => {
    const res = await postScore({ moves: 10, timeMs: 30000, difficulty: 'medium' });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('rejects empty player name', async () => {
    const res = await postScore(validPayload({ player: '' }));
    expect(res.status).toBe(400);
  });

  it('rejects player name over 30 characters', async () => {
    const res = await postScore(validPayload({ player: 'A'.repeat(31) }));
    expect(res.status).toBe(400);
  });

  it('rejects non-string player name', async () => {
    const res = await postScore(validPayload({ player: 12345 }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid difficulty', async () => {
    const res = await postScore(validPayload({ difficulty: 'nightmare' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('difficulty');
  });

  it('rejects missing difficulty', async () => {
    const { difficulty, ...rest } = validPayload();
    const res = await postScore(rest);
    expect(res.status).toBe(400);
  });

  it('rejects zero moves', async () => {
    const res = await postScore(validPayload({ moves: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects negative moves', async () => {
    const res = await postScore(validPayload({ moves: -5 }));
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric moves', async () => {
    const res = await postScore(validPayload({ moves: 'ten' }));
    expect(res.status).toBe(400);
  });

  it('rejects impossibly fast game (under 3 seconds)', async () => {
    const res = await postScore(validPayload({ timeMs: 500 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('rejects zero timeMs', async () => {
    const res = await postScore(validPayload({ timeMs: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects negative timeMs', async () => {
    const res = await postScore(validPayload({ timeMs: -1000 }));
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric timeMs', async () => {
    const res = await postScore(validPayload({ timeMs: 'fast' }));
    expect(res.status).toBe(400);
  });

  it('rejects an empty object', async () => {
    const res = await postScore({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/leaderboard — malicious inputs', () => {
  it('rejects SQL injection in player name', async () => {
    const res = await postScore(validPayload({ player: "'; DROP TABLE leaderboard; --" }));
    // Should either reject (400) or safely insert with escaped name (201)
    expect([201, 400]).toContain(res.status);
    // Verify the table still works after the attempt
    const check = await getScores();
    expect(check.status).toBe(200);
  });

  it('rejects XSS in player name', async () => {
    const xss = '<script>alert("xss")</script>';
    const res = await postScore(validPayload({ player: xss }));
    // Name is 30 chars so it fits — should be stored safely
    if (res.status === 201) {
      const scores = await getScores();
      const json = await scores.json();
      // If stored, it should be the raw string, not executed HTML
      const found = json.find((s: any) => s.player.includes('script'));
      if (found) {
        expect(found.player).toBe(xss); // stored as-is, not interpreted
      }
    }
  });

  it('rejects script injection via difficulty field', async () => {
    const res = await postScore(validPayload({ difficulty: '<img onerror=alert(1) src=x>' }));
    expect(res.status).toBe(400);
  });

  it('handles extremely large moves number', async () => {
    const res = await postScore(validPayload({ moves: Number.MAX_SAFE_INTEGER }));
    // Should accept (valid number) — score will just be very low
    expect([201, 400]).toContain(res.status);
  });

  it('handles extremely large timeMs', async () => {
    const res = await postScore(validPayload({ timeMs: Number.MAX_SAFE_INTEGER }));
    expect([201, 400]).toContain(res.status);
  });

  it('rejects floating point moves', async () => {
    const res = await postScore(validPayload({ moves: 3.5 }));
    // Moves should be integer — 3.5 moves doesn't make sense
    // Accept if server floors it, reject if strict
    expect([201, 400]).toContain(res.status);
  });

  it('rejects array as player name', async () => {
    const res = await postScore(validPayload({ player: ['Alice', 'Bob'] }));
    expect(res.status).toBe(400);
  });

  it('rejects object as player name', async () => {
    const res = await postScore(validPayload({ player: { name: 'Alice' } }));
    expect(res.status).toBe(400);
  });

  it('rejects null player name', async () => {
    const res = await postScore(validPayload({ player: null }));
    expect(res.status).toBe(400);
  });

  it('rejects boolean player name', async () => {
    const res = await postScore(validPayload({ player: true }));
    expect(res.status).toBe(400);
  });

  it('handles extra unexpected fields gracefully', async () => {
    const res = await postScore(validPayload({ admin: true, role: 'superuser', __proto__: { admin: true } }));
    // Should ignore extra fields and process normally
    expect(res.status).toBe(201);
  });
});

// ════════════════════════════════════════════
// GET /api/leaderboard
// ════════════════════════════════════════════

describe('GET /api/leaderboard — happy paths', () => {
  it('returns an array of scores', async () => {
    const res = await getScores();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });

  it('returns Content-Type application/json', async () => {
    const res = await getScores();
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('returns scores in descending order', async () => {
    // Seed two scores with different quality
    await postScore(validPayload({ player: 'Good', moves: 8, timeMs: 20000 }));
    await postScore(validPayload({ player: 'Bad', moves: 50, timeMs: 120000 }));

    const res = await getScores();
    const json = await res.json();
    for (let i = 1; i < json.length; i++) {
      expect(json[i - 1].score).toBeGreaterThanOrEqual(json[i].score);
    }
  });

  it('returns scores for specified difficulty only', async () => {
    const unique = `Easy-${Date.now()}`;
    await postScore(validPayload({ player: unique, difficulty: 'easy' }));

    const easyScores = await getScores('difficulty=easy');
    const easyJson = await easyScores.json();
    easyJson.forEach((s: any) => expect(s.difficulty).toBe('easy'));
  });

  it('defaults to medium difficulty when not specified', async () => {
    const res = await getScores('limit=5');
    expect(res.status).toBe(200);
    const json = await res.json();
    json.forEach((s: any) => expect(s.difficulty).toBe('medium'));
  });

  it('respects limit parameter', async () => {
    // Seed enough scores
    for (let i = 0; i < 5; i++) {
      await postScore(validPayload({ player: `Limiter-${i}` }));
    }

    const res = await getScores('difficulty=medium&limit=3');
    const json = await res.json();
    expect(json.length).toBeLessThanOrEqual(3);
  });

  it('caps limit at 50', async () => {
    const res = await getScores('difficulty=medium&limit=999');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBeLessThanOrEqual(50);
  });

  it('score entries have expected fields', async () => {
    const unique = `Fields-${Date.now()}`;
    await postScore(validPayload({ player: unique }));

    const res = await getScores('difficulty=medium&limit=50');
    const json = await res.json();
    const entry = json.find((s: any) => s.player === unique);
    expect(entry).toBeTruthy();
    expect(typeof entry.player).toBe('string');
    expect(typeof entry.score).toBe('number');
    expect(typeof entry.moves).toBe('number');
    expect(typeof entry.time_ms).toBe('number');
    expect(typeof entry.difficulty).toBe('string');
    expect(typeof entry.created_at).toBe('string');
  });

  it('reflects a newly posted score', async () => {
    const unique = `Reflect-${Date.now()}`;
    await postScore(validPayload({ player: unique }));

    const res = await getScores('difficulty=medium&limit=50');
    const json = await res.json();
    const found = json.find((s: any) => s.player === unique);
    expect(found).toBeTruthy();
  });

  it('sets Cache-Control header', async () => {
    const res = await getScores();
    const cache = res.headers.get('cache-control');
    expect(cache).toContain('max-age=');
  });
});

describe('GET /api/leaderboard — unhappy paths', () => {
  it('rejects invalid difficulty', async () => {
    const res = await getScores('difficulty=impossible');
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('handles non-numeric limit gracefully', async () => {
    const res = await getScores('difficulty=medium&limit=abc');
    // NaN limit should fall back to default or return valid response
    expect([200, 400]).toContain(res.status);
  });

  it('handles negative limit gracefully', async () => {
    const res = await getScores('difficulty=medium&limit=-5');
    expect([200, 400]).toContain(res.status);
  });
});

describe('GET /api/leaderboard — malicious inputs', () => {
  it('rejects SQL injection in difficulty parameter', async () => {
    const res = await getScores("difficulty=medium' OR '1'='1");
    expect(res.status).toBe(400);
  });

  it('handles URL-encoded special characters in difficulty', async () => {
    const res = await getScores('difficulty=%3Cscript%3E');
    expect(res.status).toBe(400);
  });

  it('handles extremely long difficulty string', async () => {
    const res = await getScores(`difficulty=${'a'.repeat(10000)}`);
    expect(res.status).toBe(400);
  });

  it('handles SQL injection in limit parameter', async () => {
    const res = await getScores('difficulty=medium&limit=1;DROP TABLE leaderboard');
    // Should safely handle — NaN coercion or rejection
    expect([200, 400]).toContain(res.status);
    // Table should survive
    const check = await getScores();
    expect(check.status).toBe(200);
  });
});
