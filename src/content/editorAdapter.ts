import { normalizeMarkdownSource } from '../preview/normalizeMarkdownSource';

const CONTENTEDITABLE_SELECTOR = '[contenteditable]:not([contenteditable="false"])';

const EDITOR_SELECTORS = [
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

export interface EditorAdapter {
  element: EditorElement;
  ownerDocument: Document;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  onInput(listener: () => void): () => void;
}

const isTextarea = (element: Element): element is HTMLTextAreaElement => {
  return element instanceof HTMLTextAreaElement;
};

const createTextareaAdapter = (element: HTMLTextAreaElement): EditorAdapter => ({
  element,
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
  }
});

const createContentEditableAdapter = (element: HTMLElement): EditorAdapter => ({
  element,
  ownerDocument: element.ownerDocument,
  getMarkdown() {
    return normalizeMarkdownSource(element.innerText || element.textContent || '');
  },
  setMarkdown(markdown: string) {
    element.textContent = markdown;
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: markdown }));
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    return () => element.removeEventListener('input', wrapped);
  }
});

const createIframeBodyAdapter = (iframe: HTMLIFrameElement, body: HTMLElement): EditorAdapter => ({
  element: body,
  ownerDocument: iframe.contentDocument ?? body.ownerDocument,
  getMarkdown() {
    return normalizeMarkdownSource(body.innerText || body.textContent || '');
  },
  setMarkdown(markdown: string) {
    body.textContent = markdown;
    body.dispatchEvent(new InputEvent('input', { bubbles: true, data: markdown }));
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    body.addEventListener('input', wrapped);
    return () => body.removeEventListener('input', wrapped);
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
  if (iframe && iframeBody) {
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
