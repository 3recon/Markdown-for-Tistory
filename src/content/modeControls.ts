const CONTROLS_ID = 'tistory-md-controls';

const fallbackControlsStyle = `
  position: fixed;
  top: 24px;
  right: min(42vw + 40px, 720px);
  display: flex;
  gap: 10px;
  z-index: 2147483001;
`;

const buttonBaseStyle = `
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  color: #111827;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
`;

export interface ModeControlsState {
  previewEnabled: boolean;
}

export interface ModeControlsController {
  setState(state: ModeControlsState): void;
  reposition(): void;
  setVisible(visible: boolean): void;
}

const applyButtonState = (button: HTMLButtonElement, active: boolean) => {
  button.setAttribute(
    'style',
    `${buttonBaseStyle} ${
      active
        ? 'background: #111827; color: #fff7ed; border-color: #111827;'
        : 'background: rgba(255, 255, 255, 0.95); color: #111827;'
    }`
  );
};

const MARKDOWN_MODE_TEXT = '\uB9C8\uD06C\uB2E4\uC6B4';
const BASIC_MODE_TEXT = '\uAE30\uBCF8\uBAA8\uB4DC';
const PREVIEW_BUTTON_TEXT = '\uBBF8\uB9AC\uBCF4\uAE30';

const findModeDropdownAnchor = (): HTMLElement | null => {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('button, [role="button"], .btn, .selectbox, .dropdown')
  );

  const matches = candidates
    .map((element) => {
      const text = (element.textContent ?? '').replace(/\s+/g, '');
      const rect = element.getBoundingClientRect();
      return { element, text, rect };
    })
    .filter(({ text, rect }) => {
      if (!text || rect.width <= 0 || rect.height <= 0) {
        return false;
      }

      const isModeLike =
        text.includes(MARKDOWN_MODE_TEXT) ||
        text.includes(BASIC_MODE_TEXT) ||
        text === 'HTML';

      return isModeLike && rect.top >= 0 && rect.top < 180;
    })
    .sort((left, right) => right.rect.left - left.rect.left);

  return matches[0]?.element ?? null;
};

export const isMarkdownModeActive = (): boolean => {
  const anchor = findModeDropdownAnchor();
  const text = (anchor?.textContent ?? '').replace(/\s+/g, '');
  return text.includes(MARKDOWN_MODE_TEXT);
};

const applyPositionNearAnchor = (root: HTMLDivElement, anchor: HTMLElement): void => {
  const rect = anchor.getBoundingClientRect();
  root.setAttribute(
    'style',
    [
      'position: fixed',
      `top: ${Math.round(rect.top + (rect.height - 40) / 2)}px`,
      `left: ${Math.round(rect.right + 12)}px`,
      'display: flex',
      'gap: 10px',
      'z-index: 2147483001'
    ].join('; ')
  );
};

export const createModeControls = (options: {
  initialState: ModeControlsState;
  onTogglePreview(): void;
}): ModeControlsController => {
  const existing = document.getElementById(CONTROLS_ID);
  if (existing) {
    existing.remove();
  }

  const root = document.createElement('div');
  root.id = CONTROLS_ID;

  const previewButton = document.createElement('button');
  previewButton.type = 'button';
  previewButton.textContent = PREVIEW_BUTTON_TEXT;
  previewButton.addEventListener('click', options.onTogglePreview);

  root.append(previewButton);
  document.body.append(root);

  const reposition = () => {
    const anchor = findModeDropdownAnchor();
    if (anchor) {
      applyPositionNearAnchor(root, anchor);
      return;
    }

    root.setAttribute('style', fallbackControlsStyle);
  };

  reposition();

  const setState = (state: ModeControlsState) => {
    applyButtonState(previewButton, state.previewEnabled);
  };

  const setVisible = (visible: boolean) => {
    root.style.display = visible ? 'flex' : 'none';
  };

  setState(options.initialState);

  return {
    reposition,
    setState,
    setVisible
  };
};
