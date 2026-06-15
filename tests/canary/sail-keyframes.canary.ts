import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';
import { SAIL_TRACK, SAIL_WEAVE } from '../../src/lib/yait/heroScene';

const css = readFileSync(resolve(__dirname, '../../src/styles/yait.css'), 'utf8');

const keyframeBlock = (name: string) => {
  const match = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`));
  return match ? match[1] : '';
};

const pctFor = (offset: number) =>
  offset === 0 ? 'from' : offset === 1 ? 'to' : `${Math.round(offset * 10000) / 100}%`;

const escape = (s: string) => s.replace(/[().]/g, c => `\\${c}`);

const expectFrame = (block: string, offset: number, transform: string) => {
  const frame = new RegExp(`${pctFor(offset).replace('%', '\\%')}\\s*\\{\\s*transform:\\s*${escape(transform)};`);
  expect(block).toMatch(frame);
};

describe('sail keyframes match the three-beat spec', () => {
  test('sail-x carries every track waypoint exactly', () => {
    const block = keyframeBlock('sail-x');
    expect(block.length).toBeGreaterThan(0);
    for (const wp of SAIL_TRACK) {
      expectFrame(block, wp.offset, `translateX(${wp.xVw}vw)`);
    }
    expect(block.match(/[\d.]+%|from|to/g) ?? []).toHaveLength(SAIL_TRACK.length);
  });

  test('sail-weave carries every weave waypoint exactly', () => {
    const block = keyframeBlock('sail-weave');
    expect(block.length).toBeGreaterThan(0);
    for (const wp of SAIL_WEAVE) {
      expectFrame(block, wp.offset, `translateY(${wp.yPx}px) rotate(${wp.rotateDeg}deg) scale(${wp.scale})`);
    }
    expect(block.match(/[\d.]+%|from|to/g) ?? []).toHaveLength(SAIL_WEAVE.length);
  });

  test('the headline text carries zero animation (reveal is on the clip, not the text)', () => {
    const headlineBlock = css.match(/\.headline \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(headlineBlock.length).toBeGreaterThan(0);
    expect(headlineBlock).not.toMatch(/animation/);
    const windowBlock = css.match(/\.reveal-window \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(windowBlock).toContain('clip-path: url(#yait-wave-clip)');
    expect(windowBlock).not.toMatch(/animation/);
    expect(css).not.toMatch(/@keyframes reveal-mask/);
    expect(css).not.toMatch(/@keyframes reveal-text/);
  });

  test('layers flow linearly through the beats and ease out only into the dock', () => {
    expect(css).toMatch(/sail-x 4.444s linear both/);
    expect(css).toMatch(/sail-weave 4.444s linear both/);
    expect(css).not.toMatch(/reveal-mask-top|reveal-text-top/);
    expect(css).not.toMatch(/cubic-bezier\(0\.37, 0, 0\.63, 1\)/);
  });

  test('only the final dock segment eases out (no per-beat stops)', () => {
    const dockEase = /animation-timing-function: cubic-bezier\(0\.61, 1, 0\.88, 1\);/g;
    expect((css.match(dockEase) ?? []).length).toBe(2);
    expect(keyframeBlock('sail-x')).toMatch(/68\.75% \{[\s\S]*?animation-timing-function: cubic-bezier\(0\.61, 1, 0\.88, 1\);/);
  });

  test('the envelope swivels toward the screen at both inner beats and returns flat', () => {
    expect(css).toMatch(/\.envelope-pivot \{[\s\S]*?animation: pivot 4\.444s ease-in-out both;/);
    const block = keyframeBlock('pivot');
    expect(block.length).toBeGreaterThan(0);
    expect(block).toMatch(/25% \{ transform: perspective\(600px\) rotateY\(20deg\); \}/);
    expect(block).toMatch(/68\.75% \{ transform: perspective\(600px\) rotateY\(20deg\); \}/);
    expect(block).toMatch(/0% \{ transform: perspective\(600px\) rotateY\(0deg\); \}/);
    expect(block).toMatch(/47% \{ transform: perspective\(600px\) rotateY\(0deg\); \}/);
    expect(block).toMatch(/to \{ transform: perspective\(600px\) rotateY\(0deg\); \}/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.envelope-pivot/);
  });

  test('the traced clouds carry their tone fills and breathe on per-layer phases', () => {
    expect(css).toMatch(/\.cloud-shadow \{[\s\S]*?fill: #A9D9CE;/);
    expect(css).toMatch(/\.cloud-mid \{[\s\S]*?fill: #CDEAE0;/);
    expect(css).toMatch(/\.cloud-cream \{[\s\S]*?fill: #FBF6E9;/);
    expect(css).toMatch(/@keyframes swell-tall/);
    expect(css).toMatch(/@keyframes swell-flat/);
    expect(css).toMatch(/\.cloud-shadow \{[\s\S]*?animation: swell-flat/);
    expect(css).toMatch(/\.cloud-mid \{[\s\S]*?animation: swell-tall/);
    expect(css).toMatch(/\.cloud-cream \{[\s\S]*?animation: swell-tall/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.cloud-layer/);
  });

  test('the clouds drift left-to-right with the whitest layer leading', () => {
    expect(css).toMatch(/@keyframes drift-shadow/);
    expect(css).toMatch(/@keyframes drift-mid/);
    expect(css).toMatch(/@keyframes drift-cream/);
    expect(css).toMatch(/\.cloud-drift-shadow \{[\s\S]*?animation: drift-shadow/);
    expect(css).toMatch(/\.cloud-drift-mid \{[\s\S]*?animation: drift-mid/);
    expect(css).toMatch(/\.cloud-drift-cream \{[\s\S]*?animation: drift-cream/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.cloud-drift/);
    const peak = (name: string) => {
      const block = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
      return Number(block.match(/translateX\((\d+(?:\.\d+)?)px\)/g)?.map(s => Number(s.match(/[\d.]+/)![0])).sort((a, b) => b - a)[0] ?? 0);
    };
    expect(peak('drift-cream')).toBeGreaterThan(peak('drift-mid'));
    expect(peak('drift-mid')).toBeGreaterThan(peak('drift-shadow'));
    expect(peak('drift-shadow')).toBeGreaterThanOrEqual(120);
  });

  test('the drift runs at constant velocity (linear), so it moves from load', () => {
    for (const tone of ['shadow', 'mid', 'cream']) {
      expect(css).toMatch(new RegExp(`\\.cloud-drift-${tone} \\{[\\s\\S]*?animation: drift-${tone} 80s linear`));
    }
    expect(css).not.toMatch(/\.cloud-drift-\w+ \{[^}]*ease-in-out/);
  });

  test('the biggest cloud drifts 10% faster than the rest', () => {
    for (const tone of ['shadow', 'mid', 'cream']) {
      expect(css).toMatch(new RegExp(`\\.cloud-drift-hero-${tone} \\{[\\s\\S]*?animation: drift-${tone} 72s linear`));
    }
  });

  test('no keyframe is defined but left unattached (orphan guard)', () => {
    const defined = [...css.matchAll(/@keyframes ([\w-]+)/g)].map(m => m[1]);
    const referenced = new Set(
      [...css.matchAll(/animation(?:-name)?:\s*([^;]+);/g)].flatMap(m =>
        m[1].split(',').map(part => part.trim().split(/\s+/).find(tok => /^[a-zA-Z][\w-]*$/.test(tok)) ?? '')
      )
    );
    for (const name of defined) {
      expect(referenced.has(name), `@keyframes ${name} is never referenced by an animation`).toBe(true);
    }
  });

  test('mobile scales the tall fries back into proportion', () => {
    expect(css).toMatch(/\.fry \{\s*height: calc\(var\(--fry-h\) \* 0\.8\);\s*\}/);
  });

  test('one reveal window clips the whole headline as a unit', () => {
    expect(css).toMatch(/\.reveal-window \{[\s\S]*?clip-path: url\(#yait-wave-clip\);/);
    expect(css).not.toMatch(/\.line-mask/);
  });

  test('the mirrored wake is a semi-transparent white fill (tapered ribbon, no stroke)', () => {
    const echo = css.match(/\.reveal-echo-line \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(echo.length).toBeGreaterThan(0);
    expect(echo).toMatch(/fill: #ffffff;/);
    expect(echo).toMatch(/fill-opacity: 0\.45;/);
    expect(echo).not.toMatch(/stroke-width/);
  });

  test('the wake is anchored at the boat stern and fades out after the boat docks', () => {
    const echo = css.match(/\.reveal-echo \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(echo).toMatch(/position: absolute;/);
    expect(echo).not.toMatch(/translateY/);
    expect(echo).toMatch(/right: 100%;/);
    expect(echo).toMatch(/animation: wake-fade 1\.2s 5\.333s linear forwards, wake-pivot 4\.444s ease-in-out both;/);
    expect(echo).toMatch(/transform-origin: 100% 50%;/);
    expect(css).toMatch(/@keyframes wake-fade \{[\s\S]*?opacity: 0;/);
    expect(css).toMatch(/@keyframes wake-pivot \{[\s\S]*?rotateY\(-20deg\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.reveal-echo \{\s*opacity: 0;/);
  });

  test('the second headline line is indented exactly 100px by rule', () => {
    expect(css).toMatch(/\.headline-line-indent \{\s*padding-left: 100px;/);
  });

  test('the reveal edge clips through the generated wave path', () => {
    expect(css).toMatch(/--headline-fs: clamp\(2\.8rem, 12vw, 10\.5rem\);/);
    expect(css).toMatch(/clip-path: url\(#yait-wave-clip\);/);
    expect(css).not.toMatch(/--headline-slant/);
    expect(css).toMatch(/font-size: var\(--headline-fs\);/);
    expect(css.match(/clamp\(2\.8rem, 12vw, 10\.5rem\)/g)).toHaveLength(1);
  });
});
