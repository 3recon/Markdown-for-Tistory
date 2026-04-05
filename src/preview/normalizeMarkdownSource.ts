const ZERO_WIDTH_CHARACTERS = /[\u200B-\u200D\uFEFF]/g;
const NON_BREAKING_SPACES = /\u00A0/g;
const TABLE_ROW_PATTERN = /^\s*\|.*\|\s*$/;
const LIST_ITEM_PATTERN = /^\s*(?:[-*+]\s+|\d+\.\s+)/;
const UNORDERED_LIST_MARKER_ONLY_PATTERN = /^\s*[-*+]\s*$/;
const INDENTED_LINE_PATTERN = /^\s{2,}\S/;

const compactStructuredBlocks = (input: string): string => {
  const lines = input.split('\n');
  const output: string[] = [];

  for (const [index, line] of lines.entries()) {
    const previous = output[output.length - 1] ?? '';
    const next = lines[index + 1] ?? '';

    if (line === '' && output.length > 0) {
      const previousIsListItem = LIST_ITEM_PATTERN.test(previous);
      const nextIsListItem = LIST_ITEM_PATTERN.test(next);

      if (previousIsListItem && nextIsListItem) {
        continue;
      }
    }

    output.push(line);
  }

  return output.join('\n');
};

const expandListParagraphBreaks = (input: string): string => {
  const lines = input.split('\n');
  const output: string[] = [];

  for (const line of lines) {
    const previous = output[output.length - 1] ?? '';
    const currentIsListItem = LIST_ITEM_PATTERN.test(line);
    const currentIsStructured = currentIsListItem || TABLE_ROW_PATTERN.test(line);
    const currentIsIndented = INDENTED_LINE_PATTERN.test(line);

    if (
      output.length > 0 &&
      line !== '' &&
      LIST_ITEM_PATTERN.test(previous) &&
      !currentIsStructured &&
      !currentIsIndented
    ) {
      output.push('');
    }

    output.push(line);
  }

  return output.join('\n');
};

const protectPendingListMarkers = (input: string): string => {
  const lines = input.split('\n');
  const output: string[] = [];

  for (const line of lines) {
    const previous = output[output.length - 1] ?? '';

    if (
      output.length > 0 &&
      line !== '' &&
      UNORDERED_LIST_MARKER_ONLY_PATTERN.test(line) &&
      previous !== ''
    ) {
      output.push('');
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

  return protectPendingListMarkers(expandListParagraphBreaks(compactStructuredBlocks(normalized)));
};
