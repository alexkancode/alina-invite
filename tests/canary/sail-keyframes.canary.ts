import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, test } from 'vitest';
import { SAIL_PATH } from '../../src/lib/yait/heroScene';

const css = readFileSync(resolve(__dirname, '../../src/styles/yait.css'), 'utf8');

const sailBlock = () => {
  const match = css.match(/@keyframes sail \{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
};

const expectedFrame = (wp: (typeof SAIL_PATH)[number]) => {
  const pct = wp.offset === 0 ? 'from' : wp.offset === 1 ? 'to' : `${Math.round(wp.offset * 1000) / 10}%`;
  const transform =
    `translateX(${wp.xVw}vw) translateY(${wp.yPx}px) rotate(${wp.rotateDeg}deg) scale(${wp.scale})`;
  return { pct, transform };
};

describe('sail keyframes match SAIL_PATH spec', () => {
  test('the stylesheet contains the sail keyframes', () => {
    expect(sailBlock().length).toBeGreaterThan(0);
  });

  test('every waypoint appears with its exact percentage and transform', () => {
    const block = sailBlock();
    for (const wp of SAIL_PATH) {
      const { pct, transform } = expectedFrame(wp);
      const frame = new RegExp(
        `${pct.replace('%', '\\%')}\\s*\\{\\s*transform:\\s*${transform
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/\./g, '\\.')};`
      );
      expect(block).toMatch(frame);
    }
  });

  test('the stylesheet has no stray sail waypoints beyond the spec', () => {
    const frames = sailBlock().match(/[\d.]+%|from|to/g) ?? [];
    expect(frames).toHaveLength(SAIL_PATH.length);
  });
});
