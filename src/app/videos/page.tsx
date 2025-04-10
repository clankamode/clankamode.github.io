import { Suspense } from 'react';
import VideosPageClient from '@/components/VideosPageClient';
import { getChannelStats } from '@/lib/youtube';
import { getInitialVideos } from '@/lib/videos';
import LoadingVideos from './_components/LoadingVideos';

export default async function VideosPage() {
  // Fetch initial videos and hasMore status
  const { videos: initialVideos, hasMore: initialHasMore } = await getInitialVideos();
  const channelId = process.env.YOUTUBE_CHANNEL_ID || '';
  const channelStats = await getChannelStats(channelId);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] pt-20">
      {/* Videos Grid with infinite scrolling */}
      <section className="pb-16 bg-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-4">          
          <Suspense fallback={<LoadingVideos />}>
            <VideosPageClient 
              initialVideos={initialVideos} 
              channelId={channelId} 
              initialHasMore={initialHasMore} 
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
} 