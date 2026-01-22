export type BlockType =
  | 'markdown'
  | 'image'
  | 'callout'
  | 'embed'
  | 'code'
  | 'diagram'
  | 'divider';

export interface ImageAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  style?: 'callout' | 'arrow';
}

export interface MarkdownBlock {
  id: string;
  type: 'markdown';
  content: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  size?: 'full' | 'medium' | 'small' | 'inline';
  why?: string;
  annotations?: ImageAnnotation[];
}

export interface CalloutBlock {
  id: string;
  type: 'callout';
  tone: 'tip' | 'warning' | 'info' | 'important';
  title?: string;
  content: string;
  collapsible?: boolean;
}

export interface EmbedBlock {
  id: string;
  type: 'embed';
  provider: 'youtube' | 'twitter' | 'codesandbox' | 'codepen' | 'leetcode' | 'gist' | 'url';
  url: string;
  embedId?: string;
  title?: string;
}

export interface CodeBlock {
  id: string;
  type: 'code';
  language: string;
  filename?: string;
  highlight?: string;
  content: string;
}

export interface DiagramBlock {
  id: string;
  type: 'diagram';
  language: 'mermaid';
  content: string;
}

export interface DividerBlock {
  id: string;
  type: 'divider';
}

export type EditorBlock =
  | MarkdownBlock
  | ImageBlock
  | CalloutBlock
  | EmbedBlock
  | CodeBlock
  | DiagramBlock
  | DividerBlock;
