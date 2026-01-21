'use client';

import { YouTubeVideo } from '@/lib/youtube';
import { useState, useEffect } from 'react';

interface VideoRatingCardProps {
  video: YouTubeVideo;
  onRate: (videoId: string, rating: string) => void;
  currentRating?: string;
}

const TIMER_LENGTH = 30;

export default function VideoRatingCard({ video, onRate, currentRating }: VideoRatingCardProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(currentRating || null);
  const [countdown, setCountdown] = useState<number>(TIMER_LENGTH);
  const [timerComplete, setTimerComplete] = useState<boolean>(false);
  
  // Start countdown immediately when component loads
  useEffect(() => {
    // Only start the timer if it hasn't completed yet
    if (timerComplete) return;
    
    // Start the timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(timer);
  }, [timerComplete]);
  
  const handleRatingClick = (ratingId: string) => {
    // Don't do anything if clicking the same rating
    if (ratingId === selectedRating) return;
    setSelectedRating(ratingId);
  };

  const handleSubmit = () => {
    if (selectedRating && timerComplete) {
      const ratingLabel = ratings.find(r => r.id === selectedRating)?.label || selectedRating;
      onRate(video.id, ratingLabel);
    }
  };
  
  const ratings = [
    { 
      id: 'strong-no-hire', 
      label: 'Strong No Hire', 
      color: 'from-red-700 to-red-500',
      hoverColor: 'from-red-800 to-red-600',
      selectedColor: 'from-red-800 to-red-600',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      id: 'no-hire', 
      label: 'No Hire', 
      color: 'from-orange-600 to-orange-400',
      hoverColor: 'from-orange-700 to-orange-500',
      selectedColor: 'from-orange-700 to-orange-500',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      id: 'hire', 
      label: 'Hire', 
      color: 'from-blue-600 to-blue-400',
      hoverColor: 'from-blue-700 to-blue-500',
      selectedColor: 'from-blue-700 to-blue-500',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      id: 'strong-hire', 
      label: 'Strong Hire', 
      color: 'from-green-600 to-green-400',
      hoverColor: 'from-green-700 to-green-500',
      selectedColor: 'from-green-700 to-green-500',
      icon: (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
  ];

  return (
    <div className="frame bg-surface-workbench overflow-hidden transition-all duration-300 mb-8 shadow-lg">
      <div className="aspect-video relative">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
          title={video.title}
          allowFullScreen
        ></iframe>
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">{video.title}</h3>
        <p className="text-muted-foreground mb-6 line-clamp-3">{video.description}</p>
        
        <div className="space-y-4">
          <h4 className="text-xl font-semibold text-foreground">
            {'Rate this candidate:' }
          </h4>
          
          <div className="flex flex-wrap md:flex-nowrap gap-2 mb-4">
            {ratings.map((rating) => (
              <button
                key={rating.id}
                onClick={() => handleRatingClick(rating.id)}
                className={`
                  px-3 py-3 rounded-lg font-medium transition-all duration-200 
                  flex items-center justify-center flex-1
                  bg-gradient-to-r shadow-md transform hover:scale-105
                  ${ 
                    selectedRating === rating.id 
                      ? `${rating.selectedColor} text-white ring-2 ring-white ring-opacity-70 scale-105`
                      : `from-surface-interactive to-surface-dense text-muted-foreground hover:${rating.hoverColor} hover:text-white`
                  }
                `}
              >
                {rating.icon}
                <span className="whitespace-nowrap">{rating.label}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!selectedRating || !timerComplete}
            className={`
              w-full py-3 rounded-lg font-medium transition-all duration-300
              flex items-center justify-center shadow-lg
              ${selectedRating && timerComplete
                ? 'bg-gradient-to-r from-brand-green to-emerald-600 text-black hover:from-emerald-600 hover:to-emerald-500 transform hover:scale-[1.02]'
                : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            {!timerComplete ? (
              <>
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                Please wait {countdown}s before rating this candidate.. 
              </>
            ) : !selectedRating ? (
              'Select a Rating'
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Submit Rating & Next Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 