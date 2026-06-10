import { test, expect } from '@playwright/test';

const uniqueName = () => `E2E Selector ${Date.now() % 100000}`;

async function openModalAndSearch(page) {
  await page.goto('/');
  await page.click('#rsvp-btn');
  await expect(page.locator('#rsvp-modal')).not.toHaveClass(/hidden/);
  await page.fill('#spotify-search', 'dancing queen');
  await page.waitForSelector('#spotify-results li');
}

test.describe('combobox selected state', () => {
  test('clicking a result swaps the input for the rendered selected card', async ({ page }) => {
    await openModalAndSearch(page);

    await page.locator('#spotify-results li').first().click();

    const card = page.locator('.spotify-selected-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Dancing Queen');
    await expect(card).toContainText('ABBA');
    await expect(card.locator('button[aria-label="Clear selected song"]')).toBeVisible();
    await expect(page.locator('.spotify-input-wrapper')).toBeHidden();
  });

  test('a slow press-and-hold click still selects', async ({ page }) => {
    await openModalAndSearch(page);

    const item = page.locator('#spotify-results li').first();
    const box = await item.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(250);
    await page.mouse.up();

    await expect(page.locator('.spotify-selected-card')).toBeVisible();
  });

  test('the clear button restores the editable input and empties the value', async ({ page }) => {
    await openModalAndSearch(page);
    await page.locator('#spotify-results li').first().click();

    await page.click('button[aria-label="Clear selected song"]');

    await expect(page.locator('.spotify-selected-card')).toHaveCount(0);
    const wrapper = page.locator('.spotify-input-wrapper');
    await expect(wrapper).toBeVisible();
    await expect(page.locator('#spotify-search')).toBeFocused();
    await expect(page.locator('#favoriteSong-value')).toHaveValue('');
  });

  test('selecting a song enables submit and the RSVP round-trips with song data', async ({ page }) => {
    const name = uniqueName();
    await page.goto('/');
    await page.click('#rsvp-btn');
    await expect(page.locator('#rsvp-modal')).not.toHaveClass(/hidden/);

    await page.fill('#rsvp-name-input', name);
    await page.click('.attending-option:has(input[value="yes"])');

    await page.fill('#spotify-search', 'dancing queen');
    await page.waitForSelector('#spotify-results li');
    await page.locator('#spotify-results li').first().click();

    const submit = page.locator('#rsvp-submit');
    await expect(submit).toBeEnabled();

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/rsvp') && r.request().method() === 'POST'),
      submit.click()
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.entry.favoriteSong).toMatchObject({
      title: 'Dancing Queen',
      artist: 'ABBA'
    });
  });

  test('exactly one form control is named favoriteSong after enhancement', async ({ page }) => {
    await page.goto('/');
    await page.click('#rsvp-btn');
    const namedCount = await page.evaluate(() => {
      const form = document.getElementById('rsvp-form') as HTMLFormElement;
      const named = form.elements.namedItem('favoriteSong');
      return named instanceof Element ? 1 : (named as RadioNodeList).length;
    });
    expect(namedCount).toBe(1);
  });
});
