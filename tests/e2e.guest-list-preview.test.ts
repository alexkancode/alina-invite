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
          spotifyId: '0GjEhVFGZW8afUYGChu3Rr'
        }
      }
    });
    expect(response.status()).toBe(200);
  });

  test('a guest with a song shows the song line and play button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#rsvp-guests .guest-entry');

    const entry = page.locator('.guest-entry', { hasText: seededName });
    await expect(entry.locator('.guest-song-line')).toContainText('Dancing Queen - ABBA');
    await expect(entry.locator('.guest-song-play')).toHaveCount(1);
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
