const CONTROLS_ID = 'tistory-md-controls';

const controlsStyle = `
  position: fixed;
  top: 24px;
  right: min(42vw + 40px, 720px);
  display: flex;
  gap: 10px;
  z-index: 2147483001;
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
  markdownModeEnabled: boolean;
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

export const createModeControls = (options: {
  initialState: ModeControlsState;
  onToggleMarkdownMode(): void;
  onTogglePreview(): void;
}): ModeControlsController => {
  const existing = document.getElementById(CONTROLS_ID);
  if (existing) {
    existing.remove();
  }

  const root = document.createElement('div');
  root.id = CONTROLS_ID;
  root.setAttribute('style', controlsStyle);

  const markdownButton = document.createElement('button');
  markdownButton.type = 'button';
  markdownButton.textContent = 'Markdown 모드';

  const previewButton = document.createElement('button');
  previewButton.type = 'button';
  previewButton.textContent = '미리보기';

  markdownButton.addEventListener('click', options.onToggleMarkdownMode);
  previewButton.addEventListener('click', options.onTogglePreview);

  root.append(markdownButton, previewButton);
  document.body.append(root);

  const setState = (state: ModeControlsState) => {
    applyButtonState(markdownButton, state.markdownModeEnabled);
    applyButtonState(previewButton, state.markdownModeEnabled && state.previewEnabled);
    previewButton.disabled = !state.markdownModeEnabled;
    previewButton.style.opacity = state.markdownModeEnabled ? '1' : '0.55';
  };

  setState(options.initialState);

  return {
    setState
  };
};
