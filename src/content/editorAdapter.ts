const EDITOR_SELECTORS = [
  'textarea',
  '[contenteditable="true"]',
  '.CodeMirror textarea',
  '.tt-editor textarea',
  '.tt_editor textarea'
];

type EditorElement = HTMLTextAreaElement | HTMLElement;

export interface EditorAdapter {
  element: EditorElement;
  getMarkdown(): string;
  setMarkdown(markdown: string): void;
  onInput(listener: () => void): () => void;
}

const isTextarea = (element: Element): element is HTMLTextAreaElement => {
  return element instanceof HTMLTextAreaElement;
};

const createTextareaAdapter = (element: HTMLTextAreaElement): EditorAdapter => ({
  element,
  getMarkdown() {
    return element.value;
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
  getMarkdown() {
    return element.innerText || element.textContent || '';
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

export const detectEditorAdapter = (documentRef: Document): EditorAdapter | null => {
  for (const selector of EDITOR_SELECTORS) {
    const candidates = [...documentRef.querySelectorAll(selector)];

    for (const candidate of candidates) {
      if (isTextarea(candidate)) {
        return createTextareaAdapter(candidate);
      }

      if (candidate instanceof HTMLElement && candidate.isContentEditable) {
        return createContentEditableAdapter(candidate);
      }
    }
  }

  return null;
};
