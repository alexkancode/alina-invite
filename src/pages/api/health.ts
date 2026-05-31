import type { APIRoute } from 'astro';
import pool from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    await pool.query('SELECT 1');
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ status: 'error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
