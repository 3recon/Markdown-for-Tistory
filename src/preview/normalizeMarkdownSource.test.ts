import { describe, expect, it } from 'vitest';

import { normalizeMarkdownSource } from './normalizeMarkdownSource';

describe('normalizeMarkdownSource', () => {
  it('removes zero-width and non-breaking space characters', () => {
    const normalized = normalizeMarkdownSource('\u200B*hello*\u00A0');

    expect(normalized).toBe('*hello*');
  });

  it('normalizes line endings', () => {
    const normalized = normalizeMarkdownSource('# title\r\n\r\ntext');

    expect(normalized).toBe('# title\n\ntext');
  });

  it('collapses excessive blank lines', () => {
    const normalized = normalizeMarkdownSource('a\n\n\n\nb');

    expect(normalized).toBe('a\n\nb');
  });
});
