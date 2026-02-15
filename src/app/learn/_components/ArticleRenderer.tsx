'use client';

import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { parseBlocks } from '@/components/editor/utils/parseBlocks';

interface ArticleRendererProps {
  content: string;
  mode?: 'default' | 'execution';
}

export default function ArticleRenderer({ content, mode = 'default' }: ArticleRendererProps) {
  const blocks = parseBlocks(content);

  return <BlockRenderer blocks={blocks} mode={mode} />;
}
