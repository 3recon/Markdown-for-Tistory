import { renderMarkdown } from './renderMarkdown';

const PANEL_ID = 'tistory-md-preview-panel';
const BODY_ID = 'tistory-md-preview-body';
const ARTICLE_TITLE_ID = 'tistory-md-preview-title';
const CONTENT_ID = 'tistory-md-preview-content';
const STYLE_ID = 'tistory-md-preview-style';

const panelStyles = `
  position: fixed;
  top: 24px;
  right: 24px;
  width: min(42vw, 680px);
  height: calc(100vh - 48px);
  display: block;
  min-height: 0;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.1);
  overflow: hidden;
  z-index: 2147483000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const bodyStyles = `
  position: absolute;
  top: 58px;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  overflow-y: scroll;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  padding: 20px 20px 50px;
  color: #333;
  line-height: 1.8;
  font-size: 16px;
  background: #ffffff;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, sans-serif;
`;

const headerStyles = `
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.98);
`;

const titleStyles = `
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
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
  body.tabIndex = 0;

  body.addEventListener(
    'wheel',
    (event) => {
      const maxScroll = Math.max(body.scrollHeight - body.clientHeight, 0);
      if (maxScroll === 0) {
        return;
      }

      const nextScrollTop = Math.min(Math.max(body.scrollTop + event.deltaY, 0), maxScroll);
      if (Math.abs(nextScrollTop - body.scrollTop) < 1) {
        return;
      }

      body.scrollTop = nextScrollTop;
      event.preventDefault();
    },
    { passive: false }
  );

  return body;
};

const attachPanelWheelProxy = (panel: HTMLElement, body: HTMLElement) => {
  panel.addEventListener(
    'wheel',
    (event) => {
      const target = event.target;
      if (!(target instanceof Node) || !panel.contains(target)) {
        return;
      }

      const interactiveScrollable = target instanceof HTMLElement
        ? target.closest('pre, table, [data-preview-scroll-ignore]')
        : null;
      if (interactiveScrollable instanceof HTMLElement) {
        const canScrollInternally =
          interactiveScrollable.scrollHeight > interactiveScrollable.clientHeight + 1 ||
          interactiveScrollable.scrollWidth > interactiveScrollable.clientWidth + 1;

        if (canScrollInternally) {
          return;
        }
      }

      const maxScroll = Math.max(body.scrollHeight - body.clientHeight, 0);
      if (maxScroll === 0) {
        return;
      }

      const nextScrollTop = Math.min(Math.max(body.scrollTop + event.deltaY, 0), maxScroll);
      if (Math.abs(nextScrollTop - body.scrollTop) < 1) {
        return;
      }

      body.scrollTop = nextScrollTop;
      event.preventDefault();
    },
    { passive: false, capture: true }
  );
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

export const createPreviewPanel = (): PreviewPanelController => {
  ensurePreviewStyles();

  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    const body = existing.querySelector<HTMLElement>(`#${BODY_ID}`);
    const articleTitle = existing.querySelector<HTMLElement>(`#${ARTICLE_TITLE_ID}`);
    const content = existing.querySelector<HTMLElement>(`#${CONTENT_ID}`);
    if (!body || !articleTitle || !content) {
      throw new Error('Preview panel exists without required elements.');
    }

    if (!existing.dataset.wheelProxyBound) {
      attachPanelWheelProxy(existing, body);
      existing.dataset.wheelProxyBound = 'true';
    }

    return {
      element: existing,
      body,
      setTitle(title: string) {
        articleTitle.textContent = title || '제목을 입력하세요';
      },
      setMarkdown(markdown: string) {
        content.innerHTML = renderMarkdown(markdown);
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
  const content = createContentRoot();
  body.append(articleTitle, content);
  attachPanelWheelProxy(panel, body);
  panel.dataset.wheelProxyBound = 'true';

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
      content.innerHTML = renderMarkdown(markdown);
    },
    setVisible(visible: boolean) {
      panel.style.display = visible ? 'flex' : 'none';
    }
  };
};
