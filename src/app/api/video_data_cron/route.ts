import { fetchVideosByIds, getUploadsPlaylistId, fetchPlaylistItems } from '@/lib/youtube';
import { mapVideoRow, upsertToSupabase} from '@/lib/video-sync';
import { NextResponse } from 'next/server';


const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';

export async function GET() {
  console.log('Running cron job to get latest videos from YouTube');
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  console.log('Uploads playlist:', uploadsPlaylistId);

  console.log('Collecting all video IDs…');
  const recentVideos = await fetchPlaylistItems(uploadsPlaylistId, undefined, '5');
  const allIds = recentVideos.items.map(elem => {
    return elem.contentDetails?.videoId;
  });

  console.log(allIds);
  const videos = await fetchVideosByIds(allIds.filter(id => id !== undefined));
  const rows = videos.map(mapVideoRow);
  await upsertToSupabase(rows);
  console.log('Upserted to Supabase');
  console.log('Rows:', JSON.stringify(rows, null, 2));
  return NextResponse.json({ ok: 'SUCCESS', rows });
}
