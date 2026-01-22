import type { EditorBlock } from '../types';

export function createBlockId(prefix = 'block'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyMarkdownBlock(): EditorBlock {
  return {
    id: createBlockId('markdown'),
    type: 'markdown',
    content: '',
  };
}
