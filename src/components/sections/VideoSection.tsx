import VideoCard from '@/components/ui/VideoCard';
import { YouTubeVideo } from '@/lib/youtube';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface VideoSectionProps {
  title: string;
  videos: YouTubeVideo[];
  viewAllHref?: string; // Optional link for "View all"
  emptyStateTitle: string;
  emptyStateMessage: string;
  sectionBgClass?: string;
  emptyStateBgClass?: string;
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
    <section className={cn("py-16 bg-background text-foreground", sectionBgClass)}>
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12 border-b border-border pb-4">
          <h2 className="text-3xl font-bold font-sans tracking-tight">
            {title}
          </h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-brand-green hover:text-brand-green/80 font-medium flex items-center group">
              View all
              <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className={cn("rounded-xl p-12 text-center border border-dashed border-muted-foreground/20 bg-muted/30", emptyStateBgClass)}>
            <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">{emptyStateTitle}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {emptyStateMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  );
} 