import { getChannelVideos, getChannelStats, getPopularChannelVideos } from '@/lib/youtube';
import HeroSection from '@/components/sections/HeroSection';
import VideoSection from '@/components/sections/VideoSection';

// Add revalidation directive - adjust time as needed
export const revalidate = 60 * 5; // Revalidate at most once per 5 minutes

export default async function Home() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID || '';
  // Fetch videos and channel stats from YouTube
  const [latestVideos, popularVideos, channelStats] = await Promise.all([
    getChannelVideos(channelId, 6),
    getPopularChannelVideos(channelId, 6),
    getChannelStats(channelId)
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a]">
      {/* Use HeroSection Component */}
      <HeroSection channelStats={channelStats} channelId={channelId} />

      {/* Use VideoSection for Latest Videos */}
      <VideoSection 
        title="Latest Videos"
        videos={latestVideos}
        viewAllHref="/videos"
        emptyStateTitle="No Latest Videos Found"
        emptyStateMessage="Please check your YouTube API key and channel ID in the .env.local file."
        sectionBgClass="bg-[#1a1a1a]"
        emptyStateBgClass="bg-[#282828]"
      />

      {/* Use VideoSection for Popular Videos */}
      <VideoSection 
        title="Popular Videos"
        videos={popularVideos}
        emptyStateTitle="No Popular Videos Found"
        emptyStateMessage="Could not fetch popular videos at this time."
        sectionBgClass="bg-[#282828]"
        emptyStateBgClass="bg-[#1a1a1a]"
      />
    </div>
  );
}
