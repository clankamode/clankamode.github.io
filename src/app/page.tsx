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
    const videos = await getChannelVideos(channelId, 3);
    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch videos from YouTube
  const videos = await getYouTubeVideos();

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

      {/* Featured Videos Section */}
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
          
          {videos.length > 0 ? (
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

      {/* Topics Section */}
      <section className="py-16 bg-[#282828]">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Topics I Cover
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-all duration-300">
              <div className="w-12 h-12 bg-[#2cbb5d]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">System Design</h3>
              <p className="text-gray-400">Architect scalable systems and design robust solutions for real-world problems.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-all duration-300">
              <div className="w-12 h-12 bg-[#2cbb5d]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Algorithms</h3>
              <p className="text-gray-400">Master time and space complexity analysis with practical coding examples.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-all duration-300">
              <div className="w-12 h-12 bg-[#2cbb5d]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Data Structures</h3>
              <p className="text-gray-400">Implement and optimize data structures for efficient problem-solving.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-all duration-300">
              <div className="w-12 h-12 bg-[#2cbb5d]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Problem Solving</h3>
              <p className="text-gray-400">Develop systematic approaches to tackle complex coding challenges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-[#1a1a1a]">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Join the Community
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Connect with other developers, share your solutions, and grow together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`https://youtube.com/channel/${process.env.YOUTUBE_CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-[#2cbb5d] rounded-lg hover:bg-[#28a754] focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-[#2cbb5d] border border-[#2cbb5d] rounded-lg hover:bg-[#2cbb5d]/10 focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.92-.577.07-.248.084-.498.07-.777-.01-.378-.024-.758-.04-1.138-.08-.6-.42-1.01-.82-1.22-.28-.15-.68-.26-1.08-.26-.82 0-1.58.5-1.84 1.2-.18.4-.22.85-.2 1.3.02.5.1.98.3 1.45.2.47.5.9.9 1.2.4.3.9.5 1.4.6.5.1 1.1.1 1.6 0 .5-.1 1-.3 1.4-.6.4-.3.7-.73.9-1.2.2-.47.28-.95.3-1.45.02-.45-.02-.9-.2-1.3-.26-.7-1.02-1.2-1.84-1.2-.4 0-.8.11-1.08.26-.4.21-.74.62-.82 1.22-.016.38-.03.76-.04 1.138-.014.28-.014.53-.07.777-.1.32-.32.69-.92.577-4.767-1.582-8.205-6.082-8.205-11.385 0-6.627 5.373-12 12-12 6.628 0 12 5.373 12 12 0 5.303-3.438 9.8-8.205 11.385z"/>
              </svg>
              GitHub
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-[#2cbb5d] border border-[#2cbb5d] rounded-lg hover:bg-[#2cbb5d]/10 focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
