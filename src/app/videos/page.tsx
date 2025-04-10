import VideoCard from '@/components/ui/VideoCard';
import { getChannelVideos, YouTubeVideo } from '@/lib/youtube';

// Load videos from YouTube
async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
  // Get channel ID from environment variable
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  
  if (!channelId) {
    console.error('YouTube channel ID not found in environment variables');
    return [];
  }
  
  try {
    // Get more videos for the videos page (up to 12)
    const videos = await getChannelVideos(channelId, 12);
    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

export default async function VideosPage() {
  // Fetch videos from YouTube
  const videos = await getYouTubeVideos();

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] pt-20">
      {/* Page Header */}
      <section className="py-16 bg-[#282828]">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            All Videos
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Browse all my video content, from algorithms and data structures to system design and interview preparation.
          </p>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-16 bg-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-4">
          {videos.length > 0 ? (
            <>
              <div className="mb-8 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {videos.length} Videos
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((video) => (
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
            </>
          ) : (
            <div className="bg-[#282828] rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#2cbb5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Videos Found</h3>
              <p className="text-gray-400 mb-4">
                Please check your YouTube API key and channel ID in the .env.local file.
              </p>
              <a 
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#2cbb5d] rounded-lg hover:bg-[#28a754] focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
              >
                Return to Home
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 