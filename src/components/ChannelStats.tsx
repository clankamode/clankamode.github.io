import { ChannelStats as ChannelStatsType, formatCount } from '@/lib/youtube';

interface ChannelStatsProps {
  stats: ChannelStatsType;
}

export default function ChannelStats({ stats }: ChannelStatsProps) {
  return (
    <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <img 
            src={stats.thumbnailUrl} 
            alt={stats.title} 
            className="w-24 h-24 rounded-full object-cover border-2 border-[#2cbb5d]"
          />
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h2 className="text-xl font-bold text-white mb-2">{stats.title}</h2>
          {stats.customUrl && (
            <p className="text-sm text-gray-400 mb-3">@{stats.customUrl}</p>
          )}
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{stats.description}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-[#2cbb5d]">{formatCount(stats.subscriberCount)}</span>
              <span className="text-xs text-gray-400">Subscribers</span>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-white">{formatCount(stats.videoCount)}</span>
              <span className="text-xs text-gray-400">Videos</span>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-white">{formatCount(stats.viewCount)}</span>
              <span className="text-xs text-gray-400">Views</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <a
            href={`https://www.youtube.com/channel/${stats.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-[#2cbb5d] rounded-lg hover:bg-[#28a754] transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Visit Channel
          </a>
        </div>
      </div>
    </div>
  );
} 