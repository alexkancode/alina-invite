import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const DOCKED_AFTER_MS = 6300;
const MIN_ROLL_DELTA_PX = 800;
const ROLL_BURST_FRAMES = 7;
const MIN_BEAT_FLOW_PX = 5;

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
    await page.waitForTimeout(2500);
    await page.screenshot({ path: '/tmp/yait-home-midsail.png' });
    await page.waitForTimeout(DOCKED_AFTER_MS - 2500);
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
        a.currentTime = 2222;
      }
      return getComputedStyle(el).transform;
    });
    const parts = matrix.match(/matrix\(([^)]+)\)/);
    expect(parts).not.toBeNull();
    const translateX = Number(parts![1].split(',')[4]);
    expect(translateX).toBeLessThan(-300);
  });

  test('the boat keeps moving through the inner beat (no pause)', async ({ page }) => {
    await page.goto('/home');
    const tx = (t: number) => page.evaluate((time) => {
      const el = document.querySelector('[data-testid="envelope"]');
      for (const a of el!.getAnimations()) {
        a.pause();
        a.currentTime = time;
      }
      const m = getComputedStyle(el!).transform.match(/matrix\(([^)]+)\)/);
      return Number(m![1].split(',')[4]);
    }, t);
    const atBeat = await tx(1111);
    const justAfter = await tx(1231);
    expect(Math.abs(justAfter - atBeat)).toBeGreaterThan(MIN_BEAT_FLOW_PX);
  });

  test('the clip cut line carries a beat rotation, leaving revealed glyphs unmoved', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('#yait-wave-clip animateTransform[type="rotate"]')).toHaveCount(1);
    const glyph = { x: 60, y: 100, width: 90, height: 85 };
    const pin = (t: number) => page.evaluate((time) => {
      for (const a of document.getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = time;
      }
    }, t);
    await page.evaluate(() => document.fonts.ready);
    await pin(4200);
    const glyphA = await page.screenshot({ clip: glyph });
    await pin(4400);
    const glyphB = await page.screenshot({ clip: glyph });
    expect(Buffer.compare(glyphA, glyphB)).toBe(0);
  });

  test('the hero renders the breathing cloud layers (rest + hero split), and rests under reduced motion', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('.cloud-layer')).toHaveCount(6);
    const box = () => page.evaluate(() => {
      const r = document.querySelector('.cloud-cream')!.getBoundingClientRect();
      return r.width * 1000 + r.height;
    });
    const a = await box();
    await page.waitForTimeout(2200);
    const b = await box();
    expect(a).not.toBe(b);
  });

  test('the whitest layer drifts farthest over a few-hundred-px range (parallax)', async ({ page }) => {
    await page.goto('/home');
    // seek each drift animation to its peak so offsets are deterministic, not timing-dependent
    const txAtPeak = (sel: string) => page.evaluate((s) => {
      const el = document.querySelector(s)!;
      const anim = (el as Element & { getAnimations: () => Animation[] }).getAnimations()[0];
      anim.currentTime = 80000;
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return m.m41;
    }, sel);
    const cream = await txAtPeak('.cloud-drift-cream');
    const mid = await txAtPeak('.cloud-drift-mid');
    const shadow = await txAtPeak('.cloud-drift-shadow');
    expect(cream).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(shadow);
    expect(shadow).toBeGreaterThanOrEqual(150);
  });

  test('the drift moves at constant velocity (linear, visible from load)', async ({ page }) => {
    await page.goto('/home');
    // at 25% of the 80s cycle, a linear drift sits at 25% of its 160px peak (~40px);
    // ease-in-out would sit near ~23px, so this pins the linear timing deterministically.
    const tx = await page.evaluate(() => {
      const el = document.querySelector('.cloud-drift-shadow')!;
      const anim = (el as Element & { getAnimations: () => Animation[] }).getAnimations()[0];
      anim.currentTime = 20000;
      return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    });
    expect(tx).toBeGreaterThan(32);
    expect(tx).toBeLessThan(48);
  });

  test('the biggest cloud drifts faster than the rest, and the headline is large on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/home');
    const dur = (sel: string) => page.evaluate(s =>
      getComputedStyle(document.querySelector(s)!).animationDuration, sel);
    const heroDur = parseFloat(await dur('.cloud-drift-hero-shadow'));
    const restDur = parseFloat(await dur('.cloud-drift-shadow'));
    expect(heroDur).toBeLessThan(restDur);          // faster = shorter period
    expect(heroDur).toBeCloseTo(restDur * 0.9, 1);  // ~10% faster
    const fs = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector('.headline')!).fontSize));
    expect(fs).toBeGreaterThan(140);
  });

  test('reduced motion rests the cloud layers static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/home');
    const creamAnim = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.cloud-cream')!).animationName);
    const driftAnim = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.cloud-drift-cream')!).animationName);
    expect(creamAnim === 'none' || creamAnim === '').toBe(true);
    expect(driftAnim === 'none' || driftAnim === '').toBe(true);
  });

  test('the envelope swivels toward the screen at the inner beat and returns flat', async ({ page }) => {
    await page.goto('/home');
    const at = (t: number) => page.evaluate((time) => {
      const el = document.querySelector('.envelope-pivot');
      for (const a of el!.getAnimations()) {
        a.pause();
        a.currentTime = time;
      }
      return getComputedStyle(el!).transform;
    }, t);
    const atBeat = await at(1111);
    const between = await at(2089);
    expect(atBeat).toContain('matrix3d');
    expect(atBeat).not.toBe(between);
  });

  test('the headline text element carries zero animation', async ({ page }) => {
    await page.goto('/home');
    const anims = await page.evaluate(() => ({
      headline: getComputedStyle(document.querySelector('.headline')!).animationName,
      window: getComputedStyle(document.querySelector('.reveal-window')!).animationName
    }));
    expect(anims.headline === 'none' || anims.headline === '').toBe(true);
    expect(anims.window === 'none' || anims.window === '').toBe(true);
  });

  test('the glyphs never move through the whole reveal (clip sweeps, text is static)', async ({ page }) => {
    await page.goto('/home');
    await page.evaluate(() => document.fonts.ready);
    const glyph = { x: 55, y: 100, width: 95, height: 85 };
    const pin = (t: number) => page.evaluate((time) => {
      for (const a of document.getAnimations({ subtree: true })) { a.pause(); a.currentTime = time; }
    }, t);
    await pin(800);
    const a = await page.screenshot({ clip: glyph });
    await pin(4800);
    const b = await page.screenshot({ clip: glyph });
    expect(Buffer.compare(a, b)).toBe(0);
  });

  test('the reveal front is a stern-locked clip translate (advances, rests docked)', async ({ page }) => {
    await page.goto('/home');
    const sweep = await page.evaluate(() => {
      const t = document.querySelector('#yait-wave-clip animateTransform[type="translate"]');
      if (!t) return null;
      return {
        values: (t.getAttribute('values') ?? '').split(';').map(s => Number(s.trim().split(/\s+/)[0])),
        keyTimes: (t.getAttribute('keyTimes') ?? '').split(';').map(s => Number(s.trim()))
      };
    });
    expect(sweep).not.toBeNull();
    expect(sweep!.values[0]).toBeLessThanOrEqual(-1);            // starts fully hidden
    expect(sweep!.values[sweep!.values.length - 1]).toBeCloseTo(-0.15, 2); // rests docked
    for (let i = 1; i < sweep!.values.length; i++) {
      expect(sweep!.values[i]).toBeGreaterThan(sweep!.values[i - 1]); // only advances
      expect(sweep!.keyTimes[i]).toBeGreaterThan(sweep!.keyTimes[i - 1]);
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

  test('the reveal edge clips through a steep diagonal slant, and a mid frame carries one whip bump', async ({ page }) => {
    await page.goto('/home');
    const probe = await page.evaluate(() => {
      const mask = document.querySelector('.reveal-window');
      const morph = document.querySelector('#yait-wave-clip animate');
      if (!mask || !morph) return null;
      const rect = mask.getBoundingClientRect();
      const frames = (morph.getAttribute('values') ?? '').split(';');
      const parse = (d: string) => {
        const pts = [...d.matchAll(/C (?:-?[\d.]+ ){4}(-?[\d.]+) (-?[\d.]+)/g)]
          .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
          .filter(p => p.y >= -0.001 && p.y <= 1.001);
        const x0 = pts[0].x;
        const slantFrac = pts[pts.length - 1].x - x0;
        const devs = pts.map(p => (p.x - (x0 + slantFrac * p.y)) * rect.width);
        const lobes = devs.filter((v, i) => i > 0 && i < devs.length - 1 && Math.abs(v) > 12 && Math.abs(v) >= Math.abs(devs[i - 1]) && Math.abs(v) >= Math.abs(devs[i + 1])).length;
        return { slantPx: slantFrac * rect.width, height: rect.height, maxAbsDevPx: Math.max(...devs.map(Math.abs)), lobes };
      };
      const mid = parse(frames[Math.floor(frames.length / 4)]);
      return { clip: getComputedStyle(mask).clipPath, frameCount: frames.length, mid };
    });
    expect(probe).not.toBeNull();
    expect(probe!.clip).toContain('yait-wave-clip');
    expect(probe!.frameCount).toBe(25);
    const ratio = probe!.mid.slantPx / probe!.mid.height;
    expect(ratio).toBeGreaterThan(0.6);
    expect(ratio).toBeLessThan(1.25);
    expect(probe!.mid.maxAbsDevPx).toBeGreaterThan(20);
    expect(probe!.mid.lobes).toBe(1);
  });

  test('a single reveal window clips the whole headline (no per-line masks)', async ({ page }) => {
    await page.goto('/home');
    const counts = await page.evaluate(() => ({
      windows: document.querySelectorAll('.reveal-window').length,
      lineMasks: document.querySelectorAll('.line-mask').length,
      lines: document.querySelectorAll('.headline-line').length
    }));
    expect(counts.windows).toBe(1);
    expect(counts.lineMasks).toBe(0);
    expect(counts.lines).toBe(2);
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
    // Drive SMIL time directly: past the reveal the sweep/rotate are frozen (fill=freeze)
    // and only the looping morph rolls the edge, over fully-revealed static text.
    const seek = (t: number) => page.evaluate((time) => {
      const svg = document.querySelector('.bay-scene') as SVGSVGElement;
      svg.pauseAnimations();
      svg.setCurrentTime(time);
    }, t);
    const edgeRegion = { x: 150, y: 80, width: 480, height: 360 };
    const wordRegion = { x: 55, y: 100, width: 95, height: 85 };
    await seek(6.0);
    const wordA = await page.screenshot({ clip: wordRegion });
    const edgeFrames = [];
    for (let i = 0; i < ROLL_BURST_FRAMES; i++) {
      await seek(6.0 + i * 0.18);
      edgeFrames.push(await page.screenshot({ clip: edgeRegion }));
    }
    await seek(6.0);
    const wordB = await page.screenshot({ clip: wordRegion });
    const deltas = await Promise.all(edgeFrames.slice(1).map(f => changedPixels(edgeFrames[0], f)));
    expect(Math.max(...deltas)).toBeGreaterThan(MIN_ROLL_DELTA_PX);
    expect(Buffer.compare(wordA, wordB)).toBe(0);
  });

  test('the morph never freezes: it loops unbounded with no fill', async ({ page }) => {
    await page.goto('/home');
    const morph = page.locator('#yait-wave-clip animate');
    await expect(morph).toHaveCount(1);
    await expect(morph).toHaveAttribute('repeatCount', 'indefinite');
    expect(await morph.getAttribute('fill')).toBeNull();
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
