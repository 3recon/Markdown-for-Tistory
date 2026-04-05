const TAG_SELECTORS = [
  'input[name*="tag" i]',
  'textarea[name*="tag" i]',
  'input[id*="tag" i]',
  'textarea[id*="tag" i]',
  'input[placeholder*="tag" i]',
  'textarea[placeholder*="tag" i]',
  'input[aria-label*="tag" i]',
  'textarea[aria-label*="tag" i]',
  '[contenteditable][placeholder*="tag" i]',
  '[contenteditable][aria-label*="tag" i]',
  '[contenteditable][data-placeholder*="tag" i]'
];

type TagElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

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

const readTagText = (element: TagElement): string => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  return element.innerText || element.textContent || '';
};

const writeTagText = (element: TagElement, value: string) => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  element.textContent = value;
  element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

export const parseTagText = (value: string): string[] => {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim().replace(/^#+/, '').trim())
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
};

export const stringifyTags = (tags: string[]): string => {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, items) => items.indexOf(tag) === index)
    .join(', ');
};

export interface TagAdapter {
  element: TagElement;
  getTags(): string[];
  setTags(tags: string[]): void;
  onInput(listener: () => void): () => void;
}

const createTagAdapter = (element: TagElement): TagAdapter => ({
  element,
  getTags() {
    return parseTagText(readTagText(element));
  },
  setTags(tags: string[]) {
    writeTagText(element, stringifyTags(tags));
  },
  onInput(listener: () => void) {
    const wrapped = () => listener();
    element.addEventListener('input', wrapped);
    element.addEventListener('change', wrapped);

    return () => {
      element.removeEventListener('input', wrapped);
      element.removeEventListener('change', wrapped);
    };
  }
});

const scoreCandidate = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  const identity = getIdentityText(element);
  let score = 0;

  if (/tag/.test(identity)) {
    score += 220;
  }

  if (/title|subject|editor|content|body|search/.test(identity)) {
    score -= 180;
  }

  if (element instanceof HTMLInputElement) {
    score += 100;
  }

  if (element instanceof HTMLTextAreaElement) {
    score += 70;
  }

  if (element.isContentEditable) {
    score += 50;
  }

  if (rect.top < 720) {
    score += 30;
  }

  if (rect.height < 80) {
    score += 20;
  }

  return score;
};

const toTagElement = (element: Element | null): TagElement | null => {
  if (!element) {
    return null;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element;
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return element;
  }

  return null;
};

export const detectTagAdapter = (documentRef: Document): TagAdapter | null => {
  let bestCandidate: TagElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const selector of TAG_SELECTORS) {
    const candidates = [...documentRef.querySelectorAll(selector)];

    for (const candidate of candidates) {
      const tagElement = toTagElement(candidate);
      if (!(tagElement instanceof HTMLElement) || !isVisible(tagElement)) {
        continue;
      }

      const score = scoreCandidate(tagElement);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = tagElement;
      }
    }
  }

  return bestCandidate ? createTagAdapter(bestCandidate) : null;
};
