import { test, expect } from '@playwright/test';

test.describe('calendar buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('both calendar buttons render', async ({ page }) => {
    await expect(page.locator('#cal-btn-apple')).toBeVisible();
    await expect(page.locator('#cal-btn-google')).toBeVisible();
  });

  test('the apple button navigates same-tab to the ics with no download attribute', async ({ page }) => {
    const apple = page.locator('#cal-btn-apple');
    await expect(apple).toHaveAttribute('href', '/api/calendar/party.ics');
    expect(await apple.getAttribute('target')).toBeNull();
    expect(await apple.getAttribute('download')).toBeNull();
  });

  test('the ics endpoint serves text/calendar inline', async ({ request }) => {
    const res = await request.get('/api/calendar/party.ics');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/calendar');
    expect(res.headers()['content-disposition']).toContain('inline');
    const body = await res.text();
    expect(body.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(body).not.toContain('ACTION:EMAIL');
  });

  test('the google button opens a new tab with corrected event times', async ({ page }) => {
    const google = page.locator('#cal-btn-google');
    await expect(google).toHaveAttribute('target', '_blank');
    const href = await google.getAttribute('href');
    expect(href).toContain('dates=20260711T200000Z/20260711T230000Z');
    expect(href).not.toContain('ctz=America/New_York');
  });

  test('no click handler hijacks the apple navigation', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/calendar/party.ics')),
      page.click('#cal-btn-apple')
    ]);
    expect(response.status()).toBe(200);
  });
});
