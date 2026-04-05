import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('renders headings and lists', () => {
    const html = renderMarkdown('# Hello\n\n- one\n- two');

    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
  });

  it('renders fenced code blocks with tistory-like hljs classes', () => {
    const html = renderMarkdown('```python\nprint("hello")\n```');

    expect(html).toContain('<pre><code class="language-python hljs">');
    expect(html).toContain('hljs-built_in');
    expect(html).toContain('hljs-string');
  });

  it('renders tables in gfm mode', () => {
    const html = renderMarkdown('| A | B |\n| :- | -: |\n| 1 | 2 |');

    expect(html).toContain('<table>');
    expect(html).toContain('<th align="left">A</th>');
    expect(html).toContain('<th align="right">B</th>');
  });

  it('renders single newlines inside a paragraph as line breaks', () => {
    const html = renderMarkdown('first line\nsecond line');

    expect(html).toContain('first line<br>');
    expect(html).toContain('second line');
  });

  it('renders blockquotes with tistory data-ke-style attributes', () => {
    const html = renderMarkdown('> quote');

    expect(html).toContain('<blockquote data-ke-style="style1">');
    expect(html).toContain('<p>quote</p>');
  });

  it('does not render inline code tags', () => {
    const html = renderMarkdown('before `code` after');

    expect(html).not.toContain('<code>');
    expect(html).toContain('<p>before code after</p>');
  });
});
