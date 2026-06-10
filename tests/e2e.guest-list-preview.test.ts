import { test, expect } from '@playwright/test';

const seededName = `Preview Guest ${Date.now() % 100000}`;

test.describe('guest list song preview', () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/rsvp', {
      headers: { 'x-forwarded-for': `10.77.0.${Date.now() % 250}` },
      data: {
        name: seededName,
        attending: 'yes',
        favoriteSong: {
          title: 'Dancing Queen',
          artist: 'ABBA',
          year: 1976,
          spotifyUrl: 'https://open.spotify.com/track/0GjEhVFGZW8afUYGChu3Rr',
          spotifyId: '0GjEhVFGZW8afUYGChu3Rr',
          albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27370f7a1b35d5165c85b95a0e0'
        }
      }
    });
    expect(response.status()).toBe(200);
  });

  test('a guest with a song shows the song line and play button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-entry');

    const entry = page.locator('.guest-entry', { hasText: seededName });
    await expect(entry.locator('.guest-song-line')).toContainText('Dancing Queen');
    await expect(entry.locator('.guest-song-line')).not.toContainText('ABBA');
    await expect(entry.locator('.guest-song-play')).toHaveCount(1);

    const background = await entry.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(background).toContain('i.scdn.co');
    expect(background).toContain('linear-gradient');

    const nameSize = await entry.locator('.guest-name').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    const songSize = await entry.locator('.guest-song-line').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(nameSize).toBeGreaterThanOrEqual(21);
    expect(songSize).toBeGreaterThanOrEqual(16);

    const listWidth = await page.locator('#rsvp-guest-list').evaluate(el => el.getBoundingClientRect().width);
    expect(listWidth).toBeGreaterThan(900);
  });

  test('the list is a fixed dock pinned to the viewport bottom', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-entry');

    const dock = page.locator('#rsvp-guest-list');
    const before = await dock.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { position: getComputedStyle(el).position, bottomGap: Math.round(window.innerHeight - r.bottom), height: r.height };
    });
    expect(before.position).toBe('fixed');
    expect(Math.abs(before.bottomGap)).toBeLessThanOrEqual(1);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const after = await dock.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { bottomGap: Math.round(window.innerHeight - r.bottom), heightRatio: r.height / window.innerHeight };
    });
    expect(Math.abs(after.bottomGap)).toBeLessThanOrEqual(1);
    expect(after.heightRatio).toBeLessThanOrEqual(0.4);
  });

  test('clicking the entry play button leaves the idle state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-entry');

    const button = page.locator('.guest-entry', { hasText: seededName }).locator('.guest-song-play');
    await button.click();

    await expect(async () => {
      const text = (await button.textContent())?.trim();
      const unavailable = await button.evaluate(el => el.classList.contains('spotify-preview-unavailable'));
      expect(text === '⏸' || unavailable).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('a guest without a song renders without a play button', async ({ page, request }) => {
    const noSongName = `No Song Guest ${Date.now() % 100000}`;
    await request.post('/api/rsvp', {
      headers: { 'x-forwarded-for': `10.78.0.${Date.now() % 250}` },
      data: { name: noSongName, attending: 'no', favoriteSong: null }
    });

    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-entry');

    const entry = page.locator('.guest-entry', { hasText: noSongName });
    await expect(entry).toHaveCount(1);
    await expect(entry.locator('.guest-song-play')).toHaveCount(0);
  });

  test('the play all button starts the first card and toggles to stop', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-song-play');

    const playAll = page.locator('#guest-play-all');
    await expect(playAll).toBeVisible();
    await expect(playAll).toHaveText('Play all');

    await playAll.click();

    await expect(playAll).toHaveAttribute('data-playlist-state', 'running');
    await expect(playAll).toHaveText('Stop');
    await expect(async () => {
      const playing = await page.locator('.guest-song-play[data-preview-state="playing"]').count();
      expect(playing).toBe(1);
    }).toPass({ timeout: 15000 });

    await playAll.click();

    await expect(playAll).toHaveAttribute('data-playlist-state', 'idle');
    await expect(playAll).toHaveText('Play all');
    await expect(page.locator('.guest-song-play[data-preview-state="playing"]')).toHaveCount(0);
  });

  test('a guest name containing HTML renders as text, not elements', async ({ page, request }) => {
    const stamp = `${Date.now() % 100000}`;
    const xssName = `<b data-xss-probe>Bold ${stamp}</b>`;
    await request.post('/api/rsvp', {
      headers: { 'x-forwarded-for': `10.79.0.${Date.now() % 250}` },
      data: { name: xssName, attending: 'yes', favoriteSong: null }
    });

    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-entry');

    await expect(page.locator('[data-xss-probe]')).toHaveCount(0);
    await expect(page.locator('.guest-name', { hasText: `Bold ${stamp}` })).toContainText('<b');
  });
});
