'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useVideoContext } from '@/context/VideoContext';
import VideoCard from '@/components/ui/VideoCard';
import Link from 'next/link';

export default function VideosList() {
  const { videos, loading, hasMore, loadMoreVideos } = useVideoContext();
  const loaderRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery.length === 0
      ? videos
      : videos.filter((video) => {
        const searchText = `${video.title} ${video.description}`.toLowerCase();
        return searchText.includes(normalizedQuery);
      });

    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.publishedAt).getTime();
      const bTime = new Date(b.publishedAt).getTime();
      const aSafe = Number.isNaN(aTime) ? 0 : aTime;
      const bSafe = Number.isNaN(bTime) ? 0 : bTime;
      return sortOrder === 'newest' ? bSafe - aSafe : aSafe - bSafe;
    });

    return sorted;
  }, [videos, query, sortOrder]);

  useEffect(() => {
    if (query.trim().length > 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMoreVideos();
        }
      },
      { threshold: 1.0 }
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, loading, loadMoreVideos, query]);

  if (!loading && videos.length === 0 && hasMore === false) {
    return (
      <div className="bg-card rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">No Videos Found</h3>
        <p className="text-muted-foreground mb-4">
          Could not fetch videos. Please check the channel ID or API key.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-base font-medium text-primary-foreground bg-brand-green rounded-lg hover:bg-brand-green/90 focus:ring-2 focus:ring-brand-green/50 transition-all duration-300"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-[var(--nav-height)] z-30 w-full bg-white/60 dark:bg-black/60 backdrop-blur-md saturate-150 border-b border-black/5 dark:border-white/10 shadow-sm dark:shadow-black/20 mb-8 transition-all duration-300">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Videos</h1>
            {videos.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium rounded-full bg-secondary/80 border border-black/5 dark:border-white/10 text-secondary-foreground">
                {videos.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search videos..."
                className="w-full h-11 rounded-full border border-border bg-secondary/50 pl-11 pr-12 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:bg-background focus:ring-1 focus:ring-ring transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-secondary"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                )}
              </div>
            </div>

            <div className="relative group/sort">
              <button
                className="h-11 rounded-full border border-border bg-secondary/50 px-5 flex items-center gap-2 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:border-border active:scale-95"
              >
                <span className="text-muted-foreground/60">Sort:</span>
                <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                <svg className="w-4 h-4 text-muted-foreground/50 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-border bg-popover shadow-xl p-1 opacity-0 invisible translate-y-2 transition-all duration-200 group-hover/sort:opacity-100 group-hover/sort:visible group-hover/sort:translate-y-0 z-50">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortOrder === 'newest' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortOrder === 'oldest' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                >
                  Oldest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!loading && videos.length > 0 && filteredVideos.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No matches found</h3>
          <p className="text-muted-foreground mb-4">
            Try a different search term or clear the filter.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="inline-flex items-center px-4 py-2 text-base font-medium text-primary-foreground bg-brand-green rounded-lg hover:bg-brand-green/90 focus:ring-2 focus:ring-brand-green/50 transition-all duration-300"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
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
        </div>
      )}

      {hasMore && query.trim().length === 0 && (
        <div
          ref={loaderRef}
          className="flex justify-center items-center mt-12"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse delay-150"></div>
              <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse delay-300"></div>
              <span className="text-muted-foreground ml-2">Loading more videos...</span>
            </div>
          ) : (
            <div className="text-muted-foreground py-4">Scroll for more videos</div>
          )}
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <div className="text-center mt-12 py-4 text-muted-foreground">
          <p>You&apos;ve reached the end of the videos</p>
        </div>
      )}
    </>
  );
} 