import { VideoData } from './youtube';
import { supabase } from './supabase';

export interface VideoRow {
  id: string;
  title: string | null;
  description: string | null;
  duration: number | null;
  date_uploaded: string | null;
  thumbnail: string | null;
}

export function mapVideoRow(v: VideoData): VideoRow {
  const snippet = v.snippet || {};
  const contentDetails = v.contentDetails || {};
  const live = v.liveStreamingDetails || {};
  
  const durationSeconds = contentDetails.duration
    ? iso8601DurationToSeconds(contentDetails.duration)
    : null;

  const publishedAt = snippet.publishedAt || live.actualStartTime || null;

  // Grab the "high" thumbnail (480x360). It's usually present.
  const thumbnailHighUrl = snippet.thumbnails?.high?.url ?? null;

  return {
    id: v.id,
    title: snippet.title ?? null,
    description: snippet.description ?? null,
    duration: durationSeconds,
    date_uploaded: publishedAt,
    thumbnail: thumbnailHighUrl,
  };
}

export function iso8601DurationToSeconds(iso: string): number | null {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
}

export async function upsertToSupabase(rows: VideoRow[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('Videos')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}
