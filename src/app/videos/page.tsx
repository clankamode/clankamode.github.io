import { Suspense } from 'react';
import VideosPageClient from '@/components/VideosPageClient';
import { getInitialVideos } from '@/lib/videos';
import LoadingVideos from './_components/LoadingVideos';

export default async function VideosPage() {
  // Fetch initial videos and hasMore status
  const { videos: initialVideos, hasMore: initialHasMore } = await getInitialVideos();


  return (
    <div className="flex flex-col min-h-screen bg-background pt-20">
      {/* Videos Grid with infinite scrolling */}
      <section className="pb-16">
        <div className="max-w-screen-xl mx-auto px-4">
          <Suspense fallback={<LoadingVideos />}>
            <VideosPageClient
              initialVideos={initialVideos}

              initialHasMore={initialHasMore}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
} 