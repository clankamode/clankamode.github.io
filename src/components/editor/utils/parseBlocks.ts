import type { EditorBlock, EmbedBlock, ImageAnnotation } from '../types';
import { createBlockId } from './blockUtils';

const directiveStart = /^:::(\w+)\s*(\{.*\})?\s*$/;
const directiveEnd = /^:::\s*$/;
const codeFenceStart = /^```([\w-]+)?\s*$/;
const codeFenceEnd = /^```\s*$/;

function parseAttributes(attributeString?: string): Record<string, string> {
  if (!attributeString) {
    return {};
  }

  const trimmed = attributeString.trim();
  const content = trimmed.startsWith('{') && trimmed.endsWith('}')
    ? trimmed.slice(1, -1)
    : trimmed;

  const attrs: Record<string, string> = {};
  const regex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    const [, key, quoted, singleQuoted, bare] = match;
    attrs[key] = quoted ?? singleQuoted ?? bare ?? '';
  }
  return attrs;
}

function parseAnnotations(value?: string): ImageAnnotation[] | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) {
      return parsed as ImageAnnotation[];
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function parseEmbedProvider(value?: string): EmbedBlock['provider'] {
  switch (value) {
    case 'youtube':
    case 'twitter':
    case 'codesandbox':
    case 'codepen':
    case 'leetcode':
    case 'gist':
    case 'url':
      return value;
    default:
      return 'url';
  }
}

function flushMarkdownBlock(blocks: EditorBlock[], buffer: string[]) {
  const content = buffer.join('\n').trim();
  if (!content) {
    buffer.length = 0;
    return;
  }
  blocks.push({
    id: createBlockId('markdown'),
    type: 'markdown',
    content,
  });
  buffer.length = 0;
}

export function parseBlocks(markdown: string): EditorBlock[] {
  const lines = markdown.split('\n');
  const blocks: EditorBlock[] = [];
  const buffer: string[] = [];

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const directiveMatch = line.match(directiveStart);
    const codeFenceMatch = line.match(codeFenceStart);

    if (directiveMatch) {
      flushMarkdownBlock(blocks, buffer);
      const [, rawType, rawAttributes] = directiveMatch;
      const attributes = parseAttributes(rawAttributes);
      const type = rawType.toLowerCase();
      const bodyLines: string[] = [];
      index += 1;
      while (index < lines.length && !directiveEnd.test(lines[index])) {
        bodyLines.push(lines[index]);
        index += 1;
      }
      const body = bodyLines.join('\n').trimEnd();

      switch (type) {
        case 'image':
          if (attributes.src) {
            blocks.push({
              id: createBlockId('image'),
              type: 'image',
              src: attributes.src,
              alt: attributes.alt ?? '',
              caption: attributes.caption,
              size: (attributes.size as 'full' | 'medium' | 'small' | 'inline') ?? 'full',
              why: attributes.why,
              annotations: parseAnnotations(attributes.annotations),
            });
          }
          break;
        case 'callout':
          blocks.push({
            id: createBlockId('callout'),
            type: 'callout',
            tone: (attributes.type as 'tip' | 'warning' | 'info' | 'important') ?? 'info',
            title: attributes.title,
            content: body,
            collapsible: attributes.collapsible === 'true',
          });
          break;
        case 'embed':
          if (attributes.url || attributes.id) {
            blocks.push({
              id: createBlockId('embed'),
              type: 'embed',
              provider: parseEmbedProvider(attributes.provider),
              url: attributes.url ?? '',
              embedId: attributes.id,
              title: attributes.title,
            });
          }
          break;
        case 'code':
          blocks.push({
            id: createBlockId('code'),
            type: 'code',
            language: attributes.lang ?? 'text',
            filename: attributes.filename,
            highlight: attributes.highlight,
            content: body,
          });
          break;
        case 'diagram':
          blocks.push({
            id: createBlockId('diagram'),
            type: 'diagram',
            language: 'mermaid',
            content: body,
          });
          break;
        case 'divider':
          blocks.push({
            id: createBlockId('divider'),
            type: 'divider',
          });
          break;
        default:
          buffer.push(line);
          buffer.push(...bodyLines);
          break;
      }
      index += 1;
      continue;
    }

    if (codeFenceMatch) {
      flushMarkdownBlock(blocks, buffer);
      const language = codeFenceMatch[1] ?? 'text';
      const bodyLines: string[] = [];
      index += 1;
      while (index < lines.length && !codeFenceEnd.test(lines[index])) {
        bodyLines.push(lines[index]);
        index += 1;
      }
      blocks.push({
        id: createBlockId('code'),
        type: 'code',
        language,
        content: bodyLines.join('\n'),
      });
      index += 1;
      continue;
    }

    buffer.push(line);
    index += 1;
  }

  flushMarkdownBlock(blocks, buffer);
  return blocks.length ? blocks : [{ id: createBlockId('markdown'), type: 'markdown', content: '' }];
}
