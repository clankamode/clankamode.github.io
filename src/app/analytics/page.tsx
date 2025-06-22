'use client';

import { useState, useEffect } from 'react';
import ChannelOverview from './_components/ChannelOverview';
import PerformanceCards from './_components/PerformanceCards';
import TopVideos from './_components/TopVideos';
import ContentAnalysis from './_components/ContentAnalysis';
import type { ChannelAnalytics } from '@/lib/youtube';
import Loading from '@/components/ui/Loading';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Remove admin check
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';

  // Fetch analytics data
  const fetchAnalytics = async (forceRefresh = false) => {
    if (!channelId) {
      setError('YouTube channel ID is not configured');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/analytics?channelId=${channelId}${forceRefresh ? '&refresh=true' : ''}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // No authentication check
  useEffect(() => {
    // Define the fetch function inside the effect to avoid the dependency issue
    const fetchData = async () => {
      if (!channelId) {
        setError('YouTube channel ID is not configured');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/analytics?channelId=${channelId}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analytics data');
        }
        
        const data = await response.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [channelId]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    fetchAnalytics(true);
  };

  if (isLoading) {
    return <Loading/>;
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#1a1a1a] p-4">
        <div className="max-w-7xl mx-auto mt-8 bg-red-900/20 border border-red-900 rounded-lg p-4">
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#1a1a1a] p-4">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Channel Analytics</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-[#2cbb5d] text-white rounded-lg hover:bg-[#25a24f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {analytics && (
          <div className="space-y-6">
            {/* Grid layout for analytics components */}
            <ChannelOverview analytics={analytics} />
            <PerformanceCards analytics={analytics} />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7">
                <TopVideos videos={analytics.topVideos} />
              </div>
              <div className="md:col-span-5">
                <ContentAnalysis 
                  uploadFrequency={analytics.uploadFrequency}
                  videoDurationDistribution={analytics.videoDurationDistribution}
                  videoCategoryDistribution={analytics.videoCategoryDistribution}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 