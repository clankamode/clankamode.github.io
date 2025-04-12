'use client';

import Image from 'next/image';
import { formatCount } from '@/lib/youtube';
import type { VideoAnalytics } from '@/lib/youtube';

interface TopVideosProps {
  videos: VideoAnalytics[];
}

export default function TopVideos({ videos }: TopVideosProps) {
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
    <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-6">
      <h2 className="text-xl font-bold text-white mb-6">Top Performing Videos</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase border-b border-[#3e3e3e]">
            <tr>
              <th scope="col" className="px-4 py-3">Video</th>
              <th scope="col" className="px-4 py-3">Views</th>
              <th scope="col" className="px-4 py-3 hidden md:table-cell">Published</th>
              <th scope="col" className="px-4 py-3 hidden md:table-cell">Likes</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-[#3e3e3e] hover:bg-[#1a1a1a]">
                <td className="px-4 py-4">
                  <a 
                    href={video.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3"
                  >
                    <div className="relative min-w-[48px] h-[36px] overflow-hidden rounded">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="line-clamp-1 text-white hover:text-[#2cbb5d]">{video.title}</span>
                  </a>
                </td>
                <td className="px-4 py-4 text-white font-medium">
                  {formatCount(video.viewCount)}
                </td>
                <td className="px-4 py-4 text-gray-400 hidden md:table-cell">
                  {formatDate(video.publishedAt)}
                </td>
                <td className="px-4 py-4 text-gray-400 hidden md:table-cell">
                  {video.likeCount ? formatCount(video.likeCount) : 'N/A'}
                </td>
              </tr>
            ))}
            
            {videos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No videos found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 