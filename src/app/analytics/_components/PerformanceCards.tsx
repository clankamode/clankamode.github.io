'use client';

import { formatCount } from '@/lib/youtube';
import type { ChannelAnalytics } from '@/lib/youtube';

interface PerformanceCardsProps {
  analytics: ChannelAnalytics;
}

export default function PerformanceCards({ analytics }: PerformanceCardsProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Subscriber Count */}
      <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-colors">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 font-medium">Subscribers</h3>
          <div className="p-2 bg-[#2cbb5d]/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2cbb5d]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 015-2.906z" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white mb-1">{formatCount(analytics.subscriberCount)}</span>
          <span className="text-xs text-gray-500">Current total</span>
        </div>
      </div>

      {/* Card 2: Total Views */}
      <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-colors">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 font-medium">Total Views</h3>
          <div className="p-2 bg-[#2cbb5d]/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2cbb5d]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white mb-1">{formatCount(analytics.viewCount)}</span>
          <span className="text-xs text-gray-500">All-time channel views</span>
        </div>
      </div>

      {/* Card 3: Average Views */}
      <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-colors">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 font-medium">Avg. Views</h3>
          <div className="p-2 bg-[#2cbb5d]/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2cbb5d]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white mb-1">{formatCount(analytics.averageViewsPerVideo)}</span>
          <span className="text-xs text-gray-500">Per video</span>
        </div>
      </div>

      {/* Card 4: Latest Upload */}
      <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6 hover:border-[#2cbb5d] transition-colors">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 font-medium">Latest Upload</h3>
          <div className="p-2 bg-[#2cbb5d]/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2cbb5d]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white mb-1 truncate">{formatDate(analytics.mostRecentUploadDate)}</span>
          <span className="text-xs text-gray-500">Most recent publish</span>
        </div>
      </div>
    </div>
  );
} 