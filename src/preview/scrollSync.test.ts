import { describe, expect, it } from 'vitest';

import { computeScrollRatio, ratioToScrollTop } from './scrollSync';

describe('computeScrollRatio', () => {
  it('returns 0 when an element cannot scroll', () => {
    expect(computeScrollRatio(0, 200, 200)).toBe(0);
  });

  it('returns a bounded ratio for scrollable content', () => {
    expect(computeScrollRatio(200, 1000, 500)).toBeCloseTo(0.4);
  });
});

describe('ratioToScrollTop', () => {
  it('maps a ratio into a scroll position', () => {
    expect(ratioToScrollTop(0.4, 1200, 600)).toBeCloseTo(240);
  });

  it('clamps out-of-range values', () => {
    expect(ratioToScrollTop(2, 1000, 500)).toBe(500);
    expect(ratioToScrollTop(-1, 1000, 500)).toBe(0);
  });
});
