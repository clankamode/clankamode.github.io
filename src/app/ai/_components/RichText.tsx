import React from 'react';

interface MarkdownBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'blockquote';
  content: string | string[];
  level?: number;
  ordered?: boolean;
  language?: string;
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatInline = (text: string) => {
  let html = escapeHtml(text);

  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#2cbb5d] underline">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');

  return html;
};

const parseMarkdown = (content: string): MarkdownBlock[] => {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];

  let paragraphLines: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let codeBlock: { language?: string; lines: string[] } | null = null;
  let blockquoteLines: string[] | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push({ type: 'list', content: list.items, ordered: list.type === 'ol' });
      list = null;
    }
  };

  const flushCode = () => {
    if (codeBlock) {
      blocks.push({ type: 'code', content: codeBlock.lines.join('\n'), language: codeBlock.language });
      codeBlock = null;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines && blockquoteLines.length > 0) {
      blocks.push({ type: 'blockquote', content: blockquoteLines.join(' ') });
      blockquoteLines = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (codeBlock) {
      if (line.startsWith('```')) {
        flushCode();
      } else {
        codeBlock.lines.push(rawLine);
      }
      continue;
    }

    const codeStart = line.match(/^```(.*)/);
    if (codeStart) {
      flushParagraph();
      flushList();
      flushBlockquote();
      codeBlock = { language: codeStart[1]?.trim() || undefined, lines: [] };
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      blocks.push({ type: 'heading', level: headingMatch[1].length, content: headingMatch[2] });
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.*)/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      if (!blockquoteLines) blockquoteLines = [];
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    } else if (blockquoteLines) {
      flushBlockquote();
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.*)/);
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);

    if (unorderedMatch) {
      flushParagraph();
      flushBlockquote();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(unorderedMatch[1]);
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      flushBlockquote();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(orderedMatch[2]);
      continue;
    }

    if (line === '') {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  flushCode();
  flushBlockquote();

  return blocks;
};

const renderBlock = (block: MarkdownBlock, index: number) => {
  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <HeadingTag
          key={index}
          className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-2"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag
          key={index}
          className="ml-5 space-y-1 list-outside text-gray-900 dark:text-gray-100"
          style={{ listStyleType: block.ordered ? 'decimal' : 'disc' }}
        >
          {(block.content as string[]).map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ListTag>
      );
    }
    case 'code': {
      return (
        <pre
          key={index}
          className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-sm"
        >
          <code>{block.content as string}</code>
        </pre>
      );
    }
    case 'blockquote': {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-[#2cbb5d] pl-3 italic text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    default:
      return (
        <p
          key={index}
          className="text-gray-900 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
  }
};

export function RichText({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="space-y-3 leading-relaxed text-sm">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export default RichText;
