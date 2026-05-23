import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4321';

test.describe('Page content', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle("You're Invited");
  });

  test('displays event details without labels', async ({ page }) => {
    await page.goto(BASE);
    // Details should be present as plain text, not prefixed with labels
    await expect(page.getByText('July 11th, 2026')).toBeVisible();
    await expect(page.getByText('6:00 PM')).toBeVisible();
    await expect(page.getByText('The Design Studio, 742 Evergreen Terrace')).toBeVisible();

    // No labels like "Date:", "Time:", "Location:" should exist
    const body = await page.textContent('body');
    expect(body).not.toContain('Date:');
    expect(body).not.toContain('Time:');
    expect(body).not.toContain('Location:');
  });

  test('displays date as hero heading and purpose statement', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('July 11th, 2026');
    await expect(page.getByText('invited to celebrate')).toBeVisible();
  });
});

test.describe('Google Maps embed', () => {
  test('map iframe is present with correct attributes', async ({ page }) => {
    await page.goto(BASE);
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('google.com/maps/embed');
    expect(await iframe.getAttribute('loading')).toBe('lazy');
    expect(await iframe.getAttribute('allowfullscreen')).not.toBeNull();
  });

  test('map container uses golden ratio aspect ratio', async ({ page }) => {
    await page.goto(BASE);
    const mapSection = page.locator('iframe').locator('..');
    const style = await mapSection.getAttribute('style');
    expect(style).toContain('1.618');
  });
});

test.describe('RSVP modal — happy paths', () => {
  test('RSVP button opens modal', async ({ page }) => {
    await page.goto(BASE);
    const modal = page.locator('#rsvp-modal');
    await expect(modal).toBeHidden();
    await page.click('#rsvp-btn');
    await expect(modal).toBeVisible();
  });

  test('cancel button closes modal', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');
    await expect(page.locator('#rsvp-modal')).toBeVisible();
    // force: true bypasses Astro dev toolbar overlay (dev-only artifact)
    await page.click('#modal-close', { force: true });
    await expect(page.locator('#rsvp-modal')).toBeHidden();
  });

  test('clicking backdrop closes modal', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');
    await expect(page.locator('#rsvp-modal')).toBeVisible();
    // Click the overlay (not the form panel)
    await page.locator('#rsvp-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#rsvp-modal')).toBeHidden();
  });

  test('submitting valid RSVP shows success message', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');

    await page.fill('input[name="name"]', 'E2E Tester');
    await page.fill('textarea[name="message"]', 'Looking forward to it!');
    await page.click('input[name="attending"][value="yes"]');
    await page.click('#rsvp-form button[type="submit"]');

    await expect(page.getByText('Far out!')).toBeVisible();
    await expect(page.getByText('Your response has been recorded.')).toBeVisible();
  });

  test('success close button resets modal for next use', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');

    await page.fill('input[name="name"]', 'Reset Tester');
    await page.click('input[name="attending"][value="no"]');
    await page.click('#rsvp-form button[type="submit"]');

    await expect(page.getByText('Far out!')).toBeVisible();
    await page.click('#success-close');
    await expect(page.locator('#rsvp-modal')).toBeHidden();

    // Reopen — form should be visible and empty
    await page.click('#rsvp-btn');
    await expect(page.locator('#rsvp-form')).toBeVisible();
    expect(await page.inputValue('input[name="name"]')).toBe('');
  });

  test('RSVP with "no" attendance works', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');

    await page.fill('input[name="name"]', 'Decline Tester');
    await page.click('input[name="attending"][value="no"]');
    await page.click('#rsvp-form button[type="submit"]');

    await expect(page.getByText('Far out!')).toBeVisible();
  });
});

test.describe('RSVP modal — unhappy paths', () => {
  test('form prevents submission without name (HTML validation)', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');

    // Don't fill name, just select attendance and try to submit
    await page.click('input[name="attending"][value="yes"]');
    await page.click('#rsvp-form button[type="submit"]');

    // Modal should still be open with form visible (not success)
    await expect(page.locator('#rsvp-form')).toBeVisible();
    await expect(page.getByText('Far out!')).toBeHidden();
  });

  test('form prevents submission without attendance selection (HTML validation)', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');

    await page.fill('input[name="name"]', 'No Attendance Tester');
    await page.click('#rsvp-form button[type="submit"]');

    // Modal should still be open with form visible
    await expect(page.locator('#rsvp-form')).toBeVisible();
    await expect(page.getByText('Far out!')).toBeHidden();
  });

  test('message field is optional — form submits without it', async ({ page }) => {
    await page.goto(BASE);
    await page.click('#rsvp-btn');

    await page.fill('input[name="name"]', 'No Message Tester');
    // Leave message empty
    await page.click('input[name="attending"][value="yes"]');
    await page.click('#rsvp-form button[type="submit"]');

    await expect(page.getByText('Far out!')).toBeVisible();
  });
});

test.describe('Calendar link', () => {
  test('calendar link points to Google Calendar with correct parameters', async ({ page }) => {
    await page.goto(BASE);
    const calLink = page.locator('#cal-btn');
    const href = await calLink.getAttribute('href');

    expect(href).toContain('calendar.google.com/calendar/render');
    expect(href).toContain('action=TEMPLATE');
    expect(href).toContain('Birthday+Celebration');
    expect(href).toContain('dates=');
    expect(href).toContain('location=');
    expect(href).toContain('ctz=America/New_York');
  });

  test('calendar link opens in new tab', async ({ page }) => {
    await page.goto(BASE);
    const calLink = page.locator('#cal-btn');
    expect(await calLink.getAttribute('target')).toBe('_blank');
    expect(await calLink.getAttribute('rel')).toContain('noopener');
  });

  test('calendar link has accessible label', async ({ page }) => {
    await page.goto(BASE);
    const calLink = page.locator('#cal-btn');
    const ariaLabel = await calLink.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Google Calendar');
  });

  test('calendar link is an anchor tag, not a button (zero JS)', async ({ page }) => {
    await page.goto(BASE);
    const tagName = await page.locator('#cal-btn').evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('a');
  });

  test('calendar link includes calendar icon', async ({ page }) => {
    await page.goto(BASE);
    const svg = page.locator('#cal-btn svg');
    await expect(svg).toBeVisible();
  });
});

test.describe('Golden ratio design tokens', () => {
  test('content container uses golden ratio max-width (791px)', async ({ page }) => {
    await page.goto(BASE);
    const main = page.locator('main');
    const maxWidth = await main.evaluate(el => getComputedStyle(el).maxWidth);
    expect(maxWidth).toBe('791px');
  });

  test('golden ratio spacing tokens are applied', async ({ page }) => {
    await page.goto(BASE);
    const phiLg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--spacing-phi-lg').trim()
    );
    expect(phiLg).toBe('21px');
  });

  test('62/38 golden ratio grid layout exists', async ({ page }) => {
    await page.goto(BASE);
    const grid = page.locator('[style*="1fr 0.618fr"]');
    await expect(grid).toBeVisible();
  });
});

test.describe('Disco design system', () => {
  test('disco color palette is defined', async ({ page }) => {
    await page.goto(BASE);
    const colors = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        gold: style.getPropertyValue('--color-disco-gold').trim(),
        hotPink: style.getPropertyValue('--color-hot-pink').trim(),
        deepPurple: style.getPropertyValue('--color-deep-purple').trim(),
        turquoise: style.getPropertyValue('--color-turquoise').trim(),
        metallic: style.getPropertyValue('--color-metallic-silver').trim(),
      };
    });
    expect(colors.gold).toBeTruthy();
    expect(colors.hotPink).toBeTruthy();
    expect(colors.deepPurple).toBeTruthy();
    expect(colors.turquoise).toBeTruthy();
    expect(colors.metallic).toBeTruthy();
  });

  test('shadow elevation system is defined', async ({ page }) => {
    await page.goto(BASE);
    const shadowLow = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--shadow-elevation-low').trim()
    );
    expect(shadowLow).toBeTruthy();
  });

  test('RSVP button has bold border', async ({ page }) => {
    await page.goto(BASE);
    const borderWidth = await page.locator('#rsvp-btn').evaluate(el =>
      getComputedStyle(el).borderWidth
    );
    expect(borderWidth).toBe('3px');
  });

  test('decorative background layers are present', async ({ page }) => {
    await page.goto(BASE);
    const decorative = page.locator('.fixed.pointer-events-none');
    const count = await decorative.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('dual-color lighting gradients on body', async ({ page }) => {
    await page.goto(BASE);
    const bgStyle = await page.locator('body').getAttribute('style');
    expect(bgStyle).toContain('radial-gradient');
    expect(bgStyle).toContain('280');  // purple hue
    expect(bgStyle).toContain('35');   // gold hue
  });

  test('disco ball motif is present', async ({ page }) => {
    await page.goto(BASE);
    const discoBall = page.locator('[style*="conic-gradient"]');
    await expect(discoBall).toBeVisible();
  });

  test('sparkle SVGs are present for decoration', async ({ page }) => {
    await page.goto(BASE);
    const sparkles = page.locator('.sparkle');
    const count = await sparkles.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('mouse parallax layers exist with depth data', async ({ page }) => {
    await page.goto(BASE);
    const layers = page.locator('.sparkle-layer[data-depth]');
    const count = await layers.count();
    expect(count).toBe(3);
  });

  test('disco stripe bands are present as dividers', async ({ page }) => {
    await page.goto(BASE);
    const stripes = page.locator('.disco-stripes');
    const count = await stripes.count();
    expect(count).toBe(2);
  });
});

test.describe('Buttons are present', () => {
  test('RSVP and Add to Calendar buttons are visible', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#rsvp-btn')).toBeVisible();
    await expect(page.locator('#cal-btn')).toBeVisible();
    await expect(page.locator('#rsvp-btn')).toHaveText('RSVP');
    await expect(page.locator('#cal-btn')).toContainText('Save the Date');
  });
});
