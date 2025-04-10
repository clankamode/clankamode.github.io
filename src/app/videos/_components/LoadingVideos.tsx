import React from 'react';

export default function LoadingVideos() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-[#282828] rounded-lg overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-700"></div>
          <div className="p-5">
            <div className="h-6 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 