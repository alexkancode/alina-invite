import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const DOCKED_AFTER_MS = 6600;
const MIN_ROLL_DELTA_PX = 800;
const MIN_DOCKED_ROLL_DELTA_PX = 250;
const ROLL_BURST_FRAMES = 6;
const ROLL_BURST_STEP_MS = 70;
const ROLL_SETTLED_AFTER_MS = 8000;

async function changedPixels(a: Buffer, b: Buffer): Promise<number> {
  const [ra, rb] = await Promise.all(
    [a, b].map(buf => sharp(buf).raw().toBuffer({ resolveWithObject: true }))
  );
  const px = ra.data;
  const py = rb.data;
  const ch = ra.info.channels;
  let count = 0;
  for (let i = 0; i < px.length; i += ch) {
    const delta = Math.abs(px[i] - py[i]) + Math.abs(px[i + 1] - py[i + 1]) + Math.abs(px[i + 2] - py[i + 2]);
    if (delta > 30) count++;
  }
  return count;
}

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

  test('the reveal edge is a 45-degree slant carrying a single whip bump', async ({ page }) => {
    await page.goto('/home');
    const probe = await page.evaluate(() => {
      const mask = document.querySelector('.line-mask:not(.line-mask-top)');
      const wave = document.querySelector('#yait-wave-clip path');
      if (!mask || !wave) return null;
      const rect = mask.getBoundingClientRect();
      const d = wave.getAttribute('d') ?? '';
      const pts = [...d.matchAll(/C (?:-?[\d.]+ ){4}(-?[\d.]+) (-?[\d.]+)/g)]
        .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
        .filter(p => p.y >= -0.001 && p.y <= 1.001);
      const x0 = pts[0].x;
      const xN = pts[pts.length - 1].x;
      const slantFrac = xN - x0;
      const devs = pts.map(p => (p.x - (x0 + slantFrac * (p.y - pts[0].y) / (pts[pts.length - 1].y - pts[0].y))) * rect.width);
      const lobes = devs.filter((v, i) => i > 0 && i < devs.length - 1 && Math.abs(v) > 12 && Math.abs(v) >= Math.abs(devs[i - 1]) && Math.abs(v) >= Math.abs(devs[i + 1])).length;
      return {
        clip: getComputedStyle(mask).clipPath,
        ratio: (slantFrac * rect.width) / rect.height,
        maxAbsDevPx: Math.max(...devs.map(Math.abs)),
        lobes
      };
    });
    expect(probe).not.toBeNull();
    expect(probe!.clip).toContain('yait-wave-clip');
    expect(probe!.ratio).toBeGreaterThan(0.75);
    expect(probe!.ratio).toBeLessThan(1.25);
    expect(probe!.maxAbsDevPx).toBeGreaterThan(20);
    expect(probe!.lobes).toBe(1);
  });

  test('the lines reveal as independent entities, top trailing without convergence', async ({ page }) => {
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
      return { midSail: sample(3000), atDock: sample(6000), afterBoth: sample(7000) };
    });
    expect(gaps).not.toBeNull();
    expect(gaps!.midSail).toBeGreaterThan(100);
    expect(gaps!.midSail).toBeLessThan(260);
    expect(gaps!.atDock).toBeGreaterThan(100);
    expect(Math.abs(gaps!.afterBoth)).toBeLessThan(2);
  });

  test('the open flap points skyward behind the fries', async ({ page }) => {
    await page.goto('/home');
    const probe = await page.evaluate(() => {
      const flap = document.querySelector('.envelope-flap');
      const art = document.querySelector('.envelope-art');
      const fry = document.querySelector('.fry');
      if (!flap || !art || !fry) return null;
      return {
        flapTop: flap.getBoundingClientRect().top,
        flapBottom: flap.getBoundingClientRect().bottom,
        artTop: art.getBoundingClientRect().top,
        fryTop: fry.getBoundingClientRect().top,
        flapZ: getComputedStyle(flap).zIndex,
        artZ: getComputedStyle(art).zIndex
      };
    });
    expect(probe).not.toBeNull();
    expect(probe!.flapTop).toBeLessThan(probe!.fryTop);
    expect(probe!.flapBottom).toBeGreaterThan(probe!.artTop);
    expect(Number(probe!.flapZ)).toBeLessThan(Number(probe!.artZ));
  });

  test('fry feet stay tucked behind the front V even at full bounce', async ({ page }) => {
    await page.goto('/home');
    const probe = await page.evaluate(() => {
      const fries = document.querySelector('.fries');
      const art = document.querySelector('.envelope-art');
      if (!fries || !art) return null;
      const artRect = art.getBoundingClientRect();
      return {
        feetBaseline: fries.getBoundingClientRect().bottom,
        vDip: artRect.top + artRect.height * (80 / 140)
      };
    });
    expect(probe).not.toBeNull();
    expect(probe!.feetBaseline - 16).toBeGreaterThan(probe!.vDip);
  });

  test('the wave rolls perceptibly while revealed text stays byte-stable', async ({ page }) => {
    await page.goto('/home');
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      for (const a of document.getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = 3000;
      }
    });
    const edgeRegion = { x: 250, y: 280, width: 220, height: 160 };
    const wordRegion = { x: 140, y: 300, width: 70, height: 120 };
    const wordA = await page.screenshot({ clip: wordRegion });
    const edgeFrames = [];
    for (let i = 0; i < ROLL_BURST_FRAMES; i++) {
      edgeFrames.push(await page.screenshot({ clip: edgeRegion }));
      if (i < ROLL_BURST_FRAMES - 1) await page.waitForTimeout(ROLL_BURST_STEP_MS);
    }
    const wordB = await page.screenshot({ clip: wordRegion });
    const deltas = await Promise.all(edgeFrames.slice(1).map(f => changedPixels(edgeFrames[0], f)));
    expect(Math.max(...deltas)).toBeGreaterThan(MIN_ROLL_DELTA_PX);
    expect(Buffer.compare(wordA, wordB)).toBe(0);
  });

  test('the roll keeps traveling on the docked edge after the reveal completes', async ({ page }) => {
    await page.goto('/home');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(ROLL_SETTLED_AFTER_MS);
    const dockedEdgeRegion = { x: 760, y: 264, width: 200, height: 56 };
    const frames = [];
    for (let i = 0; i < ROLL_BURST_FRAMES; i++) {
      frames.push(await page.screenshot({ clip: dockedEdgeRegion }));
      if (i < ROLL_BURST_FRAMES - 1) await page.waitForTimeout(ROLL_BURST_STEP_MS);
    }
    const deltas = await Promise.all(frames.slice(1).map(f => changedPixels(frames[0], f)));
    expect(Math.max(...deltas)).toBeGreaterThan(MIN_DOCKED_ROLL_DELTA_PX);
  });

  test('reduced motion removes the morphing clip animation entirely', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/home');
    await expect(page.locator('animate')).toHaveCount(0);
    await expect(page.locator('animateTransform')).toHaveCount(0);
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
