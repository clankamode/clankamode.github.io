interface ReadingTimeOptions {
  minMinutes?: number;
  maxMinutes?: number;
}

const DEFAULT_MIN_MINUTES = 1;
const DEFAULT_MAX_MINUTES = 60;
const PROSE_WPM = 210;
const CODE_WPM = 90;

function countWords(text: string): number {
  const normalized = text
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return 0;
  return normalized.split(' ').filter(Boolean).length;
}

export function estimateReadingTimeMinutes(
  markdown: string,
  options: ReadingTimeOptions = {}
): number {
  const minMinutes = options.minMinutes ?? DEFAULT_MIN_MINUTES;
  const maxMinutes = options.maxMinutes ?? DEFAULT_MAX_MINUTES;
  if (!markdown?.trim()) {
    return minMinutes;
  }

  const codeBlockMatches = markdown.match(/```[\s\S]*?```/g) ?? [];
  const inlineCodeMatches = markdown.match(/`[^`\n]+`/g) ?? [];
  const codeText = `${codeBlockMatches.join(' ')} ${inlineCodeMatches.join(' ')}`;

  // Remove code spans before prose counting so code is weighted separately.
  const proseMarkdown = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const proseWords = countWords(proseMarkdown);
  const codeWords = countWords(
    codeText
      .replace(/```/g, ' ')
      .replace(/`/g, ' ')
  );

  const headingCount = (markdown.match(/^#{1,6}\s+/gm) ?? []).length;
  const listItemCount = (markdown.match(/^\s*[-*+]\s+/gm) ?? []).length;
  const tableLineCount = (markdown.match(/^\s*\|.+\|\s*$/gm) ?? []).length;
  const imageCount = (markdown.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length;
  const blockquoteCount = (markdown.match(/^\s*>\s+/gm) ?? []).length;

  const proseMinutes = proseWords / PROSE_WPM;
  const codeMinutes = codeWords / CODE_WPM;

  // Structural overhead: context switches and scanning diagrams/tables/code.
  const structuralMinutes =
    headingCount * 0.12 +
    listItemCount * 0.025 +
    tableLineCount * 0.06 +
    imageCount * 0.2 +
    blockquoteCount * 0.05 +
    codeBlockMatches.length * 0.35;

  const estimatedMinutes = Math.ceil(proseMinutes + codeMinutes + structuralMinutes);
  return Math.max(minMinutes, Math.min(maxMinutes, estimatedMinutes));
}
