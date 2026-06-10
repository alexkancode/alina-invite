import { test, expect } from '@playwright/test';

test.describe('attending pill toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#rsvp-btn');
    await expect(page.locator('#rsvp-modal')).not.toHaveClass(/hidden/);
  });

  test('renders one pill with two halves and hidden radio inputs', async ({ page }) => {
    await expect(page.locator('.attending-toggle')).toHaveCount(1);
    await expect(page.locator('.attending-option')).toHaveCount(2);

    const inputsHidden = await page.$$eval('.attending-input', els =>
      els.every(el => getComputedStyle(el).opacity === '0'));
    expect(inputsHidden).toBe(true);
  });

  test('clicking the halves selects exclusively at the radio level', async ({ page }) => {
    await page.click('.attending-option:has(input[value="no"])');
    await expect(page.locator('input[name="attending"][value="no"]')).toBeChecked();
    await expect(page.locator('input[name="attending"][value="yes"]')).not.toBeChecked();

    await page.click('.attending-option:has(input[value="yes"])');
    await expect(page.locator('input[name="attending"][value="yes"]')).toBeChecked();
    await expect(page.locator('input[name="attending"][value="no"]')).not.toBeChecked();
  });

  test('the selected half changes its fill', async ({ page }) => {
    const yesHalf = page.locator('.attending-option:has(input[value="yes"])');
    const before = await yesHalf.evaluate(el => getComputedStyle(el).backgroundColor);

    await yesHalf.click();

    await expect(async () => {
      const after = await yesHalf.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(after).toBe('rgb(255, 182, 217)');
      expect(after).not.toBe(before);
    }).toPass({ timeout: 3000 });
  });

  test('selecting a side participates in submit enablement', async ({ page }) => {
    const submit = page.locator('#rsvp-submit');
    await page.fill('#rsvp-name-input', `Pill Tester ${Date.now() % 100000}`);
    await expect(submit).toBeDisabled();

    await page.click('.attending-option:has(input[value="yes"])');

    await expect(submit).toBeEnabled();
  });
});
