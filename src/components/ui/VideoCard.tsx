import Image from 'next/image';

interface VideoCardProps {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  date: string;
  viewCount?: string;
  variant?: 'default' | 'compact' | 'featured';
}

function formatViewCount(count: string): string {
  const num = parseInt(count, 10);
  if (Number.isNaN(num) || num < 0) {
    return '0';
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toLocaleString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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
  const isFeatured = variant === 'featured';

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 shadow-sm dark:shadow-none group-hover:ring-black/20 dark:group-hover:ring-white/20 transition-all duration-300">
        <Image
          className="object-cover transition-all duration-500 group-hover:scale-[1.02]"
          src={thumbnailUrl}
          alt={`YouTube video thumbnail for ${title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/20" />
        {viewCount && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[11px] font-medium text-white/80">
            {formattedViewCount} views
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-6 h-6 text-neutral-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="pt-3">
        <h3 className={`font-medium leading-snug text-foreground/90 group-hover:text-foreground transition-colors duration-200 line-clamp-2 ${isFeatured ? 'text-lg' : 'text-base'}`}>
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground/80 group-hover:text-muted-foreground transition-colors duration-200">
          {formattedDate}{viewCount && ` · ${formattedViewCount} views`}
        </p>
        {!isCompact && isFeatured && description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </a>
  );
}
