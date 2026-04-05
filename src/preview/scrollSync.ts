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

  const now = () => Date.now();
  const log = (direction: string, detail: Record<string, unknown>) => {
    console.info(`[tistory-md][scroll-sync] ${direction}`, detail);
  };

  const syncToTarget = () => {
    const currentTime = now();
    if (currentTime < ignoreSourceUntil) {
      log(`${source.name} -> ${target.name} skipped`, {
        reason: 'source-guard',
        currentTime,
        ignoreSourceUntil,
        sourceScrollTop: source.element.scrollTop,
        targetScrollTop: target.element.scrollTop
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
  };

  const syncToSource = () => {
    const currentTime = now();
    if (currentTime < ignoreTargetUntil) {
      log(`${target.name} -> ${source.name} skipped`, {
        reason: 'target-guard',
        currentTime,
        ignoreTargetUntil,
        sourceScrollTop: source.element.scrollTop,
        targetScrollTop: target.element.scrollTop
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
