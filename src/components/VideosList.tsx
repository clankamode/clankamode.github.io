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
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search videos"
            className="w-full rounded-lg border border-border bg-muted/20 px-4 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/50"
          />
        </div>
        <div className="inline-flex items-center rounded-full border border-border bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setSortOrder('newest')}
            className={`px-4 py-2 rounded-full text-base font-medium transition-colors ${
              sortOrder === 'newest'
                ? 'bg-brand-green/15 text-brand-green'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortOrder('oldest')}
            className={`px-4 py-2 rounded-full text-base font-medium transition-colors ${
              sortOrder === 'oldest'
                ? 'bg-brand-green/15 text-brand-green'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Oldest
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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