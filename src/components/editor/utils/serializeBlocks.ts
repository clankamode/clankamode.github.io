import type { EditorBlock, ImageAnnotation } from '../types';

function escapeAttributeValue(value: string): string {
  return value.replace(/"/g, '&quot;');
}

function encodeAnnotations(annotations?: ImageAnnotation[]): string | undefined {
  if (!annotations?.length) {
    return undefined;
  }
  try {
    return encodeURIComponent(JSON.stringify(annotations));
  } catch {
    return undefined;
  }
}

function formatAttributes(attributes: Record<string, string | undefined>): string {
  const entries = Object.entries(attributes).filter(([, value]) => value);
  if (!entries.length) {
    return '';
  }
  const pairs = entries.map(([key, value]) => `${key}="${escapeAttributeValue(String(value))}"`);
  return `{${pairs.join(' ')}}`;
}

export function serializeBlocks(blocks: EditorBlock[]): string {
  const output: string[] = [];

  blocks.forEach((block) => {
    switch (block.type) {
      case 'markdown':
        if (block.content.trim()) {
          output.push(block.content.trimEnd());
        }
        break;
      case 'image': {
        const annotations = encodeAnnotations(block.annotations);
        const attrs = formatAttributes({
          src: block.src,
          alt: block.alt,
          caption: block.caption,
          size: block.size,
          why: block.why,
          annotations,
        });
        output.push(`:::image${attrs}`);
        output.push(':::');
        break;
      }
      case 'callout': {
        const attrs = formatAttributes({
          type: block.tone,
          title: block.title,
          collapsible: block.collapsible ? 'true' : undefined,
        });
        output.push(`:::callout${attrs}`);
        if (block.content.trim()) {
          output.push(block.content.trimEnd());
        }
        output.push(':::');
        break;
      }
      case 'embed': {
        const attrs = formatAttributes({
          provider: block.provider,
          url: block.url,
          id: block.embedId,
          title: block.title,
        });
        output.push(`:::embed${attrs}`);
        output.push(':::');
        break;
      }
      case 'code': {
        const attrs = formatAttributes({
          lang: block.language,
          filename: block.filename,
          highlight: block.highlight,
        });
        output.push(`:::code${attrs}`);
        if (block.content.trim()) {
          output.push(block.content.trimEnd());
        }
        output.push(':::');
        break;
      }
      case 'diagram': {
        const attrs = formatAttributes({
          lang: block.language,
        });
        output.push(`:::diagram${attrs}`);
        if (block.content.trim()) {
          output.push(block.content.trimEnd());
        }
        output.push(':::');
        break;
      }
      case 'divider':
        output.push(':::divider');
        output.push(':::');
        break;
      default:
        break;
    }
  });

  return output.join('\n\n').trim();
}
