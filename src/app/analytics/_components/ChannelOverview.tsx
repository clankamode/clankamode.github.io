'use client';

import Image from 'next/image';
import { formatCount } from '@/lib/youtube';
import type { ChannelAnalytics } from '@/lib/youtube';

interface ChannelOverviewProps {
  analytics: ChannelAnalytics;
}

export default function ChannelOverview({ analytics }: ChannelOverviewProps) {
  return (
    <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Channel Image */}
        <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 border-[#2cbb5d]/30">
          <Image
            src={analytics.thumbnailUrl}
            alt={analytics.title}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Channel Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2">{analytics.title}</h2>
          {analytics.customUrl && (
            <p className="text-[#2cbb5d] mb-2">{analytics.customUrl}</p>
          )}
          <p className="text-gray-400 mb-4 line-clamp-2">{analytics.description}</p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3e3e3e]">
              <p className="text-sm text-gray-400">Subscribers</p>
              <p className="text-2xl font-bold text-[#2cbb5d]">{formatCount(analytics.subscriberCount)}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3e3e3e]">
              <p className="text-sm text-gray-400">Videos</p>
              <p className="text-2xl font-bold text-white">{formatCount(analytics.videoCount)}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3e3e3e]">
              <p className="text-sm text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-white">{formatCount(analytics.viewCount)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 