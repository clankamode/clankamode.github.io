import VideoCard from '@/components/ui/VideoCard';

// This would typically come from your YouTube API or CMS
const videos = [
  {
    title: 'System Design Interview: Building a URL Shortener',
    description: 'Learn how to design a scalable URL shortener service from scratch.',
    thumbnailUrl: 'https://i.ytimg.com/vi/example1/maxresdefault.jpg',
    videoUrl: 'https://youtube.com/watch?v=example1',
    date: 'March 15, 2024',
  },
  {
    title: 'Dynamic Programming: Solving the Knapsack Problem',
    description: 'Master dynamic programming with this classic problem-solving tutorial.',
    thumbnailUrl: 'https://i.ytimg.com/vi/example2/maxresdefault.jpg',
    videoUrl: 'https://youtube.com/watch?v=example2',
    date: 'March 10, 2024',
  },
  {
    title: 'Graph Algorithms: Finding the Shortest Path',
    description: 'Deep dive into graph algorithms and pathfinding techniques.',
    thumbnailUrl: 'https://i.ytimg.com/vi/example3/maxresdefault.jpg',
    videoUrl: 'https://youtube.com/watch?v=example3',
    date: 'March 5, 2024',
  },
  {
    title: 'Binary Search Trees: Implementation and Operations',
    description: 'Complete guide to binary search trees and their operations.',
    thumbnailUrl: 'https://i.ytimg.com/vi/example4/maxresdefault.jpg',
    videoUrl: 'https://youtube.com/watch?v=example4',
    date: 'February 28, 2024',
  },
  {
    title: 'System Design: Designing a Chat Application',
    description: 'Learn how to design a real-time chat application.',
    thumbnailUrl: 'https://i.ytimg.com/vi/example5/maxresdefault.jpg',
    videoUrl: 'https://youtube.com/watch?v=example5',
    date: 'February 20, 2024',
  },
  {
    title: 'Advanced Sorting Algorithms: Quick Sort vs Merge Sort',
    description: 'Compare and implement advanced sorting algorithms.',
    thumbnailUrl: 'https://i.ytimg.com/vi/example6/maxresdefault.jpg',
    videoUrl: 'https://youtube.com/watch?v=example6',
    date: 'February 15, 2024',
  },
];

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Coding Interview Videos
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Browse through our collection of coding interview preparation videos
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              All Videos
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              System Design
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              Algorithms
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              Data Structures
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <VideoCard key={index} {...video} />
          ))}
        </div>
      </div>
    </div>
  );
} 