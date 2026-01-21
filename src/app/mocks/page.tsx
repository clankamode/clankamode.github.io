import { Suspense } from 'react';
import { getInitialMockVideos } from '@/lib/mocks';
import MocksRatingClient from '@/components/MocksRatingClient';
import LoadingMocks from './_components/LoadingMocks';

export default async function MocksPage() {
  // Fetch initial videos and hasMore status
  const { videos: initialVideos, hasMore: initialHasMore } = await getInitialMockVideos();
  
  return (
    <div className="flex flex-col min-h-screen bg-surface-ambient pt-20">
      <section className="pb-16 bg-surface-ambient">
        <div className="max-w-screen-xl mx-auto px-4">
          <Suspense fallback={<LoadingMocks />}>
            <MocksRatingClient 
              initialVideos={initialVideos} 
              initialHasMore={initialHasMore} 
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
} 