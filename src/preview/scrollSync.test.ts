import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  attachBidirectionalScrollSync,
  computeScrollRatio,
  ratioToScrollTop,
  type ScrollSyncEndpoint
} from './scrollSync';

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

const createEndpoint = (
  scrollHeight: number,
  clientHeight: number
): ScrollSyncEndpoint & { emitScroll(): void } => {
  const listeners = new Set<() => void>();
  const endpoint: ScrollSyncEndpoint & { emitScroll(): void } = {
    element: {
      scrollTop: 0,
      scrollHeight,
      clientHeight
    },
    onScroll(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emitScroll() {
      for (const listener of listeners) {
        listener();
      }
    }
  };

  return endpoint;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('attachBidirectionalScrollSync', () => {
  it('ignores duplicate opposite-side events within a short window', () => {
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    const source = createEndpoint(1000, 500);
    const target = createEndpoint(1200, 600);
    attachBidirectionalScrollSync(source, target);

    source.element.scrollTop = 250;
    source.emitScroll();
    expect(target.element.scrollTop).toBeCloseTo(300);

    source.element.scrollTop = 0;
    source.emitScroll();
    expect(target.element.scrollTop).toBeCloseTo(0);

    target.element.scrollTop = 240;
    target.emitScroll();
    expect(source.element.scrollTop).toBe(0);

    now += 300;
    target.emitScroll();
    expect(source.element.scrollTop).toBeCloseTo(200);
  });
});
