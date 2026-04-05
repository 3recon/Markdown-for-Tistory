const TITLE_SELECTORS = [
  'input[name="title"]',
  'textarea[name="title"]',
  'input[placeholder*="제목"]',
  'textarea[placeholder*="제목"]',
  '[contenteditable][placeholder*="제목"]',
  '[contenteditable][data-placeholder*="제목"]',
  'h1[contenteditable]',
  '[role="textbox"][contenteditable]'
];

export interface TitleAdapter {
  getValue(): string;
  onInput(listener: () => void): () => void;
}

const asTextInput = (element: Element): HTMLInputElement | HTMLTextAreaElement | null => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element;
  }

  return null;
};

const createTextInputAdapter = (
  element: HTMLInputElement | HTMLTextAreaElement
): TitleAdapter => ({
  getValue() {
    return element.value.trim();
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    return () => element.removeEventListener('input', wrapped);
  }
});

const createContentEditableAdapter = (element: HTMLElement): TitleAdapter => ({
  getValue() {
    return (element.innerText || element.textContent || '').trim();
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    return () => element.removeEventListener('input', wrapped);
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

const scoreCandidate = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  const identity = getIdentityText(element);
  let score = 0;

  if (rect.top < 420) {
    score += 80;
  }

  if (rect.height < 140) {
    score += 40;
  }

  if (rect.width > 400) {
    score += 30;
  }

  if (element.tagName === 'H1') {
    score += 120;
  }

  if (element instanceof HTMLInputElement) {
    score += 80;
  }

  if (element instanceof HTMLTextAreaElement && element.rows <= 3) {
    score += 60;
  }

  if (element.isContentEditable) {
    score += 40;
  }

  if (/title|subject|heading|headline|제목/.test(identity)) {
    score += 160;
  }

  if (/category|카테고리|tag|태그|search/.test(identity)) {
    score -= 160;
  }

  return score;
};

const toAdapter = (element: Element | null): TitleAdapter | null => {
  if (!element) {
    return null;
  }

  const textInput = asTextInput(element);
  if (textInput) {
    return createTextInputAdapter(textInput);
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return createContentEditableAdapter(element);
  }

  return null;
};

export const detectTitleAdapter = (documentRef: Document): TitleAdapter | null => {
  let bestElement: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const selector of TITLE_SELECTORS) {
    const candidates = [...documentRef.querySelectorAll(selector)];

    for (const candidate of candidates) {
      if (!(candidate instanceof HTMLElement) || !isVisible(candidate)) {
        continue;
      }

      const score = scoreCandidate(candidate);
      if (score > bestScore) {
        bestScore = score;
        bestElement = candidate;
      }
    }
  }

  return toAdapter(bestElement);
};
