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
  const log = (direction: string, detail: Record<string, unknown>) => {
    console.warn(`[tistory-md][scroll-sync] ${direction}`, detail);
  };

  const syncToTarget = () => {
    const currentTime = now();
    if (currentTime < ignoreSourceUntil) {
      const programmatic = isProgrammaticScroll(
        source.element.scrollTop,
        lastAppliedSourceScrollTop
      );
      if (!programmatic) {
        log(`${source.name} -> ${target.name} guard-bypassed`, {
          reason: 'source-user-scroll-detected',
          currentTime,
          ignoreSourceUntil,
          sourceScrollTop: source.element.scrollTop,
          lastAppliedSourceScrollTop
        });
      } else {
      log(`${source.name} -> ${target.name} skipped`, {
        reason: 'source-guard',
        currentTime,
        ignoreSourceUntil,
        sourceScrollTop: source.element.scrollTop,
        targetScrollTop: target.element.scrollTop,
        lastAppliedSourceScrollTop
      });
        return;
      }
    }

    if (!canScroll(source.element)) {
      log(`${source.name} -> ${target.name} skipped`, {
        reason: 'source-not-scrollable',
        currentTime,
        sourceScrollTop: source.element.scrollTop,
        sourceScrollHeight: source.element.scrollHeight,
        sourceClientHeight: source.element.clientHeight
      });
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

    log(`${source.name} -> ${target.name}`, {
      currentTime,
      ratio,
      sourceScrollTop: source.element.scrollTop,
      sourceScrollHeight: source.element.scrollHeight,
      sourceClientHeight: source.element.clientHeight,
      targetScrollTop: target.element.scrollTop,
      targetScrollHeight: target.element.scrollHeight,
      targetClientHeight: target.element.clientHeight,
      nextScrollTop,
      ignoreTargetUntil
    });

    if (Math.abs(target.element.scrollTop - nextScrollTop) > EPSILON) {
      target.element.scrollTop = nextScrollTop;
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
      if (!programmatic) {
        log(`${target.name} -> ${source.name} guard-bypassed`, {
          reason: 'target-user-scroll-detected',
          currentTime,
          ignoreTargetUntil,
          targetScrollTop: target.element.scrollTop,
          lastAppliedTargetScrollTop
        });
      } else {
      log(`${target.name} -> ${source.name} skipped`, {
        reason: 'target-guard',
        currentTime,
        ignoreTargetUntil,
        sourceScrollTop: source.element.scrollTop,
        targetScrollTop: target.element.scrollTop,
        lastAppliedTargetScrollTop
      });
        return;
      }
    }

    if (!canScroll(target.element)) {
      log(`${target.name} -> ${source.name} skipped`, {
        reason: 'target-not-scrollable',
        currentTime,
        targetScrollTop: target.element.scrollTop,
        targetScrollHeight: target.element.scrollHeight,
        targetClientHeight: target.element.clientHeight
      });
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

    log(`${target.name} -> ${source.name}`, {
      currentTime,
      ratio,
      sourceScrollTop: source.element.scrollTop,
      sourceScrollHeight: source.element.scrollHeight,
      sourceClientHeight: source.element.clientHeight,
      targetScrollTop: target.element.scrollTop,
      targetScrollHeight: target.element.scrollHeight,
      targetClientHeight: target.element.clientHeight,
      nextScrollTop,
      ignoreSourceUntil
    });

    if (Math.abs(source.element.scrollTop - nextScrollTop) > EPSILON) {
      source.element.scrollTop = nextScrollTop;
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
