'use client';

import YouTube from 'react-youtube';
import type { EmbedBlock as EmbedBlockType } from '../types';

interface EmbedBlockProps {
  block: EmbedBlockType;
  editable?: boolean;
  onChange?: (updates: Partial<EmbedBlockType>) => void;
}

function getYouTubeId(url: string): string | undefined {
  if (!url) {
    return undefined;
  }
  const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]+)/.exec(url);
  if (shortMatch?.[1]) {
    return shortMatch[1];
  }
  const longMatch = /v=([a-zA-Z0-9_-]+)/.exec(url);
  if (longMatch?.[1]) {
    return longMatch[1];
  }
  const embedMatch = /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/.exec(url);
  return embedMatch?.[1];
}

export function EmbedBlock({ block, editable = false, onChange }: EmbedBlockProps) {
  const url = block.url || '';
  const embedId = block.embedId || getYouTubeId(url);

  return (
    <div className="frame rounded-xl bg-surface-dense p-5">
      {editable && (
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-xs uppercase tracking-[0.2em] text-text-secondary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={block.provider}
            onChange={(event) => onChange?.({ provider: event.target.value as EmbedBlockType['provider'] })}
          >
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter/X</option>
            <option value="codesandbox">CodeSandbox</option>
            <option value="codepen">CodePen</option>
            <option value="leetcode">LeetCode</option>
            <option value="gist">GitHub Gist</option>
            <option value="url">Link</option>
          </select>
          <input
            type="text"
            value={url}
            placeholder="Paste the URL"
            className="flex-1 rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary transition focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onChange?.({ url: event.target.value })}
          />
        </div>
      )}

      {!editable && block.provider === 'youtube' && embedId && (
        <div className="mt-4 overflow-hidden rounded-lg">
          <YouTube
            videoId={embedId}
            opts={{
              width: '100%',
              height: '390',
            }}
          />
        </div>
      )}

      {!editable && block.provider !== 'youtube' && (
        <div className="mt-4 space-y-2 text-sm text-text-secondary">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
            {block.provider.toUpperCase()}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-text-primary transition hover:text-text-secondary"
          >
            {url}
          </a>
        </div>
      )}

      {editable && !url && (
        <p className="mt-4 text-xs text-text-muted">Paste a URL to render the embed preview.</p>
      )}
    </div>
  );
}
