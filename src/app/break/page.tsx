'use client';

import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube'; // Import the YouTube player

// Define minimal type for the YouTube Player instance
interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  // Add other methods if needed
}

// Define type for the onReady event
interface YouTubePlayerEvent {
  target: YouTubePlayer;
}

export default function BreakPage() {
  const [time, setTime] = useState(300); // Start with 5 seconds for testing
  const [isRunning, setIsRunning] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null); // Use defined type

  // Fetch random video ID on mount
  useEffect(() => {
    const fetchVideoId = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/youtube/random-video');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch video ID');
        }
        const data = await response.json();
        setVideoId(data.videoId);
      } catch (err: unknown) { // Use unknown instead of any
        console.error('Error fetching video ID:', err);
        // Type check before accessing properties
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideoId();
  }, []);

  // Initialize audio
  useEffect(() => {
    const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEYODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQgZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRQ0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdTy0HwvBSJ1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/z1YU2BRxqvu3mnEYODlOq5O+zYRsGPJLZ88p3KgUme8rx3I4+CRVht+rqpVITC0mh4fK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQgZZ7zs56BODwxPp+PxtmQcBjiP1/PMeS0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQHHG/A7eSaSw0PVqzl77BeGQc9ltv0xnUoBSh9y/HajDsIF2W56+mjUREKTKPi8blnHgU1jdTy0HwvBSJ0xe/glEQKElux6eyrWRUJQ5vd88FwJAQug8/z1YY2BRxqvu3mnEYODlOq5O+zYRsGOpPY88p3KgUmecnw3Y4/CBVhtuvqpVQSCkig4PG9ayAFM4nS89GBMgUfccLv45dGDRBYrufur1sYB0CX2/PEcycFK3/M8tiKOQgZZ7vs56BODwxPp+Lxt2QdBTiP1/PMeS0GI3bH8d+RQQsUXbPq66hWEwlGnt/yv2wiBDCF0PPThDUHHG3A7eSbTA0PVKrl77BgGQc9ltr0x3UoBSh9y/HajDwIF2S56+mjUREKTKPi8blnHwU1jdTy0H4wBSF0xe/glEQKElux5+yrWRUJQ5vd88NwJAQug87y1oY3BRxqvu3mnEgNDlKp5PC1YRsGOpHY88p3LAUlecnw3Y8/CBVhtuvqpVQSCkig4PG9ayAFM4nS89GBMgUfccLv45dGDRBXr+fur1wXB0CX2/PEcycFKw==';
    audioRef.current = new Audio(beepSound);
    audioRef.current.volume = 1.0;
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time > 0) { // Only run interval if running and time > 0
      interval = setInterval(() => {
        setTime((prevTime) => {
          const nextTime = prevTime - 1;
          if (nextTime <= 0) {
            setIsRunning(false); // Stop timer
            // Play alarm sound
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(err => console.log('Audio playback failed:', err));
              setTimeout(() => audioRef.current?.play().catch(err => console.log('Audio playback failed:', err)), 500);
              setTimeout(() => audioRef.current?.play().catch(err => console.log('Audio playback failed:', err)), 1000);
            }
            // Pause video when timer finishes
            playerRef.current?.pauseVideo();
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    } else if (!isRunning) {
      // If paused, ensure the interval is cleared.
      // No need to clear interval if time hit 0, as setIsRunning(false) does it.
    }
    return () => clearInterval(interval);
  }, [isRunning, time]); // Add time as dependency

  // Control YouTube Player based on isRunning state
  useEffect(() => {
    if (playerRef.current) {
      if (isRunning && time > 0) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isRunning, time]); // Add time as dependency to pause if timer hits 0 while running

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addTime = (seconds: number) => {
    setTime(prev => Math.max(0, prev + seconds)); // Prevent negative time from adding
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleReset = () => {
    setTime(300); // Reset to 5 minutes (or your preferred default)
    setIsRunning(false);
    stopAlarm();
    // Optionally fetch a new video on reset?
    // fetchVideoId(); // Uncomment if you want a new video on reset
  };

  const handleStartPause = () => {
    const newIsRunning = !isRunning;
    if (newIsRunning && time <= 0) return; // Don't start if time is 0

    setIsRunning(newIsRunning);
    if (newIsRunning) {
        stopAlarm(); // Stop beep if starting/resuming
    } else {
      // Pausing - player is handled by useEffect [isRunning, time]
    }
  };

  // YouTube player options
  const playerOptions = {
    height: '390',
    width: '640',
    playerVars: {
      autoplay: 0, // Don't autoplay initially
      controls: 1, // Show controls
    },
  };

  const onPlayerReady = (event: YouTubePlayerEvent) => {
    playerRef.current = event.target; // Save player instance
    // If timer was already running when video loaded, play video
    if (isRunning && time > 0) {
        playerRef.current.playVideo();
    }
  };

  return (
    <div className="min-h-screen bg-surface-ambient text-foreground p-4 flex flex-col items-center">

      {/* Title and Subtitle/Timer Display */}
      <div className="text-center mb-10"> {/* Added margin-bottom */}
        <h1 className="text-6xl font-bold mb-4">TAKING A BREAK</h1>
        <div className="text-4xl font-mono font-bold"> {/* Container for subtitle and timer */}
          be back in: {formatTime(time)}
        </div>
      </div>

      {/* Video Player Area & Controls Area */}
      <div className="mb-6 w-full max-w-4xl flex flex-col items-center"> {/* Combined container, removed mb-24, added flex-col */}
        {/* Video Player */} 
        <div className="w-full aspect-video bg-surface-interactive rounded-lg flex items-center justify-center mb-6"> {/* Added mb-6 */} 
          {isLoading && <p>Loading video...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && videoId && (
            <YouTube
              videoId={videoId}
              opts={playerOptions}
              onReady={onPlayerReady}
              className="w-full h-full"
              iframeClassName="w-full h-full rounded-lg"
            />
          )}
          {!isLoading && !error && !videoId && <p>No video found.</p>}
        </div>

        {/* Controls moved under video */}
        <div className="w-full max-w-md"> {/* Constrain controls width */} 
          {/* Quick Add Time Buttons */} 
          <div className="flex justify-center gap-4 mb-4"> {/* Reduced mb */} 
            <button
              onClick={() => addTime(30)}
              disabled={isRunning}
              className="px-4 py-2 bg-surface-interactive rounded-md hover:bg-surface-dense transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +0:30
            </button>
            <button
              onClick={() => addTime(60)}
              disabled={isRunning}
              className="px-4 py-2 bg-surface-interactive rounded-md hover:bg-surface-dense transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +1:00
            </button>
            <button
              onClick={() => addTime(300)}
              disabled={isRunning}
              className="px-4 py-2 bg-surface-interactive rounded-md hover:bg-surface-dense transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +5:00
            </button>
          </div>

          {/* Control Buttons */} 
          <div className="flex justify-center gap-4 mb-4"> {/* Added mb */} 
            <button
              onClick={handleStartPause}
              disabled={isLoading || !!error || !videoId} // Disable if loading, error, or no video
              className="px-8 py-3 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-surface-interactive rounded-md hover:bg-surface-dense transition-colors min-w-[120px]"
            >
              Reset
            </button>
          </div>

          {/* Progress Bar */} 
          <div className="relative h-2 bg-surface-interactive rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.min(100, (time / 300) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Removed Original Timer Controls Area */}
      {/* <div className="max-w-md w-full">
        <div className="bg-surface-interactive rounded-lg p-6">
          <div className="text-center mb-6">
             <div className="text-7xl font-mono font-bold mb-6">
              {formatTime(time)}
            </div> 

          </div>
        </div>
      </div> */}

    </div>
  );
} 