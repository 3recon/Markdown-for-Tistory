import { renderMarkdown } from './renderMarkdown';

const PANEL_ID = 'tistory-md-preview-panel';
const BODY_ID = 'tistory-md-preview-body';
const ARTICLE_TITLE_ID = 'tistory-md-preview-title';
const CONTENT_ID = 'tistory-md-preview-content';
const BOTTOM_SPACER_ID = 'tistory-md-preview-bottom-spacer';
const STYLE_ID = 'tistory-md-preview-style';
const PREVIEW_OPEN_CLASS = 'tistory-md-preview-open';
const PREVIEW_WIDTH = 'min(38vw, 760px)';
const PREVIEW_GAP_PX = 24;

const panelStyles = `
  position: fixed;
  top: 24px;
  right: 24px;
  width: ${PREVIEW_WIDTH};
  height: calc(100vh - 48px);
  display: block;
  min-height: 0;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.1);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  z-index: 2147483000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const bodyStyles = `
  display: block;
  padding: 70px 24px 0;
  color: #333;
  line-height: 1.8;
  font-size: 16px;
  background: #ffffff;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, sans-serif;
`;

export interface PreviewPanelController {
  element: HTMLElement;
  body: HTMLElement;
  scrollElement: HTMLElement;
  syncLayout(anchor: HTMLElement): void;
  setTitle(title: string): void;
  setMarkdown(markdown: string): void;
  setVisible(visible: boolean): void;
}

const applyPanelLayout = (panel: HTMLElement, anchor: HTMLElement) => {
  const rect = anchor.getBoundingClientRect();
  const top = Math.max(rect.top, 24);
  const bottomGap = 24;
  const height = Math.max(
    Math.min(rect.height, window.innerHeight - top - bottomGap),
    320
  );

  panel.style.top = `${top}px`;
  panel.style.height = `${height}px`;
};

const ensurePreviewStyles = () => {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --tistory-md-preview-width: ${PREVIEW_WIDTH};
      --tistory-md-preview-gap: ${PREVIEW_GAP_PX}px;
      --tistory-md-preview-reserved-space: calc(var(--tistory-md-preview-width) + var(--tistory-md-preview-gap) + 24px);
      --tistory-md-editor-safe-width: calc(100vw - var(--tistory-md-preview-width) - var(--tistory-md-preview-gap) - 72px);
    }

    body.${PREVIEW_OPEN_CLASS} {
      overflow-x: hidden !important;
    }

    body.${PREVIEW_OPEN_CLASS} #post-editor-app {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      margin-right: 0 !important;
      padding-right: 0 !important;
      overflow-x: hidden !important;
      overflow-y: visible !important;
    }

    body.${PREVIEW_OPEN_CLASS} #editorContainer {
      box-sizing: border-box !important;
      width: var(--tistory-md-editor-safe-width) !important;
      max-width: var(--tistory-md-editor-safe-width) !important;
      min-width: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      transition: width 180ms ease, max-width 180ms ease !important;
    }

    body.${PREVIEW_OPEN_CLASS} .markdown-editor {
      max-width: none !important;
      min-width: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
      overflow-y: visible !important;
    }

    #${PANEL_ID}, #${PANEL_ID} * {
      box-sizing: border-box;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style {
      margin-bottom: 12px;
      color: #333;
      font-size: 16px;
      line-height: 1.875;
      word-break: break-word;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style > * {
      margin: 20px 0 0 0 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style > :first-child {
      margin-top: 0 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style p {
      display: block !important;
      margin-bottom: 1.25em !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h1,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h2,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h3,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h4 {
      display: block !important;
      margin-bottom: 24px !important;
      font-weight: 900 !important;
      color: rgba(0, 0, 0, 0.87) !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h1 {
      font-size: 32px !important;
      line-height: 1.33 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h2 {
      font-size: 1.5em !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h3 {
      font-size: 1.25em !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h5,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style h6 {
      display: block !important;
      color: rgba(0, 0, 0, 0.87) !important;
      font-weight: 700 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ul,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ol {
      display: block !important;
      margin: 0 0 1.25em !important;
      padding-left: 1.8em !important;
      list-style-position: outside !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ul {
      list-style: disc !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ol {
      list-style: decimal !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style li {
      margin: 0.3em 0 !important;
      display: list-item !important;
      list-style: inherit !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style input[type="checkbox"] {
      appearance: auto !important;
      -webkit-appearance: checkbox !important;
      display: inline-block !important;
      width: 13px !important;
      height: 13px !important;
      margin: 0 0.35em 0 0 !important;
      vertical-align: baseline !important;
      accent-color: #2563eb !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: none !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style input[type="checkbox"][disabled] {
      cursor: default !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style li > ul,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style li > ol {
      margin: 0.35em 0 0.35em !important;
      padding-left: 1.4em !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ul ul,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ol ul {
      list-style-type: circle !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ul ul ul,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ol ul ul,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style ul ol ul {
      list-style-type: square !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style em {
      font-style: italic !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style strong {
      font-weight: 700 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style pre {
      display: block !important;
      margin: 20px 0 0 !important;
      padding: 0 !important;
      overflow: auto !important;
      border-radius: 0 !important;
      background: rgba(0, 0, 0, 0.05) !important;
      color: rgba(34, 85, 51, 0.87) !important;
      border: 0 none !important;
      font-family: monospace, monospace !important;
      font-size: 16px !important;
      line-height: 18.4px !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style pre code {
      background: rgb(250, 250, 250) !important;
      padding: 20px !important;
      color: rgb(56, 58, 66) !important;
      display: block !important;
      line-height: 23.94px !important;
      font-size: 14px !important;
      border: 1px solid rgb(235, 235, 235) !important;
      font-family: "SF Mono", Menlo, Consolas, Monaco, monospace !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style .hljs {
      color: rgb(56, 58, 66) !important;
      background: rgb(250, 250, 250) !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style .hljs-built_in,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style .hljs-keyword {
      color: #005cc5 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style .hljs-string {
      color: #0a7f3f !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style table {
      display: table !important;
      width: auto !important;
      max-width: 100% !important;
      margin: 20px 0 0 0 !important;
      border-collapse: collapse !important;
      table-layout: auto !important;
      border-color: #ddd !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style th,
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style td {
      display: table-cell !important;
      border: 1px solid #ddd !important;
      text-align: left !important;
      vertical-align: middle !important;
      word-break: break-word !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style thead tr {
      background: rgba(0, 0, 0, 0.05) !important;
      font-size: 16px !important;
      color: #000 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style th {
      padding: 7px !important;
      font-weight: 700 !important;
      color: inherit !important;
      font-size: 16px !important;
      line-height: 18.4px !important;
      text-align: center !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style td {
      padding: 8px !important;
      font-size: 15px !important;
      line-height: 17.25px !important;
      color: #333 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style th[align="center"],
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style td[align="center"] {
      text-align: center !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style th[align="right"],
    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style td[align="right"] {
      text-align: right !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style blockquote[data-ke-style="style1"] {
      display: block !important;
      margin: 20px auto 0 !important;
      padding: 34px 0 0 0 !important;
      text-align: center !important;
      background: url("https://t1.daumcdn.net/tistory_admin/static/image/blockquote-style1.svg") no-repeat 50% 0 !important;
      border: 0 none !important;
      font-family: 'Noto Serif KR', serif !important;
      font-size: 15pt !important;
      color: #333 !important;
      line-height: 1.67 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style blockquote[data-ke-style="style1"] p {
      margin: 0 !important;
      font-family: inherit !important;
      font-size: inherit !important;
      color: inherit !important;
      line-height: inherit !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style hr {
      display: block !important;
      border: 0 !important;
      border-top: 1px solid #e5e7eb !important;
      margin: 1.75em 0 !important;
    }

    #${CONTENT_ID}.article-view.tt_article_useless_p_margin.contents_style a {
      color: #3b82f6 !important;
      text-decoration: underline !important;
    }
  `;

  document.head.append(style);
};

const createBody = (): HTMLDivElement => {
  const body = document.createElement('div');
  body.id = BODY_ID;
  body.setAttribute('style', bodyStyles);

  return body;
};

const createArticleTitle = (): HTMLHeadingElement => {
  const title = document.createElement('h1');
  title.id = ARTICLE_TITLE_ID;
  title.setAttribute(
    'style',
    [
      'margin: 0 0 24px',
      'font-size: 32px',
      'line-height: 1.33',
      'font-weight: 900',
      'color: rgba(0, 0, 0, 0.87)'
    ].join('; ')
  );
  title.textContent = '제목을 입력하세요';
  return title;
};

const createContentRoot = (): HTMLDivElement => {
  const content = document.createElement('div');
  content.id = CONTENT_ID;
  content.className = 'article-view tt_article_useless_p_margin contents_style';
  content.innerHTML = '<p>Markdown preview will appear here.</p>';
  return content;
};

const createBottomSpacer = (): HTMLDivElement => {
  const spacer = document.createElement('div');
  spacer.id = BOTTOM_SPACER_ID;
  spacer.setAttribute('style', 'height: 100px;');
  return spacer;
};

const setSplitViewVisible = (visible: boolean): void => {
  document.body.classList.toggle(PREVIEW_OPEN_CLASS, visible);
};

export const createPreviewPanel = (): PreviewPanelController => {
  ensurePreviewStyles();

  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    const body = existing.querySelector<HTMLElement>(`#${BODY_ID}`);
    const articleTitle = existing.querySelector<HTMLElement>(`#${ARTICLE_TITLE_ID}`);
    const content = existing.querySelector<HTMLElement>(`#${CONTENT_ID}`);
    const spacer =
      existing.querySelector<HTMLElement>(`#${BOTTOM_SPACER_ID}`) ??
      createBottomSpacer();

    if (!body || !articleTitle || !content) {
      throw new Error('Preview panel exists without required elements.');
    }

    if (!spacer.isConnected) {
      body.append(spacer);
    }

    return {
      element: existing,
      body,
      scrollElement: existing,
      syncLayout(anchor: HTMLElement) {
        applyPanelLayout(existing, anchor);
      },
      setTitle(title: string) {
        articleTitle.textContent = title || '제목을 입력하세요';
      },
      setMarkdown(markdown: string) {
        content.innerHTML = renderMarkdown(markdown);
      },
      setVisible(visible: boolean) {
        existing.style.display = visible ? 'flex' : 'none';
        setSplitViewVisible(visible);
      }
    };
  }

  const panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.setAttribute('style', panelStyles);

  const body = createBody();
  const articleTitle = createArticleTitle();
  const content = createContentRoot();
  const spacer = createBottomSpacer();
  body.append(articleTitle, content, spacer);

  panel.append(body);
  document.body.append(panel);

  return {
    element: panel,
    body,
    scrollElement: panel,
    syncLayout(anchor: HTMLElement) {
      applyPanelLayout(panel, anchor);
    },
    setTitle(title: string) {
      articleTitle.textContent = title || '제목을 입력하세요';
    },
    setMarkdown(markdown: string) {
      content.innerHTML = renderMarkdown(markdown);
    },
    setVisible(visible: boolean) {
      panel.style.display = visible ? 'flex' : 'none';
      setSplitViewVisible(visible);
    }
  };
};
