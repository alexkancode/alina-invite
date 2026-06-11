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
  offset === 0 ? 'from' : offset === 1 ? 'to' : `${Math.round(offset * 1000) / 10}%`;

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

  test('both layers ride the easeInOutSine curve', () => {
    expect(css).toMatch(/sail-x 5s cubic-bezier\(0\.37, 0, 0\.63, 1\) both/);
    expect(css).toMatch(/sail-weave 5s cubic-bezier\(0\.37, 0, 0\.63, 1\) both/);
  });
});
