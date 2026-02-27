import type { LearningArticle } from '@/types/content';

/**
 * Structured article context used to build AI tutor prompts.
 */
export interface ArticleContext {
  title: string;
  slug: string;
  /** Extracted code snippets from fenced blocks and <pre> tags. */
  codeBlocks: string[];
  /** Extracted concept names/keywords from headings, bold text, and tags. */
  keyConcepts: string[];
  /** Brief plain-text summary from the first paragraph(s), capped to ~200 chars. */
  summary: string;
  /** h2/h3 sections with their slugified anchor IDs and heading text. */
  sections: { id: string; text: string }[];
}

const MARKDOWN_CODE_FENCE_REGEX = /```(?:[\w-]+)?\s*\n([\s\S]*?)```/g;
const HTML_PRE_REGEX = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
const MARKDOWN_HEADING_REGEX = /^#{1,6}\s+(.+)$/gm;
const HTML_HEADING_REGEX = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
const MARKDOWN_BOLD_REGEX = /\*\*([^*]+)\*\*|__([^_]+)__/g;
const HTML_BOLD_REGEX = /<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi;

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pushUnique(target: string[], value: string) {
  const normalized = value.trim();
  if (!normalized) return;
  if (!target.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) {
    target.push(normalized);
  }
}

function collectMatches(source: string, regex: RegExp, extractor: (match: RegExpExecArray) => string | null): string[] {
  const values: string[] = [];
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const value = extractor(match);
    if (value) values.push(value);
  }
  return values;
}

function extractCodeBlocks(body: string): string[] {
  const blocks: string[] = [];

  const fenced = collectMatches(body, MARKDOWN_CODE_FENCE_REGEX, (m) => m[1] ?? null);
  const htmlPre = collectMatches(body, HTML_PRE_REGEX, (m) => m[1] ?? null).map((value) => decodeBasicHtmlEntities(stripHtml(value)));

  for (const block of [...fenced, ...htmlPre]) {
    const trimmed = block.trim();
    if (trimmed) pushUnique(blocks, trimmed);
  }

  return blocks;
}

function extractKeyConcepts(article: LearningArticle, body: string): string[] {
  const concepts: string[] = [];

  if (article.primary_concept) {
    pushUnique(concepts, article.primary_concept);
  }

  for (const tag of article.concept_tags ?? []) {
    if (typeof tag === 'string') {
      pushUnique(concepts, tag);
    }
  }

  const markdownHeadings = collectMatches(body, MARKDOWN_HEADING_REGEX, (m) => m[1] ?? null);
  const htmlHeadings = collectMatches(body, HTML_HEADING_REGEX, (m) => m[1] ?? null).map((value) => stripHtml(value));
  const markdownBold = collectMatches(body, MARKDOWN_BOLD_REGEX, (m) => m[1] ?? m[2] ?? null);
  const htmlBold = collectMatches(body, HTML_BOLD_REGEX, (m) => m[1] ?? null).map((value) => stripHtml(value));

  for (const concept of [...markdownHeadings, ...htmlHeadings, ...markdownBold, ...htmlBold]) {
    const cleaned = stripHtml(concept)
      .replace(/[`*_#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length >= 2) {
      pushUnique(concepts, cleaned);
    }
  }

  return concepts.slice(0, 24);
}

function headingToId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractSections(body: string): { id: string; text: string }[] {
  const sections: { id: string; text: string }[] = [];
  const regex = /^#{2,3}\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    const text = (match[1] ?? '').trim();
    if (text) {
      sections.push({ id: headingToId(text), text });
    }
  }
  return sections;
}

function buildSummary(body: string): string {
  let content = body;

  content = content.replace(MARKDOWN_CODE_FENCE_REGEX, ' ');
  content = content.replace(HTML_PRE_REGEX, ' ');
  content = content.replace(/^\s*:::(\w+)\s*(\{.*\})?\s*$/gm, ' ');
  content = content.replace(/^\s*:::\s*$/gm, ' ');

  const plain = stripHtml(
    decodeBasicHtmlEntities(
      content
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[[^\]]*\]\(([^)]+)\)/g, ' ')
        .replace(/\[[^\]]+\]\(([^)]+)\)/g, '$1')
    )
  );

  if (!plain) return '';
  return plain.length > 200 ? `${plain.slice(0, 200).trimEnd()}…` : plain;
}

/**
 * Extracts compact, structured context from a learning article for AI tutor prompting.
 * Handles missing/null-ish content safely.
 */
export function extractArticleContext(article: LearningArticle): ArticleContext {
  const safeBody = article?.body ?? '';

  return {
    title: article?.title ?? '',
    slug: article?.slug ?? '',
    codeBlocks: extractCodeBlocks(safeBody),
    keyConcepts: extractKeyConcepts(article, safeBody),
    summary: buildSummary(safeBody),
    sections: extractSections(safeBody),
  };
}
