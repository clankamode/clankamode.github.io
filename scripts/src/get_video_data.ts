// sync_youtube_uploads.js
// Run: node sync_youtube_uploads.js

import { config } from 'dotenv';
config({ path: '.env.local' });
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const {
  YOUTUBE_API_KEY,
  YOUTUBE_CHANNEL_ID: CHANNEL_ID,
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_SERVICE_KEY,
  SUPABASE_TABLE = 'Videos',
} = process.env;

if (!YOUTUBE_API_KEY || !CHANNEL_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required env vars. Check .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

function iso8601DurationToSeconds(iso: string): number | null {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
}

async function ytGet(path: string, params: Record<string, string>) {
  const url = new URL(`${YT_BASE}/${path}`);
  params.key = YOUTUBE_API_KEY;
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const data = await ytGet('channels', {
    part: 'contentDetails',
    id: channelId,
    maxResults: '1',
  });
  const item = data.items?.[0];
  if (!item) throw new Error('Channel not found or no contentDetails available.');
  return item.contentDetails.relatedPlaylists.uploads;
}

async function * iteratePlaylistVideoIds(playlistId: string): AsyncGenerator<string> {
  let pageToken;
  do {
    const data = await ytGet('playlistItems', {
      part: 'contentDetails',
      playlistId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    for (const it of data.items || []) {
      const vid = it.contentDetails?.videoId;
      if (vid) yield vid;
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
}

async function fetchVideosByIds(videoIds: string[]): Promise<any[]> {
  if (videoIds.length === 0) return [];
  const data = await ytGet('videos', {
    part: 'snippet,statistics,contentDetails,liveStreamingDetails',
    id: videoIds.join(','),
    maxResults: '50',
  });
  return data.items || [];
}

interface VideoData {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: {
        url?: string;
      };
    };
  };
  contentDetails?: {
    duration?: string;
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
  };
}

function mapVideoRow(v: VideoData) {
  const id = v.id;
  const snippet = v.snippet || {};
  const contentDetails = v.contentDetails || {};
  const live = v.liveStreamingDetails || {};

  const durationSeconds = contentDetails.duration
    ? iso8601DurationToSeconds(contentDetails.duration)
    : null;

  const publishedAt = snippet.publishedAt || live.actualStartTime || null;

  // Grab the "high" thumbnail (480x360). It’s usually present.
  const thumbnailHighUrl = snippet.thumbnails?.high?.url ?? null;

  return {
    id,
    title: snippet.title ?? null,
    description: snippet.description ?? null,
    duration: durationSeconds,
    date_uploaded: publishedAt,
    thumbnail: thumbnailHighUrl,
  };
}

interface VideoRow {
  id: string;
  title: string | null;
  description: string | null;
  Duration: number | null;
  date_uploaded: string | null;
  thumbnail_high_url: string | null;
}

async function upsertToSupabase(rows: VideoRow[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

async function main() {
  console.log('Resolving uploads playlist…');
  const uploadsPlaylistId = await getUploadsPlaylistId(CHANNEL_ID);
  console.log('Uploads playlist:', uploadsPlaylistId);

  console.log('Collecting all video IDs…');
  const allIds = [];
  for await (const id of iteratePlaylistVideoIds(uploadsPlaylistId)) {
    allIds.push(id);
  }
  console.log(`Found ${allIds.length} videos.`);

  const chunkSize = 50;
  for (let i = 0; i < allIds.length; i += chunkSize) {
    const chunk = allIds.slice(i, i + chunkSize);
    console.log(`Fetching details for videos ${i + 1}-${Math.min(i + chunkSize, allIds.length)}…`);
    const videos = await fetchVideosByIds(chunk);
    const rows = videos.map(mapVideoRow);

    console.log('Upserting to Supabase...');
    await upsertToSupabase(rows);
    console.log(`Upserted ${rows.length} rows.`);
    await new Promise(r => setTimeout(r, 150)); // optional throttle
  }

  console.log('Done.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
  // console.log('Done.');
}
