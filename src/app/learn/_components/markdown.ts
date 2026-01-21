import type { TableOfContentsItem } from './TableOfContents';

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function extractHeadings(markdown: string): TableOfContentsItem[] {
  const lines = markdown.split('\n');
  const headings: TableOfContentsItem[] = [];

  lines.forEach((line) => {
    const match = /^(#{2,3})\s+(.*)/.exec(line.trim());
    if (!match) {
      return;
    }
    const level = match[1]?.length ?? 2;
    const text = match[2]?.trim() ?? '';
    if (!text) {
      return;
    }
    headings.push({
      id: slugifyHeading(text),
      text,
      level,
    });
  });

  return headings;
}
