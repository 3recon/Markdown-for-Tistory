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

renderer.code = ({ text, lang, escaped }) => {
  const language = (lang ?? '').trim().toLowerCase();
  const codeClass = language ? `language-${escapeHtml(language)} hljs` : 'hljs';
  const content = `${text.replace(/\n$/, '')}\n`;

  return `<pre><code class="${codeClass}">${
    escaped ? content : escapeHtml(content)
  }</code></pre>\n`;
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
  return marked.parse(markdown, { async: false }) as string;
};
