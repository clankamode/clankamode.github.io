// sync_youtube_uploads.js
// Run: node sync_youtube_uploads.js

import { config } from 'dotenv';
config({ path: '.env.local' });
import { getUploadsPlaylistId, iteratePlaylistVideoIds, fetchVideosByIds } from '../../src/lib/youtube';
import { mapVideoRow, upsertToSupabase } from '../../src/lib/video-sync';

const { YOUTUBE_CHANNEL_ID: CHANNEL_ID } = process.env;

if (!CHANNEL_ID) {
  console.error('Missing YOUTUBE_CHANNEL_ID env var. Check .env.');
  process.exit(1);
}

const channelId = CHANNEL_ID;

async function main() {
  console.log('Resolving uploads playlist…');
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
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
