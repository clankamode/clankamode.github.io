import { Suspense } from 'react';
import VideosPageClient from '@/components/VideosPageClient';
import ChannelStats from '@/components/ChannelStats';
import { getChannelVideos, getChannelStats } from '@/lib/youtube';

// Define the initial load limit
const INITIAL_LOAD_LIMIT = 6;

// Initial load of videos
async function getInitialVideos() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    console.error('YouTube channel ID not found in environment variables');
    return { videos: [], hasMore: false }; // Return object with hasMore
  }
  try {
    const videos = await getChannelVideos(channelId, INITIAL_LOAD_LIMIT);
    // Determine if there are potentially more videos
    const hasMore = videos.length === INITIAL_LOAD_LIMIT;
    return { videos, hasMore };
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return { videos: [], hasMore: false }; // Return object with hasMore
  }
}

export default async function VideosPage() {
  // Fetch initial videos and hasMore status
  const { videos: initialVideos, hasMore: initialHasMore } = await getInitialVideos();
  const channelId = process.env.YOUTUBE_CHANNEL_ID || '';
  const channelStats = await getChannelStats(channelId);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] pt-20">
      {/* Videos Grid with infinite scrolling */}
      <section className="py-16 bg-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-4">
          {/* Channel Stats */}
          {channelStats && <ChannelStats stats={channelStats} />}

          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              Videos
            </h2>
            <a 
              href={`https://youtube.com/channel/${process.env.YOUTUBE_CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2cbb5d] hover:text-[#28a754] font-medium flex items-center"
            >
              Visit YouTube Channel
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          
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

function LoadingVideos() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-[#282828] rounded-lg overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-700"></div>
          <div className="p-5">
            <div className="h-6 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 