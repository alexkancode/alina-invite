import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';
import { REVEAL_EDGE, REVEAL_EDGE_MOBILE, REVEAL_TOP_DELAY_MS, SAIL_TRACK, SAIL_WEAVE } from '../../src/lib/yait/heroScene';

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

  const revealPairs = [
    { mask: 'reveal-mask', text: 'reveal-text', edge: REVEAL_EDGE },
    { mask: 'reveal-mask-mobile', text: 'reveal-text-mobile', edge: REVEAL_EDGE_MOBILE }
  ];

  test.each(revealPairs)('$mask sweeps with the hull-locked edge', ({ mask, edge }) => {
    const block = keyframeBlock(mask);
    expect(block.length).toBeGreaterThan(0);
    for (const wp of edge) {
      expectFrame(block, wp.offset, `translateX(${wp.percent}%)`);
    }
  });

  test.each(revealPairs)('$text counter-translates by the same magnitudes', ({ text, edge }) => {
    const block = keyframeBlock(text);
    expect(block.length).toBeGreaterThan(0);
    for (const wp of edge) {
      expectFrame(block, wp.offset, `translateX(${-wp.percent}%)`);
    }
  });

  test('all layers ride the easeInOutSine curve, reveals spanning sail plus settle', () => {
    expect(css).toMatch(/sail-x 5s cubic-bezier\(0\.37, 0, 0\.63, 1\) both/);
    expect(css).toMatch(/sail-weave 5s cubic-bezier\(0\.37, 0, 0\.63, 1\) both/);
    expect(css).toMatch(/reveal-mask 6s cubic-bezier\(0\.37, 0, 0\.63, 1\) both/);
    expect(css).toMatch(/reveal-text 6s cubic-bezier\(0\.37, 0, 0\.63, 1\) both/);
    expect(css).toMatch(/animation-name: reveal-mask-mobile;/);
    expect(css).toMatch(/animation-name: reveal-text-mobile;/);
    expect(css).not.toMatch(/reveal-mask-top|reveal-text-top/);
  });

  test('mobile scales the tall fries back into proportion', () => {
    expect(css).toMatch(/\.fry \{\s*height: calc\(var\(--fry-h\) \* 0\.8\);\s*\}/);
  });

  test('the top line is an independent entity trailing purely by delay', () => {
    const delay = new RegExp(`animation-delay: ${REVEAL_TOP_DELAY_MS}ms;`, 'g');
    expect(css.match(delay)).toHaveLength(2);
    expect(css).toMatch(new RegExp(`\\.line-mask-top \\{\\s*animation-delay: ${REVEAL_TOP_DELAY_MS}ms;`));
    expect(css).toMatch(new RegExp(`\\.line-mask-top \\.line-counter \\{\\s*animation-delay: ${REVEAL_TOP_DELAY_MS}ms;`));
  });

  test('the wave rolls one wavelength per loop on carrier and counter', () => {
    expect(css).toMatch(/\.wave-carrier \{[^}]*animation: wave-roll 4s linear infinite;/s);
    expect(css).toMatch(/\.headline-line \{[^}]*animation: wave-roll-counter 4s linear infinite;/s);
    expect(css).toMatch(/@keyframes wave-roll \{\s*from \{ transform: translate\(0%, 0%\); \}\s*to \{ transform: translate\(2\.89063%, 20%\); \}\s*\}/);
    expect(css).toMatch(/@keyframes wave-roll-counter \{\s*from \{ transform: translate\(0%, 0%\); \}\s*to \{ transform: translate\(-2\.89063%, -20%\); \}\s*\}/);
  });

  test('the second headline line is indented exactly 100px by rule', () => {
    expect(css).toMatch(/\.headline-line-indent \{\s*padding-left: 100px;/);
  });

  test('the reveal edge clips through the generated wave path', () => {
    expect(css).toMatch(/--headline-fs: clamp\(2\.8rem, 11vw, 8\.5rem\);/);
    expect(css).toMatch(/clip-path: url\(#yait-wave-clip\);/);
    expect(css).not.toMatch(/--headline-slant/);
    expect(css).toMatch(/font-size: var\(--headline-fs\);/);
    expect(css.match(/clamp\(2\.8rem, 11vw, 8\.5rem\)/g)).toHaveLength(1);
  });
});
