import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false
});

export const renderMarkdown = (markdown: string): string => {
  return marked.parse(markdown, { async: false }) as string;
};
