'use client';

import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
}

const INITIAL_BREAK_SECONDS = 300;

export default function BreakPage() {
  const [time, setTime] = useState(INITIAL_BREAK_SECONDS);
  const [duration, setDuration] = useState(INITIAL_BREAK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

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
      } catch (err: unknown) {
        console.error('Error fetching video ID:', err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoId();
  }, []);

  useEffect(() => {
    const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEYODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQgZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRQ0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdTy0HwvBSJ1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/z1YU2BRxqvu3mnEYODlOq5O+zYRsGPJLZ88p3KgUme8rx3I4+CRVht+rqpVITC0mh4fK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQgZZ7zs56BODwxPp+PxtmQcBjiP1/PMeS0GI3bH8d+RQQsUXbPq66hWEwlGnt/yv2wiBDCG0PPThDUHHG3A7eSbTA0PVKrl77BgGQc9ltr0x3UoBSh9y/HajDwIF2S56+mjUREKTKPi8blnHwU1jdTy0H4wBSF0xe/glEQKElux5+yrWRUJQ5vd88NwJAQug87y1oY3BRxqvu3mnEgNDlKp5PC1YRsGOpHY88p3LAUlecnw3Y8/CBVhtuvqpVQSCkig4PG9ayAFM4nS89GBMgUfccLv45dGDRBXr+fur1wXB0CX2/PEcycFKw==';
    audioRef.current = new Audio(beepSound);
    audioRef.current.volume = 1.0;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const nextTime = prevTime - 1;
          if (nextTime <= 0) {
            setIsRunning(false);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch((err) => console.log('Audio playback failed:', err));
              setTimeout(() => audioRef.current?.play().catch((err) => console.log('Audio playback failed:', err)), 500);
              setTimeout(() => audioRef.current?.play().catch((err) => console.log('Audio playback failed:', err)), 1000);
            }
            playerRef.current?.pauseVideo();
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, time]);

  useEffect(() => {
    if (playerRef.current) {
      if (isRunning && time > 0) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isRunning, time]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addTime = (seconds: number) => {
    setTime((prev) => {
      const updatedTime = Math.max(0, prev + seconds);
      setDuration((prevDuration) => Math.max(prevDuration + seconds, updatedTime, 1));
      return updatedTime;
    });
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleReset = () => {
    setTime(INITIAL_BREAK_SECONDS);
    setDuration(INITIAL_BREAK_SECONDS);
    setIsRunning(false);
    stopAlarm();
  };

  const handleStartPause = () => {
    const newIsRunning = !isRunning;
    if (newIsRunning && time <= 0) return;

    setIsRunning(newIsRunning);
    if (newIsRunning) {
      stopAlarm();
      setDuration((prevDuration) => Math.max(prevDuration, time, 1));
    }
  };

  const playerOptions = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
    },
  };

  const onPlayerReady = (event: YouTubePlayerEvent) => {
    playerRef.current = event.target;
    if (isRunning && time > 0) {
      playerRef.current.playVideo();
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (time / Math.max(duration, 1)) * 100));

  return (
    <div className="min-h-screen bg-surface-ambient text-foreground px-4 py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">Cinematic break mode</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">TAKING A BREAK</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">A focused pause with motion, sound, and a clear return countdown.</p>
        </header>

        <Card className="border-border-interactive/60 bg-card/70">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-center text-xl sm:text-2xl">Be back in</CardTitle>
            <CardDescription className="text-center text-muted-foreground">Timer syncs playback and alarms when your break ends.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6">
            <div className="rounded-xl border border-border-subtle bg-surface-interactive/50 p-4 text-center sm:p-6">
              <p className="text-5xl font-bold tabular-nums text-foreground sm:text-6xl md:text-7xl">{formatTime(time)}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:text-sm">
                {isRunning ? 'Break in progress' : time === 0 ? 'Break finished' : 'Ready to start'}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-dense">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Button onClick={() => addTime(30)} disabled={isRunning} variant="secondary" size="sm" className="w-full rounded-lg text-sm">
                +0:30
              </Button>
              <Button onClick={() => addTime(60)} disabled={isRunning} variant="secondary" size="sm" className="w-full rounded-lg text-sm">
                +1:00
              </Button>
              <Button onClick={() => addTime(300)} disabled={isRunning} variant="secondary" size="sm" className="w-full rounded-lg text-sm">
                +5:00
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={handleStartPause}
                disabled={isLoading || !!error || !videoId}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {isRunning ? 'Pause Break' : 'Start Break'}
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="w-full">
                Reset Timer
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface-interactive/40">
          <div className="aspect-video w-full bg-surface-interactive">
            {isLoading && <p className="flex h-full items-center justify-center text-muted-foreground">Loading video...</p>}
            {error && <p className="flex h-full items-center justify-center px-4 text-center text-sm text-destructive">Error: {error}</p>}
            {!isLoading && !error && videoId && (
              <YouTube
                videoId={videoId}
                opts={playerOptions}
                onReady={onPlayerReady}
                className="h-full w-full"
                iframeClassName="h-full w-full"
              />
            )}
            {!isLoading && !error && !videoId && (
              <p className="flex h-full items-center justify-center text-muted-foreground">No video found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
