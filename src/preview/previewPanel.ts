import { renderMarkdown } from './renderMarkdown';

const PANEL_ID = 'tistory-md-preview-panel';
const BODY_ID = 'tistory-md-preview-body';

const panelStyles = `
  position: fixed;
  top: 24px;
  right: 24px;
  width: min(42vw, 680px);
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  background: #fffdf8;
  box-shadow: 0 18px 60px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  z-index: 2147483000;
  font-family: Georgia, 'Times New Roman', serif;
`;

const bodyStyles = `
  flex: 1;
  overflow: auto;
  padding: 24px 28px 48px;
  color: #1f2937;
  line-height: 1.7;
  font-size: 15px;
  background:
    radial-gradient(circle at top right, rgba(252, 211, 77, 0.16), transparent 28%),
    linear-gradient(180deg, #fffdf8 0%, #fffaf0 100%);
`;

const headerStyles = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
`;

const titleStyles = `
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #92400e;
`;

export interface PreviewPanelController {
  element: HTMLElement;
  body: HTMLElement;
  setMarkdown(markdown: string): void;
  setVisible(visible: boolean): void;
}

const createBody = (): HTMLDivElement => {
  const body = document.createElement('div');
  body.id = BODY_ID;
  body.setAttribute('style', bodyStyles);
  body.innerHTML = '<p>Markdown preview will appear here.</p>';
  return body;
};

export const createPreviewPanel = (): PreviewPanelController => {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    const body = existing.querySelector<HTMLElement>(`#${BODY_ID}`);
    if (!body) {
      throw new Error('Preview panel exists without a body element.');
    }

    return {
      element: existing,
      body,
      setMarkdown(markdown: string) {
        body.innerHTML = renderMarkdown(markdown);
      },
      setVisible(visible: boolean) {
        existing.style.display = visible ? 'flex' : 'none';
      }
    };
  }

  const panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.setAttribute('style', panelStyles);

  const header = document.createElement('header');
  header.setAttribute('style', headerStyles);

  const title = document.createElement('h2');
  title.textContent = 'Preview';
  title.setAttribute('style', titleStyles);

  const status = document.createElement('span');
  status.textContent = 'Live';
  status.setAttribute(
    'style',
    'font-size: 12px; color: #065f46; background: #d1fae5; border-radius: 999px; padding: 4px 8px;'
  );

  const body = createBody();

  header.append(title, status);
  panel.append(header, body);
  document.body.append(panel);

  return {
    element: panel,
    body,
    setMarkdown(markdown: string) {
      body.innerHTML = renderMarkdown(markdown);
    },
    setVisible(visible: boolean) {
      panel.style.display = visible ? 'flex' : 'none';
    }
  };
};
