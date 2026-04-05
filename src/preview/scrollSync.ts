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

  const syncToTarget = () => {
    if (now() < ignoreSourceUntil) {
      return;
    }

    ignoreTargetUntil = now() + GUARD_WINDOW_MS;
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
      target.element.scrollTop = nextScrollTop;
    }
  };

  const syncToSource = () => {
    if (now() < ignoreTargetUntil) {
      return;
    }

    ignoreSourceUntil = now() + GUARD_WINDOW_MS;
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
