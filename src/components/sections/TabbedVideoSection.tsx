'use client';

import { useState } from 'react';
import Link from 'next/link';
import VideoCard from '@/components/ui/VideoCard';
import { YouTubeVideo } from '@/lib/youtube';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

interface TabbedVideoSectionProps {
  latestVideos: YouTubeVideo[];
  popularVideos: YouTubeVideo[];
  viewAllHref?: string;
}

const tabOptions = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
] as const;

type TabId = (typeof tabOptions)[number]['id'];

export default function TabbedVideoSection({
  latestVideos,
  popularVideos,
  viewAllHref,
}: TabbedVideoSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('latest');
  const videos = activeTab === 'latest' ? latestVideos : popularVideos;
  const emptyStateTitle = activeTab === 'latest'
    ? 'No Latest Videos Found'
    : 'No Popular Videos Found';
  const emptyStateMessage = activeTab === 'latest'
    ? 'Please check your YouTube API key and channel ID in the .env.local file.'
    : 'Could not fetch popular videos at this time.';
  const featuredVideo = videos[0];
  const supportingVideos = videos.slice(1, 3);

  return (
    <section className="py-16 bg-background text-foreground">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-12 border-b border-border-subtle pb-4">
          <h2 className="text-4xl font-bold font-sans tracking-tight">
            Videos
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              options={tabOptions.map(tab => ({ id: tab.id, label: tab.label }))}
              value={activeTab}
              onChange={(value) => setActiveTab(value)}
              ariaLabel="Video category"
            />
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-muted-foreground hover:text-foreground font-medium flex items-center group"
              >
                View all
                <svg
                  className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-300">
            <div className="lg:col-span-2">
              <VideoCard
                variant="featured"
                title={featuredVideo.title}
                description={featuredVideo.description}
                thumbnailUrl={featuredVideo.thumbnailUrl}
                videoUrl={featuredVideo.videoUrl}
                date={featuredVideo.publishedAt}
                viewCount={featuredVideo.viewCount}
              />
            </div>
            <div className="flex flex-col gap-6">
              {supportingVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  variant="compact"
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
        ) : (
          <div className="rounded-xl p-12 text-center border border-dashed border-muted-foreground/20 bg-muted/30">
            <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">{emptyStateTitle}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {emptyStateMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
