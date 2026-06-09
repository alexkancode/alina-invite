import { test, expect } from '@playwright/test';

async function openModalAndSearch(page) {
  await page.goto('/');
  await page.click('#rsvp-btn');
  await expect(page.locator('#rsvp-modal')).not.toHaveClass(/hidden/);
  await page.fill('#spotify-search', 'dancing queen');
  await page.waitForSelector('#spotify-results li');
}

test.describe('song preview playback', () => {
  test('every dropdown row renders a play button with track data', async ({ page }) => {
    await openModalAndSearch(page);

    const rows = page.locator('#spotify-results li');
    const buttons = page.locator('#spotify-results .spotify-play-button');
    expect(await buttons.count()).toBe(await rows.count());

    const first = buttons.first();
    await expect(first).toHaveAttribute('data-title', /.+/);
    await expect(first).toHaveAttribute('data-artist', /.+/);
  });

  test('clicking play resolves a preview and leaves the idle state', async ({ page }) => {
    await openModalAndSearch(page);

    const button = page.locator('#spotify-results .spotify-play-button').first();
    await button.click();

    await expect(async () => {
      const text = (await button.textContent())?.trim();
      const unavailable = await button.evaluate(el => el.classList.contains('spotify-preview-unavailable'));
      expect(text === '⏸' || unavailable).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('clicking play does not select the track', async ({ page }) => {
    await openModalAndSearch(page);

    await page.locator('#spotify-results .spotify-play-button').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('.spotify-selected-card')).toHaveCount(0);
    await expect(page.locator('#favoriteSong-value')).toHaveValue('');
  });

  test('the selected card also carries a play button', async ({ page }) => {
    await openModalAndSearch(page);

    await page.locator('#spotify-results li').first().click();
    await page.waitForSelector('.spotify-selected-card');

    await expect(page.locator('.spotify-selected-card .spotify-play-button')).toHaveCount(1);
  });
});
