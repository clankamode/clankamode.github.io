import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface VideoCardProps {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  date: string;
  viewCount?: string;
  /** Compact variant hides description and footer button */
  variant?: 'default' | 'compact';
}

/** Format view count with K/M suffixes for compact display */
function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toLocaleString();
}

/** Format date to full format like "January 19, 2026" */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function VideoCard({ 
  title, 
  description, 
  thumbnailUrl, 
  videoUrl, 
  date, 
  viewCount,
  variant = 'default'
}: VideoCardProps) {
  const formattedViewCount = viewCount ? formatViewCount(viewCount) : '';
  const formattedDate = formatDate(date);
  const isCompact = variant === 'compact';

  return (
    <Card className="group overflow-hidden border-white/5 bg-card/30 backdrop-blur-sm hover:bg-card/40 hover:border-brand-green/30 hover:shadow-[0_0_40px_-10px_rgba(44,187,93,0.15)] transition-all duration-500 h-full flex flex-col">
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video overflow-hidden bg-muted/20">
        <Image
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          src={thumbnailUrl}
          alt={title}
          fill
        />
        {/* Metadata overlay - positioned at bottom of thumbnail */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-3 px-3">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-white/90">
            <span>{formattedDate}</span>
            {viewCount && (
              <>
                <span className="text-white/40">•</span>
                <span>{formattedViewCount} views</span>
              </>
            )}
          </div>
        </div>
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-[0_0_30px_rgba(44,187,93,0.6)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg className="h-7 w-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </a>

      <CardContent className={`flex flex-col flex-grow ${isCompact ? 'p-4' : 'p-5'}`}>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="group-hover:text-brand-green transition-colors duration-300">
          <h3 className={`line-clamp-2 font-bold leading-tight font-sans tracking-tight text-foreground group-hover:text-brand-green/90 ${isCompact ? 'text-base' : 'text-lg mb-2'}`}>
            {title}
          </h3>
        </a>

        {!isCompact && description && (
          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed mt-2">
            {description}
          </p>
        )}
      </CardContent>

      {!isCompact && (
        <CardFooter className="p-5 pt-0 mt-auto">
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="outline" size="sm" className="w-full border-white/10 text-muted-foreground hover:text-brand-green hover:border-brand-green/30 hover:bg-brand-green/5 transition-all">
              Watch Video
            </Button>
          </a>
        </CardFooter>
      )}
    </Card>
  );
} 