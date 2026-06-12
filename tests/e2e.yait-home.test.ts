import { expect, test } from '@playwright/test';

const DOCKED_AFTER_MS = 6600;

test.describe('yait home hero', () => {
  test('the bay scene and envelope render with the full crowd', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByTestId('hero-bay')).toBeVisible();
    await expect(page.getByTestId('envelope')).toBeVisible();
    await expect(page.locator('.fry')).toHaveCount(9);
    await page.screenshot({ path: '/tmp/yait-home-0s.png' });
  });

  test('the headline reveals fully and the CTA rises once docked', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/yait-home-midsail.png' });
    await page.waitForTimeout(DOCKED_AFTER_MS - 3000);
    for (const word of ['You', 'Are', 'Invited', 'To']) {
      const el = page.locator('.word', { hasText: word }).first();
      await expect(el).toBeVisible();
      expect(Number(await el.evaluate(n => getComputedStyle(n).opacity))).toBe(1);
    }
    await expect(page.getByTestId('join-cta')).toBeVisible();
    await page.screenshot({ path: '/tmp/yait-home-docked.png' });
  });

  test('reduced motion shows the docked scene immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/home');
    for (const word of ['You', 'Are', 'Invited', 'To']) {
      const el = page.locator('.word', { hasText: word }).first();
      expect(Number(await el.evaluate(n => getComputedStyle(n).opacity))).toBe(1);
    }
    await expect(page.getByTestId('join-cta')).toBeVisible();
    await page.screenshot({ path: '/tmp/yait-home-reduced-motion.png' });
  });

  test('the entrance tacks across the waterline', async ({ page }) => {
    await page.goto('/home');
    const transforms = await page.evaluate(() => {
      const weave = document
        .getAnimations({ subtree: true })
        .find(a => 'animationName' in a && a.animationName === 'sail-weave');
      const effect = weave?.effect as KeyframeEffect | undefined;
      return (effect?.getKeyframes() ?? []).map(k => String(k.transform));
    });
    expect(transforms.length).toBeGreaterThanOrEqual(4);
    expect(transforms.some(t => /translateY\((\d+(\.\d+)?)px\)/.test(t) && !t.includes('translateY(0px)'))).toBe(true);
    expect(transforms.some(t => /translateY\(-\d/.test(t))).toBe(true);
  });

  test('the envelope is genuinely mid-bay halfway through the sail', async ({ page }) => {
    await page.goto('/home');
    const matrix = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="envelope"]');
      if (!el) return 'missing';
      for (const a of el.getAnimations()) {
        a.pause();
        a.currentTime = 2500;
      }
      return getComputedStyle(el).transform;
    });
    const parts = matrix.match(/matrix\(([^)]+)\)/);
    expect(parts).not.toBeNull();
    const translateX = Number(parts![1].split(',')[4]);
    expect(translateX).toBeLessThan(-300);
  });

  test('the reveal edge sits at the stern, never ahead of it', async ({ page }) => {
    await page.goto('/home');
    const probes = await page.evaluate(() => {
      const mask = document.querySelector('.line-mask:not(.line-mask-top)');
      const track = document.querySelector('[data-testid="envelope"]');
      if (!mask || !track) return null;
      const sample = (t: number) => {
        for (const a of document.getAnimations({ subtree: true })) {
          a.pause();
          a.currentTime = t;
        }
        return {
          edge: mask!.getBoundingClientRect().right,
          stern: track.getBoundingClientRect().left
        };
      };
      return [sample(1200), sample(2000), sample(3750)];
    });
    expect(probes).not.toBeNull();
    for (const { edge, stern } of probes!) {
      expect(Math.abs(edge - stern)).toBeLessThan(40);
    }
  });

  test('the headline is a left-aligned lockup with the second line indented 100px', async ({ page }) => {
    await page.goto('/home');
    const lines = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.headline-line')];
      return els.map(el => {
        const words = [...el.querySelectorAll('.word')];
        return {
          words: words.map(w => w.textContent?.trim()),
          left: Math.round(words[0].getBoundingClientRect().left)
        };
      });
    });
    expect(lines).toHaveLength(2);
    expect(lines[0].words).toEqual(['You', 'Are']);
    expect(lines[1].words).toEqual(['Invited', 'To']);
    expect(lines[1].left - lines[0].left).toBeGreaterThanOrEqual(95);
    expect(lines[1].left - lines[0].left).toBeLessThanOrEqual(105);
    expect(lines[0].left).toBeLessThan(200);
  });

  test('the reveal edge is a wavy 45-degree slant with a 50px swell', async ({ page }) => {
    await page.goto('/home');
    const probe = await page.evaluate(() => {
      const mask = document.querySelector('.line-mask:not(.line-mask-top)');
      const wave = document.querySelector('#yait-wave-clip path');
      if (!mask || !wave) return null;
      const rect = mask.getBoundingClientRect();
      const d = wave.getAttribute('d') ?? '';
      const startAnchor = d.match(/^M 0 0 L ([\d.]+) 0 /);
      const pts = [
        ...(startAnchor ? [{ x: Number(startAnchor[1]), y: 0 }] : []),
        ...[...d.matchAll(/C (?:-?[\d.]+ ){4}(-?[\d.]+) (-?[\d.]+)/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
      ];
      const x0 = pts[0].x;
      const slantFrac = pts[pts.length - 1].x - x0;
      const deviations = pts.map(p => (p.x - (x0 + slantFrac * p.y)));
      return {
        clip: getComputedStyle(mask).clipPath,
        slantPx: slantFrac * rect.width,
        heightPx: rect.height,
        maxDevPx: Math.max(...deviations) * rect.width,
        minDevPx: Math.min(...deviations) * rect.width
      };
    });
    expect(probe).not.toBeNull();
    expect(probe!.clip).toContain('yait-wave-clip');
    const ratio = probe!.slantPx / probe!.heightPx;
    expect(ratio).toBeGreaterThan(0.75);
    expect(ratio).toBeLessThan(1.25);
    expect(probe!.maxDevPx).toBeGreaterThan(8);
    expect(probe!.maxDevPx).toBeLessThan(18);
    expect(probe!.minDevPx).toBeLessThan(-8);
    expect(probe!.minDevPx).toBeGreaterThan(-18);
  });

  test('the bottom line reveals about 50px ahead of the top line', async ({ page }) => {
    await page.goto('/home');
    const gaps = await page.evaluate(() => {
      const top = document.querySelector('.line-mask-top');
      const bottom = document.querySelector('.line-mask:not(.line-mask-top)');
      if (!top || !bottom) return null;
      const sample = (t: number) => {
        for (const a of document.getAnimations({ subtree: true })) {
          a.pause();
          a.currentTime = t;
        }
        return bottom.getBoundingClientRect().right - top.getBoundingClientRect().right;
      };
      return { midSail: sample(3000), settled: sample(6000) };
    });
    expect(gaps).not.toBeNull();
    expect(gaps!.midSail).toBeGreaterThan(42);
    expect(gaps!.midSail).toBeLessThan(58);
    expect(Math.abs(gaps!.settled)).toBeLessThan(2);
  });

  test('the intro animates transform and opacity only', async ({ page }) => {
    await page.goto('/home');
    const animated = await page.evaluate(() =>
      document.getAnimations({ subtree: true }).flatMap(a => {
        const effect = a.effect as KeyframeEffect | null;
        return effect?.getKeyframes().flatMap(k =>
          Object.keys(k).filter(p => !['offset', 'composite', 'easing', 'computedOffset'].includes(p))
        ) ?? [];
      })
    );
    const allowed = new Set(['transform', 'opacity']);
    expect(animated.length).toBeGreaterThan(0);
    expect([...new Set(animated)].filter(p => !allowed.has(p))).toEqual([]);
  });
});
