import React from 'react';

export default function LoadingVideos() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(24)].map((_, index) => (
        <div key={index} className="bg-surface-workbench rounded-lg overflow-hidden animate-pulse border border-border-subtle">
          <div className="h-48 bg-surface-dense"></div>
          <div className="p-5">
            <div className="h-6 bg-surface-dense rounded mb-2"></div>
            <div className="h-4 bg-surface-dense rounded mb-4 w-3/4"></div>
            <div className="h-10 bg-surface-dense rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 