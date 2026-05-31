import type { APIRoute } from 'astro';
// TODO: Convert to PostgreSQL for Railway deployment
// import { env } from 'cloudflare:workers';

export const prerender = false;

function calcScore(moves: number, timeMs: number, pairs: number): number {
  const moveEff = pairs / moves;
  const timeEff = Math.min(1, 120_000 / timeMs);
  return Math.round((moveEff * 0.6 + timeEff * 0.4) * 10_000);
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

  if (typeof moves !== 'number' || moves < 1 || typeof timeMs !== 'number' || timeMs < 3000) {
    return new Response(JSON.stringify({ error: 'Invalid game data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Server-side score calculation — never trust the client
  const score = calcScore(moves, timeMs, PAIRS[difficulty]);

  // TODO: Implement PostgreSQL database connection for Railway
  // const db = (env as any).DB;
  // await db
  //   .prepare(
  //     'INSERT INTO leaderboard (player, score, moves, time_ms, difficulty) VALUES (?, ?, ?, ?, ?)'
  //   )
  //   .bind(player.trim(), score, moves, Math.round(timeMs), difficulty)
  //   .run();

  console.log('Leaderboard entry (temporarily disabled):', { player: player.trim(), score, moves, timeMs, difficulty });

  return new Response(JSON.stringify({ score }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ url }) => {
  const difficulty = url.searchParams.get('difficulty') || 'medium';
  const limit = Math.min(Number(url.searchParams.get('limit') || 10), 50);

  if (!PAIRS[difficulty]) {
    return new Response(JSON.stringify({ error: 'Invalid difficulty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // TODO: Implement PostgreSQL database connection for Railway
  // const db = (env as any).DB;
  // const { results } = await db
  //   .prepare(
  //     'SELECT player, score, moves, time_ms, difficulty, created_at FROM leaderboard WHERE difficulty = ? ORDER BY score DESC LIMIT ?'
  //   )
  //   .bind(difficulty, limit)
  //   .all();

  // Temporary: return empty leaderboard
  const results: any[] = [];

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
};
