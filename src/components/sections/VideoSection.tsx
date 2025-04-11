import VideoCard from '@/components/ui/VideoCard';
import { YouTubeVideo } from '@/lib/youtube';
import Link from 'next/link';

interface VideoSectionProps {
  title: string;
  videos: YouTubeVideo[];
  viewAllHref?: string; // Optional link for "View all"
  emptyStateTitle: string;
  emptyStateMessage: string;
  sectionBgClass: string; // e.g., 'bg-[#1a1a1a]'
  emptyStateBgClass: string; // e.g., 'bg-[#282828]'
}

export default function VideoSection({
  title,
  videos,
  viewAllHref,
  emptyStateTitle,
  emptyStateMessage,
  sectionBgClass,
  emptyStateBgClass,
}: VideoSectionProps) {
  return (
    <section className={`py-16 ${sectionBgClass}`}>
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-white">
            {title}
          </h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-[#2cbb5d] hover:text-[#28a754] font-medium flex items-center">
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
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
          <div className={`${emptyStateBgClass} rounded-lg p-8 text-center`}>
            <div className="w-16 h-16 bg-[#2cbb5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2cbb5d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{emptyStateTitle}</h3>
            <p className="text-gray-400">
              {emptyStateMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  );
} 