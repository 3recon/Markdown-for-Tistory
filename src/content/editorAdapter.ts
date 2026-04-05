import { normalizeMarkdownSource } from '../preview/normalizeMarkdownSource';

const CONTENTEDITABLE_SELECTOR = '[contenteditable]:not([contenteditable="false"])';

const EDITOR_SELECTORS = [
  '.CodeMirror',
  '.CodeMirror textarea',
  '.tt-editor textarea',
  '.tt_editor textarea',
  '.editor textarea',
  `.editor ${CONTENTEDITABLE_SELECTOR}`,
  `[role="textbox"]${CONTENTEDITABLE_SELECTOR}`,
  'textarea',
  CONTENTEDITABLE_SELECTOR
];

type EditorElement = HTMLTextAreaElement | HTMLElement;

interface CodeMirrorLike {
  getValue(): string;
  setValue(markdown: string): void;
  on(event: 'change', listener: () => void): void;
  off?(event: 'change', listener: () => void): void;
}

const isScrollableElement = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;

  return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight + 1;
};

const resolveDocumentScrollElement = (documentRef: Document): HTMLElement | null => {
  const scrollingElement = documentRef.scrollingElement;
  if (scrollingElement instanceof HTMLElement) {
    return scrollingElement;
  }

  if (documentRef.documentElement instanceof HTMLElement) {
    return documentRef.documentElement;
  }

  if (documentRef.body instanceof HTMLElement) {
    return documentRef.body;
  }

  return null;
};

const findScrollContainer = (element: HTMLElement): HTMLElement => {
  if (isScrollableElement(element)) {
    return element;
  }

  let current: HTMLElement | null = element.parentElement;
  while (current) {
    if (isScrollableElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return resolveDocumentScrollElement(element.ownerDocument) ?? element;
};

const createScrollTargets = (element: HTMLElement, documentRef: Document): Array<EventTarget> => {
  const targets: Array<EventTarget> = [element];
  const documentScrollElement = resolveDocumentScrollElement(documentRef);

  if (documentScrollElement && documentScrollElement !== element) {
    targets.push(documentScrollElement);
  }

  targets.push(documentRef);
  if (documentRef.defaultView) {
    targets.push(documentRef.defaultView);
  }

  return [...new Set(targets)];
};

export interface EditorAdapter {
  element: EditorElement;
  scrollElement: HTMLElement;
  ownerDocument: Document;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  onInput(listener: () => void): () => void;
  onScroll(listener: () => void): () => void;
}

const isTextarea = (element: Element): element is HTMLTextAreaElement => {
  return element instanceof HTMLTextAreaElement;
};

const dispatchSyntheticInput = (target: HTMLElement | HTMLTextAreaElement, data: string) => {
  target.dispatchEvent(new InputEvent('input', { bubbles: true, data }));
};

const hasCodeMirrorClass = (element: Element): element is HTMLElement => {
  return element instanceof HTMLElement && element.classList.contains('CodeMirror');
};

const getCodeMirrorInstance = (element: HTMLElement): CodeMirrorLike | null => {
  const maybeInstance = (element as HTMLElement & { CodeMirror?: CodeMirrorLike }).CodeMirror;
  if (
    maybeInstance &&
    typeof maybeInstance.getValue === 'function' &&
    typeof maybeInstance.setValue === 'function' &&
    typeof maybeInstance.on === 'function'
  ) {
    return maybeInstance;
  }

  return null;
};

const readCodeMirrorText = (element: HTMLElement): string => {
  const instance = getCodeMirrorInstance(element);
  if (instance) {
    return instance.getValue();
  }

  const lineElements = [...element.querySelectorAll<HTMLElement>('.CodeMirror-code pre')];
  if (lineElements.length > 0) {
    return lineElements
      .map((lineElement) => lineElement.textContent ?? '')
      .join('\n');
  }

  const textarea = element.querySelector<HTMLTextAreaElement>('textarea');
  return textarea?.value ?? '';
};

const createCodeMirrorAdapter = (element: HTMLElement): EditorAdapter => ({
  element,
  scrollElement: findScrollContainer(
    element.querySelector<HTMLElement>('.CodeMirror-scroll') ?? element
  ),
  ownerDocument: element.ownerDocument,
  getMarkdown() {
    return normalizeMarkdownSource(readCodeMirrorText(element));
  },
  setMarkdown(markdown: string) {
    const instance = getCodeMirrorInstance(element);
    if (instance) {
      instance.setValue(markdown);
      return;
    }

    const textarea = element.querySelector<HTMLTextAreaElement>('textarea');
    if (textarea) {
      textarea.value = markdown;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    dispatchSyntheticInput(element, markdown);
  },
  onInput(listener: () => void) {
    const instance = getCodeMirrorInstance(element);
    if (instance) {
      const wrapped = () => listener();
      instance.on('change', wrapped);
      return () => instance.off?.('change', wrapped);
    }

    const textarea = element.querySelector<HTMLTextAreaElement>('textarea');
    if (textarea) {
      const wrapped = () => listener();
      textarea.addEventListener('input', wrapped);
      return () => textarea.removeEventListener('input', wrapped);
    }

    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    return () => element.removeEventListener('input', wrapped);
  },
  onScroll(listener: () => void) {
    const scrollElement = findScrollContainer(
      element.querySelector<HTMLElement>('.CodeMirror-scroll') ?? element
    );
    const targets = createScrollTargets(scrollElement, element.ownerDocument);

    for (const target of targets) {
      target.addEventListener('scroll', listener, { passive: true, capture: true });
    }

    return () => {
      for (const target of targets) {
        target.removeEventListener('scroll', listener, { capture: true });
      }
    };
  }
});

const createTextareaAdapter = (element: HTMLTextAreaElement): EditorAdapter => ({
  element,
  scrollElement: findScrollContainer(element),
  ownerDocument: element.ownerDocument,
  getMarkdown() {
    return normalizeMarkdownSource(element.value);
  },
  setMarkdown(markdown: string) {
    element.value = markdown;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    return () => element.removeEventListener('input', wrapped);
  },
  onScroll(listener: () => void) {
    const scrollElement = findScrollContainer(element);
    const targets = createScrollTargets(scrollElement, element.ownerDocument);

    for (const target of targets) {
      target.addEventListener('scroll', listener, { passive: true, capture: true });
    }

    return () => {
      for (const target of targets) {
        target.removeEventListener('scroll', listener, { capture: true });
      }
    };
  }
});

const createContentEditableAdapter = (element: HTMLElement): EditorAdapter => ({
  element,
  scrollElement: findScrollContainer(element),
  ownerDocument: element.ownerDocument,
  getMarkdown() {
    return normalizeMarkdownSource(element.innerText || element.textContent || '');
  },
  setMarkdown(markdown: string) {
    element.textContent = markdown;
    dispatchSyntheticInput(element, markdown);
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    return () => element.removeEventListener('input', wrapped);
  },
  onScroll(listener: () => void) {
    const targets = createScrollTargets(findScrollContainer(element), element.ownerDocument);

    for (const target of targets) {
      target.addEventListener('scroll', listener, { passive: true, capture: true });
    }

    return () => {
      for (const target of targets) {
        target.removeEventListener('scroll', listener, { capture: true });
      }
    };
  }
});

const createIframeBodyAdapter = (iframe: HTMLIFrameElement, body: HTMLElement): EditorAdapter => ({
  element: body,
  scrollElement: resolveDocumentScrollElement(iframe.contentDocument ?? body.ownerDocument) ?? body,
  ownerDocument: iframe.contentDocument ?? body.ownerDocument,
  getMarkdown() {
    return normalizeMarkdownSource(body.innerText || body.textContent || '');
  },
  setMarkdown(markdown: string) {
    body.textContent = markdown;
    dispatchSyntheticInput(body, markdown);
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    body.addEventListener('input', wrapped);
    return () => body.removeEventListener('input', wrapped);
  },
  onScroll(listener: () => void) {
    const documentRef = iframe.contentDocument ?? body.ownerDocument;
    const documentScrollElement = resolveDocumentScrollElement(documentRef);
    const targets = createScrollTargets(documentScrollElement ?? body, documentRef);

    for (const target of targets) {
      target.addEventListener('scroll', listener, { passive: true, capture: true });
    }

    return () => {
      for (const target of targets) {
        target.removeEventListener('scroll', listener, { capture: true });
      }
    };
  }
});

const isVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden'
  );
};

const getIdentityText = (element: HTMLElement): string => {
  return [
    element.id,
    element.className,
    element.getAttribute('name'),
    element.getAttribute('placeholder'),
    element.getAttribute('aria-label'),
    element.getAttribute('data-placeholder')
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const isLikelyTitleElement = (element: HTMLElement): boolean => {
  const identityText = getIdentityText(element);
  return /title|subject|heading|headline/.test(identityText);
};

const scoreCandidate = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  let score = 0;

  score += Math.min(rect.height, 1200) / 10;
  score += Math.min(rect.width, 1600) / 40;

  if (element instanceof HTMLTextAreaElement) {
    score += 20;
  }

  if (hasCodeMirrorClass(element)) {
    score += 140;
  }

  if (element.isContentEditable) {
    score += 12;
  }

  if (/content|editor|body|article|post|main|write/.test(getIdentityText(element))) {
    score += 60;
  }

  if (isLikelyTitleElement(element)) {
    score -= 120;
  }

  if (rect.height > 180) {
    score += 80;
  } else if (rect.height > 80) {
    score += 30;
  }

  if (element.tagName === 'TEXTAREA') {
    const textarea = element as HTMLTextAreaElement;
    if (textarea.rows > 4) {
      score += 40;
    }
  }

  return score;
};

const toAdapter = (candidate: Element | null): EditorAdapter | null => {
  if (!candidate) {
    return null;
  }

  if (hasCodeMirrorClass(candidate)) {
    return createCodeMirrorAdapter(candidate);
  }

  if (isTextarea(candidate)) {
    return createTextareaAdapter(candidate);
  }

  if (candidate instanceof HTMLElement && candidate.isContentEditable) {
    return createContentEditableAdapter(candidate);
  }

  return null;
};

export const detectEditorAdapter = (documentRef: Document): EditorAdapter | null => {
  const iframe = documentRef.querySelector<HTMLIFrameElement>('#editor-tistory_ifr');
  const iframeBody = iframe?.contentDocument?.querySelector<HTMLElement>('body#tinymce');
  if (iframe && iframeBody && isVisible(iframe)) {
    return createIframeBodyAdapter(iframe, iframeBody);
  }

  let bestCandidate: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const selector of EDITOR_SELECTORS) {
    const candidates = [...documentRef.querySelectorAll(selector)];

    for (const candidate of candidates) {
      if (!(candidate instanceof HTMLElement) || !isVisible(candidate)) {
        continue;
      }

      const score = scoreCandidate(candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
  }

  return toAdapter(bestCandidate);
};

export const detectEditorAdapterFromTarget = (target: EventTarget | null): EditorAdapter | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  const ownerDocument = target.ownerDocument;
  const frameElement = ownerDocument?.defaultView?.frameElement;
  if (frameElement instanceof HTMLIFrameElement && frameElement.id === 'editor-tistory_ifr') {
    const body = ownerDocument.querySelector<HTMLElement>('body#tinymce');
    if (body) {
      return createIframeBodyAdapter(frameElement, body);
    }
  }

  for (const selector of EDITOR_SELECTORS) {
    const matched = target.closest(selector);
    if (!(matched instanceof HTMLElement) || !isVisible(matched)) {
      continue;
    }

    if (isLikelyTitleElement(matched)) {
      continue;
    }

    const adapter = toAdapter(matched);
    if (adapter) {
      return adapter;
    }
  }

  return null;
};
