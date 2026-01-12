import { ChannelStats } from '@/lib/youtube';
import Image from 'next/image';

interface HeroSectionProps {
  channelStats: ChannelStats | null;
  channelId: string;
}

export default function HeroSection({ channelStats, channelId }: HeroSectionProps) {
  return (
    <section className="relative bg-[#282828] overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#2cbb5d]/20 to-[#1a1a1a]/20 mix-blend-multiply"></div>
      <div className="relative py-20 px-4 mx-auto max-w-screen-xl text-center lg:py-32">
        {/* Add Channel Profile Picture */}
        {channelStats && channelStats.thumbnailUrl && (
          <Image 
            src={channelStats.thumbnailUrl}
            alt={channelStats.title || 'Channel Profile Picture'}
            width={96}
            height={96}
            className="rounded-full mx-auto mb-6 border-2 border-[#2cbb5d]/50 object-cover"
          />
        )}
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2cbb5d] to-[#28a754]">
            {channelStats?.title || 'James Peralta'} {/* Display channel title or fallback */}
          </span>
        </h1>
        <p className="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 xl:px-48">
          {/* Display Channel Description if available, otherwise fallback */}
          {channelStats?.description || 
           'Deep dives into algorithms, system design, and problem-solving strategies for technical interviews.'
          }
        </p>
        
        {/* Channel Stats */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            <a href="https://www.youtube.com/@jamesperaltaSWE" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-[#ff0000]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="text-xl md:text-3xl font-bold text-white">200K</span>
              </div>
              <span className="text-xs md:text-sm text-gray-400">Subscribers</span>
            </a>
            <a href="https://leetcode.com/u/jamesperaltaSWE" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <Image 
                  src="/leetcode.svg" 
                  alt="Logo" 
                  width={50} 
                  height={50} 
                  className="h-6 w-6"
                />
                <span className="text-xl md:text-3xl font-bold text-white">1641</span>
              </div>
              <span className="text-xs md:text-sm text-gray-400">LeetCode Rating</span>
            </a>
            <a href="https://codeforces.com/profile/jamesperaltaSWE" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="2" y="9" width="5" height="11" fill="#ffc107" />
                  <rect x="9.5" y="5" width="5" height="15" fill="#03a9f4" />
                  <rect x="17" y="7" width="5" height="13" fill="#f44336" />
                </svg>
                <span className="text-xl md:text-3xl font-bold text-white">415</span>
              </div>
              <span className="text-xs md:text-sm text-gray-400">Codeforces Rating</span>
            </a>
          </div>
        </div>
        
        <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
          <a
            href={`https://youtube.com/channel/${channelId}`}
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
  );
} 
