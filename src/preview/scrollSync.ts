const EPSILON = 1;

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
  addEventListener(type: 'scroll', listener: () => void): void;
}

export interface ScrollSyncController {
  destroy(): void;
}

export const attachBidirectionalScrollSync = (
  source: ScrollLikeElement,
  target: ScrollLikeElement
): ScrollSyncController => {
  let sourceGuard = false;
  let targetGuard = false;

  const syncToTarget = () => {
    if (sourceGuard) {
      sourceGuard = false;
      return;
    }

    targetGuard = true;
    const ratio = computeScrollRatio(source.scrollTop, source.scrollHeight, source.clientHeight);
    const nextScrollTop = ratioToScrollTop(ratio, target.scrollHeight, target.clientHeight);

    if (Math.abs(target.scrollTop - nextScrollTop) > EPSILON) {
      target.scrollTop = nextScrollTop;
    }
  };

  const syncToSource = () => {
    if (targetGuard) {
      targetGuard = false;
      return;
    }

    sourceGuard = true;
    const ratio = computeScrollRatio(target.scrollTop, target.scrollHeight, target.clientHeight);
    const nextScrollTop = ratioToScrollTop(ratio, source.scrollHeight, source.clientHeight);

    if (Math.abs(source.scrollTop - nextScrollTop) > EPSILON) {
      source.scrollTop = nextScrollTop;
    }
  };

  source.addEventListener('scroll', syncToTarget);
  target.addEventListener('scroll', syncToSource);

  return {
    destroy() {
      // The integration layer should replace this with removable listeners once the
      // actual Tistory editor DOM is wired in the next roadmap stage.
    }
  };
};
