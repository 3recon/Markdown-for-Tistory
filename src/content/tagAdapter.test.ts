import { describe, expect, it } from 'vitest';

import { parseTagText, stringifyTags } from './tagAdapter';

describe('parseTagText', () => {
  it('splits comma-separated tags and trims whitespace', () => {
    expect(parseTagText('react, typescript, frontend')).toEqual(['react', 'typescript', 'frontend']);
  });

  it('normalizes hashes, newlines, and duplicates', () => {
    expect(parseTagText('#react,\nreact,  #vite ,')).toEqual(['react', 'vite']);
  });
});

describe('stringifyTags', () => {
  it('joins unique tags with commas', () => {
    expect(stringifyTags(['react', 'typescript', 'react'])).toBe('react, typescript');
  });
});
