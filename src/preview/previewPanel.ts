import { renderMarkdown } from './renderMarkdown';

const PANEL_ID = 'tistory-md-preview-panel';
const BODY_ID = 'tistory-md-preview-body';
const ARTICLE_TITLE_ID = 'tistory-md-preview-title';
const STYLE_ID = 'tistory-md-preview-style';

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
  setTitle(title: string): void;
  setMarkdown(markdown: string): void;
  setVisible(visible: boolean): void;
}

const ensurePreviewStyles = () => {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID}, #${PANEL_ID} * {
      box-sizing: border-box;
    }

    #${BODY_ID} p {
      display: block !important;
      margin: 0 0 1em !important;
    }

    #${BODY_ID} h1,
    #${BODY_ID} h2,
    #${BODY_ID} h3,
    #${BODY_ID} h4,
    #${BODY_ID} h5,
    #${BODY_ID} h6 {
      display: block !important;
      margin: 1.4em 0 0.6em !important;
      line-height: 1.25 !important;
      color: #111827 !important;
      font-weight: 700 !important;
    }

    #${BODY_ID} h1 {
      font-size: 2em !important;
    }

    #${BODY_ID} h2 {
      font-size: 1.6em !important;
    }

    #${BODY_ID} h3 {
      font-size: 1.3em !important;
    }

    #${BODY_ID} ul,
    #${BODY_ID} ol {
      display: block !important;
      margin: 0 0 1em !important;
      padding-left: 1.6em !important;
      list-style-position: outside !important;
    }

    #${BODY_ID} ul {
      list-style: disc !important;
    }

    #${BODY_ID} ol {
      list-style: decimal !important;
    }

    #${BODY_ID} li {
      margin: 0.25em 0 !important;
      display: list-item !important;
      list-style: inherit !important;
    }

    #${BODY_ID} li > ul,
    #${BODY_ID} li > ol {
      margin: 0.35em 0 0.35em !important;
      padding-left: 1.4em !important;
    }

    #${BODY_ID} em {
      font-style: italic !important;
    }

    #${BODY_ID} strong {
      font-weight: 700 !important;
    }

    #${BODY_ID} code {
      font-family: 'Consolas', 'Courier New', monospace !important;
      font-size: 0.92em !important;
      background: rgba(15, 23, 42, 0.06) !important;
      padding: 0.15em 0.35em !important;
      border-radius: 6px !important;
    }

    #${BODY_ID} pre {
      display: block !important;
      margin: 0 0 1.25em !important;
      padding: 16px !important;
      overflow: auto !important;
      border-radius: 12px !important;
      background: #111827 !important;
      color: #f9fafb !important;
    }

    #${BODY_ID} pre code {
      background: transparent !important;
      padding: 0 !important;
      color: inherit !important;
    }

    #${BODY_ID} table {
      display: table !important;
      width: 100% !important;
      margin: 0 0 1.25em !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
    }

    #${BODY_ID} th,
    #${BODY_ID} td {
      display: table-cell !important;
      border: 1px solid rgba(15, 23, 42, 0.14) !important;
      padding: 10px 12px !important;
      text-align: left !important;
      vertical-align: top !important;
      word-break: break-word !important;
    }

    #${BODY_ID} th {
      background: rgba(146, 64, 14, 0.08) !important;
      font-weight: 700 !important;
    }

    #${BODY_ID} blockquote {
      display: block !important;
      margin: 0 0 1.25em !important;
      padding: 0.2em 0 0.2em 1em !important;
      border-left: 4px solid rgba(146, 64, 14, 0.45) !important;
      color: #4b5563 !important;
    }

    #${BODY_ID} hr {
      display: block !important;
      border: 0 !important;
      border-top: 1px solid rgba(15, 23, 42, 0.12) !important;
      margin: 1.5em 0 !important;
    }

    #${BODY_ID} a {
      color: #9a3412 !important;
      text-decoration: underline !important;
    }
  `;

  document.head.append(style);
};

const createBody = (): HTMLDivElement => {
  const body = document.createElement('div');
  body.id = BODY_ID;
  body.setAttribute('style', bodyStyles);
  body.innerHTML = '<p>Markdown preview will appear here.</p>';
  return body;
};

const createArticleTitle = (): HTMLHeadingElement => {
  const title = document.createElement('h1');
  title.id = ARTICLE_TITLE_ID;
  title.setAttribute(
    'style',
    [
      'margin: 0 0 24px',
      'font-size: 34px',
      'line-height: 1.2',
      'font-weight: 700',
      'color: #111827',
      'letter-spacing: -0.03em'
    ].join('; ')
  );
  title.textContent = '제목을 입력하세요';
  return title;
};

export const createPreviewPanel = (): PreviewPanelController => {
  ensurePreviewStyles();

  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    const body = existing.querySelector<HTMLElement>(`#${BODY_ID}`);
    const articleTitle = existing.querySelector<HTMLElement>(`#${ARTICLE_TITLE_ID}`);
    if (!body || !articleTitle) {
      throw new Error('Preview panel exists without required elements.');
    }

    return {
      element: existing,
      body,
      setTitle(title: string) {
        articleTitle.textContent = title || '제목을 입력하세요';
      },
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
  const articleTitle = createArticleTitle();
  body.prepend(articleTitle);

  header.append(title, status);
  panel.append(header, body);
  document.body.append(panel);

  return {
    element: panel,
    body,
    setTitle(title: string) {
      articleTitle.textContent = title || '제목을 입력하세요';
    },
    setMarkdown(markdown: string) {
      body.innerHTML = renderMarkdown(markdown);
      body.prepend(articleTitle);
    },
    setVisible(visible: boolean) {
      panel.style.display = visible ? 'flex' : 'none';
    }
  };
};
