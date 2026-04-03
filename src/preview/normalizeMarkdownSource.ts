const ZERO_WIDTH_CHARACTERS = /[\u200B-\u200D\uFEFF]/g;
const NON_BREAKING_SPACES = /\u00A0/g;
const TABLE_ROW_PATTERN = /^\s*\|.*\|\s*$/;
const LIST_ITEM_PATTERN = /^\s*(?:[-*+]\s+|\d+\.\s+)/;

const compactStructuredBlocks = (input: string): string => {
  const lines = input.split('\n');
  const output: string[] = [];

  for (const line of lines) {
    const previous = output[output.length - 1] ?? '';

    if (line === '' && output.length > 0) {
      const previousIsStructured =
        TABLE_ROW_PATTERN.test(previous) || LIST_ITEM_PATTERN.test(previous);
      const nextWouldBeStructured = false;

      if (previousIsStructured && !nextWouldBeStructured) {
        continue;
      }
    }

    output.push(line);
  }

  return output.join('\n');
};

export const normalizeMarkdownSource = (input: string): string => {
  const normalized = input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(NON_BREAKING_SPACES, ' ')
    .replace(ZERO_WIDTH_CHARACTERS, '')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return compactStructuredBlocks(normalized);
};
