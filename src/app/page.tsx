import VideoCard from '@/components/ui/VideoCard';
import { getChannelVideos, getChannelStats, formatCount } from '@/lib/youtube';
import { getPopularChannelVideos } from '@/lib/youtube';

// Load videos from YouTube
async function getYouTubeVideos() {
  // Get channel ID from environment variable
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  
  if (!channelId) {
    console.error('YouTube channel ID not found in environment variables');
    return [];
  }
  
  try {
    // Fetch latest videos
    const videos = await getChannelVideos(channelId, 3);
    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

// Load popular videos from YouTube
async function getYouTubePopularVideos() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    console.error('YouTube channel ID not found in environment variables');
    return [];
  }
  try {
    // Fetch popular videos
    const videos = await getPopularChannelVideos(channelId, 3);
    return videos;
  } catch (error) {
    console.error('Error fetching popular YouTube videos:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch videos and channel stats from YouTube
  const [latestVideos, popularVideos, channelStats] = await Promise.all([
    getYouTubeVideos(),
    getYouTubePopularVideos(),
    getChannelStats(process.env.YOUTUBE_CHANNEL_ID || '')
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a]">
      {/* Hero Section */}
      <section className="relative bg-[#282828] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#2cbb5d]/20 to-[#1a1a1a]/20 mix-blend-multiply"></div>
        <div className="relative py-20 px-4 mx-auto max-w-screen-xl text-center lg:py-32">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 text-sm font-medium text-[#2cbb5d] bg-[#2cbb5d]/10 rounded-full">
            <span className="px-2 py-1 mr-2 bg-[#2cbb5d] rounded-full"></span>
            New video every week
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2cbb5d] to-[#28a754]">
              Coding Interviews
            </span>
            <br />
            <span className="text-white">Made Simple</span>
          </h1>
          <p className="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 xl:px-48">
            Deep dives into algorithms, system design, and problem-solving strategies for technical interviews.
          </p>
          
          {/* Channel Stats */}
          {channelStats && (
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-[#2cbb5d]">{formatCount(channelStats.subscriberCount)}</span>
                <span className="text-sm text-gray-400">Subscribers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{formatCount(channelStats.videoCount)}</span>
                <span className="text-sm text-gray-400">Videos</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{formatCount(channelStats.viewCount)}</span>
                <span className="text-sm text-gray-400">Views</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <a
              href={`https://youtube.com/channel/${process.env.YOUTUBE_CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white bg-[#2cbb5d] rounded-lg hover:bg-[#28a754] focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch on YouTube
            </a>
            <a
              href="/videos"
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-[#2cbb5d] border border-[#2cbb5d] rounded-lg hover:bg-[#2cbb5d]/10 focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
            >
              Browse Videos
            </a>
          </div>
        </div>
      </section>

      {/* Latest Videos Section */}
      <section className="py-16 bg-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Latest Videos
            </h2>
            <a href="/videos" className="text-[#2cbb5d] hover:text-[#28a754] font-medium flex items-center">
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          {latestVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestVideos.map((video) => (
                <VideoCard 
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  thumbnailUrl={video.thumbnailUrl}
                  videoUrl={video.videoUrl}
                  date={video.publishedAt}
                  viewCount={video.viewCount}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#282828] rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#2cbb5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Videos Found</h3>
              <p className="text-gray-400">
                Please check your YouTube API key and channel ID in the .env.local file.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Videos Section */}
      <section className="py-16 bg-[#282828]"> {/* Slightly different bg for distinction */}
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              Popular Videos
            </h2>
            {/* Optional: Link to a "popular" filtered view if you create one */}
            {/* <a href="/videos?sort=popular" className="text-[#2cbb5d] hover:text-[#28a754] font-medium flex items-center">
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a> */}
          </div>
          
          {popularVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularVideos.map((video) => (
                <VideoCard 
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  thumbnailUrl={video.thumbnailUrl}
                  videoUrl={video.videoUrl}
                  date={video.publishedAt} // YouTube API for search doesn't always return publishedAt easily, might need adjustment
                  viewCount={video.viewCount} // viewCount should be available
                />
              ))}
            </div>
          ) : (
             <div className="bg-[#1a1a1a] rounded-lg p-8 text-center"> {/* Adjusted background */}
              <div className="w-16 h-16 bg-[#2cbb5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Popular Videos Found</h3>
              <p className="text-gray-400">
                Could not fetch popular videos at this time.
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
