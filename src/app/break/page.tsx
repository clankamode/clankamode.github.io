'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import YouTube from 'react-youtube';

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
}

const DEFAULT_DURATION_SECONDS = 300;

export default function BreakPage() {
  const [time, setTime] = useState(DEFAULT_DURATION_SECONDS);
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
    const beepSound =
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEYODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQgZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRQ0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdTy0HwvBSJ1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/z1YU2BRxqvu3mnEYODlOq5O+zYRsGPJLZ88p3KgUme8rx3I4+CRVht+rqpVITC0mh4fK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQgZZ7zs56BODwxPp+PxtmQcBjiP1/PMeS0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0PPThDUHHG3A7eSbTA0PVKrl77BgGQc9ltr0x3UoBSh9y/HajDsIF2W56+mjUREKTKPi8blnHgU1jdTy0HwvBSJ0xe/glEQKElux6eyrWRUJQ5vd88FwJAQug8/z1YY2BRxqvu3mnEYODlOq5O+zYRsGOpPY88p3KgUmecnw3Y4/CBVhtuvqpVQSCkig4PG9ayAFM4nS89GBMgUfccLv45dGDRBYrufur1sYB0CX2/PEcycFK3/M8tiKOQgZZ7vs56BODwxPp+Lxt2QdBTiP1/PMeS0GI3bH8d+RQQsUXbPq66hWEwlGnt/yv2wiBDCF0PPThDUHHG3A7eSbTA0PVKrl77BgGQc9ltr0x3UoBSh9y/HajDwIF2S56+mjUREKTKPi8blnHwU1jdTy0H4wBSF0xe/glEQKElux5+yrWRUJQ5vd88NwJAQug87y1oY3BRxqvu3mnEgNDlKp5PC1YRsGOpHY88p3LAUlecnw3Y8/CBVhtuvqpVQSCkig4PG9ayAFM4nS89GBMgUfccLv45dGDRBXr+fur1wXB0CX2/PEcycFKw==';

    audioRef.current = new Audio(beepSound);
    audioRef.current.volume = 1;
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

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

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, time]);

  useEffect(() => {
    if (!playerRef.current) return;

    if (isRunning && time > 0) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isRunning, time]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addTime = (seconds: number) => {
    setTime((prev) => Math.max(0, prev + seconds));
  };

  const stopAlarm = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const handleReset = () => {
    setTime(DEFAULT_DURATION_SECONDS);
    setIsRunning(false);
    stopAlarm();
  };

  const handleStartPause = () => {
    const nextIsRunning = !isRunning;
    if (nextIsRunning && time <= 0) return;

    setIsRunning(nextIsRunning);

    if (nextIsRunning) {
      stopAlarm();
    }
  };

  const onPlayerReady = (event: YouTubePlayerEvent) => {
    playerRef.current = event.target;

    if (isRunning && time > 0) {
      playerRef.current.playVideo();
    }
  };

  const timerPercent = useMemo(() => {
    const raw = (time / DEFAULT_DURATION_SECONDS) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [time]);

  const playerOptions = {
    playerVars: {
      autoplay: 0,
      controls: 1,
    },
  };

  return (
    <div className="min-h-screen bg-surface-ambient text-foreground px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-border-subtle bg-surface-workbench p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cinematic Engineering Break</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">Taking a break</h1>
          <div className="mt-4 inline-flex items-center rounded-xl border border-border-interactive bg-surface-interactive px-4 py-2">
            <span className="text-sm uppercase tracking-wide text-muted-foreground">Be back in</span>
            <span className="ml-3 text-4xl font-mono font-bold md:text-5xl">{formatTime(time)}</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-workbench shadow-sm">
            <div className="aspect-video w-full bg-surface-interactive">
              {isLoading && <p className="flex h-full items-center justify-center text-muted-foreground">Loading video…</p>}
              {error && <p className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">Unable to load video: {error}</p>}
              {!isLoading && !error && videoId && (
                <YouTube
                  videoId={videoId}
                  opts={playerOptions}
                  onReady={onPlayerReady}
                  className="h-full w-full"
                  iframeClassName="h-full w-full"
                />
              )}
              {!isLoading && !error && !videoId && <p className="flex h-full items-center justify-center text-muted-foreground">No video found.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-workbench p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Timer controls</h2>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '+0:30', value: 30 },
                  { label: '+1:00', value: 60 },
                  { label: '+5:00', value: 300 },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => addTime(option.value)}
                    disabled={isRunning}
                    className="rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm font-semibold transition hover:bg-surface-dense disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleStartPause}
                  disabled={isLoading || !!error || !videoId}
                  className="rounded-lg border border-brand-green/40 bg-brand-green/15 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-brand-green/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-border-subtle bg-surface-interactive px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-dense"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Session progress</span>
                <span>{Math.round(timerPercent)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-interactive">
                <div
                  className="h-full rounded-full bg-brand-green transition-[width] duration-1000 ease-linear"
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
