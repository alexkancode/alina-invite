import { beforeAll, describe, expect, test } from 'vitest';
import { FRY_COUNT, WAVE_EDGE_PATH } from '../../src/lib/yait/heroScene';

const BASE = 'http://localhost:4321';

let homeHtml = '';

beforeAll(async () => {
  try {
    await fetch(BASE);
  } catch {
    throw new Error('Dev server not running. Start it with: npm run dev');
  }
});

describe('GET /home', () => {
  test('serves the yait landing page', async () => {
    const res = await fetch(`${BASE}/home`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    homeHtml = await res.text();
  });

  test('renders all four headline words', () => {
    for (const word of ['You', 'Are', 'Invited', 'To']) {
      expect(homeHtml).toContain(`>${word}<`);
    }
  });

  test('renders the full fry crowd', () => {
    const fries = homeHtml.match(/class="fry"/g) ?? [];
    expect(fries).toHaveLength(FRY_COUNT);
  });

  test('renders the envelope, tagline, and CTA', () => {
    expect(homeHtml).toContain('data-testid="envelope"');
    expect(homeHtml).toContain('join the yait club');
    expect(homeHtml).toContain('data-testid="join-cta"');
  });

  test('loads Shrikhand for the headline', () => {
    expect(homeHtml).toContain('Shrikhand');
  });

  test('ships the generated wave clip', () => {
    expect(homeHtml).toContain('id="yait-wave-clip"');
    expect(homeHtml).toContain(WAVE_EDGE_PATH.slice(0, 60));
  });

  test('the envelope is open with one broken seal on the flap', () => {
    expect(homeHtml).toContain('class="envelope-flap"');
    expect(homeHtml.match(/class="seal"/g)).toHaveLength(1);
    const flapIndex = homeHtml.indexOf('class="envelope-flap"');
    const friesIndex = homeHtml.indexOf('class="fries"');
    const artIndex = homeHtml.indexOf('class="envelope-art"');
    expect(flapIndex).toBeGreaterThan(-1);
    expect(flapIndex).toBeLessThan(friesIndex);
    expect(friesIndex).toBeLessThan(artIndex);
  });

  test('unknown sibling routes still 404', async () => {
    const res = await fetch(`${BASE}/homex`);
    expect(res.status).toBe(404);
  });
});

describe('live birthday site regression guard', () => {
  test('the invite page still serves with its RSVP form', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('name="favoriteSong"');
  });

  test('the API health check still passes', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
