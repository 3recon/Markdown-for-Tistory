import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('renders headings and lists', () => {
    const html = renderMarkdown('# Hello\n\n- one\n- two');

    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
  });

  it('renders fenced code blocks', () => {
    const html = renderMarkdown('```ts\nconsole.log(1)\n```');

    expect(html).toContain('<pre><code class="language-ts">');
    expect(html).toContain('console.log(1)');
  });

  it('renders tables in gfm mode', () => {
    const html = renderMarkdown('| A | B |\n| - | - |\n| 1 | 2 |');

    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });
});
