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

  it('preserves a blank line after a list item when the next line is a paragraph', () => {
    const normalized = normalizeMarkdownSource('1. list\n\nparagraph');

    expect(normalized).toBe('1. list\n\nparagraph');
  });

  it('removes blank lines inserted between list items', () => {
    const normalized = normalizeMarkdownSource('1. one\n\n2. two');

    expect(normalized).toBe('1. one\n2. two');
  });

  it('preserves blank lines between separate tables', () => {
    const normalized = normalizeMarkdownSource(
      '| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |'
    );

    expect(normalized).toBe('| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |');
  });

  it('inserts a paragraph break after a list item when the next line is plain text', () => {
    const normalized = normalizeMarkdownSource('- item\nparagraph');

    expect(normalized).toBe('- item\n\nparagraph');
  });

  it('preserves a hard line break inside a list item', () => {
    const normalized = normalizeMarkdownSource('- item  \ncontinued');

    expect(normalized).toBe('- item  \ncontinued');
  });

  it('preserves trailing double spaces used for hard breaks', () => {
    const normalized = normalizeMarkdownSource('line with break   \nnext line');

    expect(normalized).toBe('line with break  \nnext line');
  });

  it('prevents a pending unordered list marker from turning the previous line into a heading', () => {
    const normalized = normalizeMarkdownSource('동해물과\n백두산이\n-');

    expect(normalized).toBe('동해물과\n백두산이\n\n-');
  });
});
