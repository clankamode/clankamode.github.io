import type { EmbedBlock } from '../types';

export function detectEmbedFromText(text: string): Pick<EmbedBlock, 'provider' | 'url' | 'embedId'> | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('http')) {
    return null;
  }

  const youTubeMatch = /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/.exec(trimmed);
  if (youTubeMatch?.[1]) {
    return { provider: 'youtube', url: trimmed, embedId: youTubeMatch[1] };
  }

  const twitterMatch = /(https?:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+)/.exec(trimmed);
  if (twitterMatch?.[1]) {
    return { provider: 'twitter', url: twitterMatch[1], embedId: undefined };
  }

  return { provider: 'url', url: trimmed, embedId: undefined };
}
