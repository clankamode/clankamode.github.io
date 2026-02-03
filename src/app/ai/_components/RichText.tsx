import React from 'react';

interface MarkdownBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'blockquote' | 'preformatted';
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

  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (match, linkText, linkUrl) => {
    return `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" class="text-foreground underline decoration-border-subtle hover:text-brand-green">${escapeHtml(linkText)}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-surface-interactive px-1 py-0.5 rounded text-lg text-foreground">$1</code>');

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
      const looksLikeStructuredContent = paragraphLines.some(line =>
        /^\d{1,2}:\d{2}(:\d{2})?/.test(line.trim()) ||
        /^#\w/.test(line.trim())
      );

      if (looksLikeStructuredContent) {
        blocks.push({ type: 'preformatted', content: paragraphLines.join('\n') });
      } else {
        blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') });
      }
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
          className="text-lg font-semibold text-foreground mt-2"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      const items = block.content as string[];
      return (
        <ListTag
          key={index}
          className="ml-5 space-y-1 list-outside text-foreground"
          style={{ listStyleType: block.ordered ? 'decimal' : 'disc' }}
        >
          {items.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ListTag>
      );
    }
    case 'code': {
      return (
        <pre
          key={index}
          className="bg-[#09090b] text-gray-200 rounded-lg p-4 overflow-x-auto text-[13px] font-mono border border-white/10 shadow-inner my-3"
        >
          <code>{block.content as string}</code>
        </pre>
      );
    }
    case 'blockquote': {
      return (
        <blockquote
          key={index}
          className="border-l-2 border-brand-green pl-4 italic text-muted-foreground my-3"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    case 'preformatted': {
      return (
        <div
          key={index}
          className="whitespace-pre-wrap text-inherit leading-7"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    default: {
      return (
        <p
          key={index}
          className="text-inherit leading-7"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
  }
};

export function RichText({ content, className }: { content: string; className?: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className={`space-y-4 text-base leading-relaxed ${className ?? ''}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export default RichText;
