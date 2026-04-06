import hljs from 'highlight.js';
import { marked, Renderer } from 'marked';

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const renderer = new Renderer();

renderer.code = ({ text, lang }) => {
  const language = (lang ?? '').trim().toLowerCase();
  const codeClass = language ? `language-${escapeHtml(language)} hljs` : 'hljs';
  const source = `${text.replace(/\n$/, '')}\n`;
  const highlighted = (() => {
    if (!source.trim()) {
      return '\n';
    }

    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(source, { language, ignoreIllegals: true }).value;
    }

    return hljs.highlightAuto(source).value;
  })();

  return `<pre><code class="${codeClass}">${highlighted}</code></pre>\n`;
};

renderer.blockquote = ({ tokens }) => {
  return `<blockquote data-ke-style="style1">${renderer.parser.parse(tokens)}</blockquote>\n`;
};

renderer.codespan = ({ text }) => {
  return escapeHtml(text);
};

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer
});

export const renderMarkdown = (markdown: string): string => {
  const trailingNewlineMatch = markdown.match(/\n+$/);
  const trailingNewlines = trailingNewlineMatch?.[0].length ?? 0;
  const trailingBlankParagraphs = Math.max(trailingNewlines - 1, 0);
  const html = marked.parse(markdown, { async: false }) as string;

  if (trailingBlankParagraphs === 0) {
    return html;
  }

  return `${html}${'<p><br></p>'.repeat(trailingBlankParagraphs)}`;
};
