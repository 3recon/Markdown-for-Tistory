const CONTROLS_ID = 'tistory-md-controls';

const fixedControlsStyle = `
  position: fixed;
  top: 24px;
  right: min(42vw + 40px, 720px);
  display: flex;
  gap: 10px;
  z-index: 2147483001;
`;

const inlineControlsStyle = `
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  vertical-align: middle;
`;

const buttonBaseStyle = `
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
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
        text.includes('마크다운') ||
        text.includes('기본모드') ||
        text === 'HTML';

      return isModeLike && rect.top >= 0 && rect.top < 180;
    })
    .sort((left, right) => right.rect.left - left.rect.left);

  return matches[0]?.element ?? null;
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
  previewButton.textContent = '미리보기';
  previewButton.addEventListener('click', options.onTogglePreview);

  root.append(previewButton);

  const anchor = findModeDropdownAnchor();
  if (anchor?.parentElement) {
    root.setAttribute('style', inlineControlsStyle);
    anchor.insertAdjacentElement('afterend', root);
  } else {
    root.setAttribute('style', fixedControlsStyle);
    document.body.append(root);
  }

  const setState = (state: ModeControlsState) => {
    applyButtonState(previewButton, state.previewEnabled);
  };

  setState(options.initialState);

  return {
    setState
  };
};
