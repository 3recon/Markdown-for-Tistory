const EPSILON = 1;
const GUARD_WINDOW_MS = 240;

export const computeScrollRatio = (
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number => {
  const maxScroll = Math.max(scrollHeight - clientHeight, 0);
  if (maxScroll === 0) {
    return 0;
  }

  return Math.min(Math.max(scrollTop / maxScroll, 0), 1);
};

export const ratioToScrollTop = (
  ratio: number,
  scrollHeight: number,
  clientHeight: number
): number => {
  const maxScroll = Math.max(scrollHeight - clientHeight, 0);
  return maxScroll * Math.min(Math.max(ratio, 0), 1);
};

export interface ScrollLikeElement {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface ScrollSyncEndpoint {
  name: string;
  element: ScrollLikeElement;
  setScrollTop?(scrollTop: number): void;
  onScroll(listener: () => void): () => void;
}

export interface ScrollSyncController {
  destroy(): void;
}

export const attachBidirectionalScrollSync = (
  source: ScrollSyncEndpoint,
  target: ScrollSyncEndpoint
): ScrollSyncController => {
  let ignoreSourceUntil = 0;
  let ignoreTargetUntil = 0;
  let lastAppliedSourceScrollTop: number | null = null;
  let lastAppliedTargetScrollTop: number | null = null;

  const now = () => Date.now();
  const canScroll = (element: ScrollLikeElement) => element.scrollHeight - element.clientHeight > EPSILON;
  const isProgrammaticScroll = (
    actualScrollTop: number,
    lastAppliedScrollTop: number | null
  ): boolean => {
    if (lastAppliedScrollTop === null) {
      return false;
    }

    return Math.abs(actualScrollTop - lastAppliedScrollTop) <= EPSILON;
  };

  const syncToTarget = () => {
    const currentTime = now();
    if (currentTime < ignoreSourceUntil) {
      const programmatic = isProgrammaticScroll(
        source.element.scrollTop,
        lastAppliedSourceScrollTop
      );
      if (programmatic) {
        return;
      }
    }

    if (!canScroll(source.element)) {
      return;
    }

    ignoreTargetUntil = currentTime + GUARD_WINDOW_MS;
    const ratio = computeScrollRatio(
      source.element.scrollTop,
      source.element.scrollHeight,
      source.element.clientHeight
    );
    const nextScrollTop = ratioToScrollTop(
      ratio,
      target.element.scrollHeight,
      target.element.clientHeight
    );

    if (Math.abs(target.element.scrollTop - nextScrollTop) > EPSILON) {
      target.setScrollTop?.(nextScrollTop) ?? (target.element.scrollTop = nextScrollTop);
    }
    lastAppliedTargetScrollTop = nextScrollTop;
  };

  const syncToSource = () => {
    const currentTime = now();
    if (currentTime < ignoreTargetUntil) {
      const programmatic = isProgrammaticScroll(
        target.element.scrollTop,
        lastAppliedTargetScrollTop
      );
      if (programmatic) {
        return;
      }
    }

    if (!canScroll(target.element)) {
      return;
    }

    ignoreSourceUntil = currentTime + GUARD_WINDOW_MS;
    const ratio = computeScrollRatio(
      target.element.scrollTop,
      target.element.scrollHeight,
      target.element.clientHeight
    );
    const nextScrollTop = ratioToScrollTop(
      ratio,
      source.element.scrollHeight,
      source.element.clientHeight
    );

    if (Math.abs(source.element.scrollTop - nextScrollTop) > EPSILON) {
      source.setScrollTop?.(nextScrollTop) ?? (source.element.scrollTop = nextScrollTop);
    }
    lastAppliedSourceScrollTop = nextScrollTop;
  };

  const detachSource = source.onScroll(syncToTarget);
  const detachTarget = target.onScroll(syncToSource);

  return {
    destroy() {
      detachSource();
      detachTarget();
    }
  };
};
