import type { APIRoute } from 'astro';
import pool from '../../lib/db';

export const prerender = false;

function calcScore(moves: number, timeMs: number, pairs: number): number {
  const moveEff = pairs / moves;
  const timeEff = Math.min(1, 120_000 / timeMs);
  return Math.min(10_000, Math.round((moveEff * 0.6 + timeEff * 0.4) * 10_000));
}

const PAIRS: Record<string, number> = { easy: 6, medium: 8, hard: 12 };

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { player, moves, timeMs, difficulty } = body;

  if (!player || typeof player !== 'string' || player.length > 30) {
    return new Response(JSON.stringify({ error: 'Invalid player name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!PAIRS[difficulty]) {
    return new Response(JSON.stringify({ error: 'Invalid difficulty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof moves !== 'number' || moves < 1 || !Number.isFinite(moves)
    || typeof timeMs !== 'number' || timeMs < 3000 || !Number.isFinite(timeMs)) {
    return new Response(JSON.stringify({ error: 'Invalid game data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const intMoves = Math.floor(moves);
  const intTimeMs = Math.round(timeMs);

  // Postgres INTEGER range: -2147483648 to 2147483647
  if (intMoves > 2_147_483_647 || intTimeMs > 2_147_483_647) {
    return new Response(JSON.stringify({ error: 'Invalid game data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const score = calcScore(intMoves, intTimeMs, PAIRS[difficulty]);

  await pool.query(
    'INSERT INTO leaderboard (player, score, moves, time_ms, difficulty) VALUES ($1, $2, $3, $4, $5)',
    [player.trim(), score, intMoves, intTimeMs, difficulty]
  );

  return new Response(JSON.stringify({ score }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ url }) => {
  const difficulty = url.searchParams.get('difficulty') || 'medium';
  const rawLimit = Number(url.searchParams.get('limit') || 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 50) : 10;

  if (!PAIRS[difficulty]) {
    return new Response(JSON.stringify({ error: 'Invalid difficulty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { rows } = await pool.query(
    'SELECT player, score, moves, time_ms, difficulty, created_at FROM leaderboard WHERE difficulty = $1 ORDER BY score DESC LIMIT $2',
    [difficulty, limit]
  );

  return new Response(JSON.stringify(rows), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
};
