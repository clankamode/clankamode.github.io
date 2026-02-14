import { getChannelVideos, getChannelStats, getPopularChannelVideos } from '@/lib/youtube';
import HeroSection from '@/components/sections/HeroSection';
import TabbedVideoSection from '@/components/sections/TabbedVideoSection';

// Add revalidation directive - adjust time as needed
export const revalidate = 300; // Revalidate at most once per 5 minutes

export default async function Home() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID || '';
  // Fetch videos and channel stats from YouTube
  const [latestVideos, popularVideos, channelStats] = await Promise.all([
    getChannelVideos(channelId, 3),
    getPopularChannelVideos(channelId, 3),
    getChannelStats(channelId)
  ]);
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <HeroSection channelStats={channelStats} />

      <TabbedVideoSection
        latestVideos={latestVideos}
        popularVideos={popularVideos}
        viewAllHref="/videos"
        youtubeChannelId={channelId}
      />
    </div>
  );
}
