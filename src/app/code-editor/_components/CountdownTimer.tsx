'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

export function CountdownTimer({ totalSeconds, onTimeUp }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUpRef.current();
      return;
    }

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [remaining]);

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const isWarning = remaining <= 300 && remaining > 60;
  const isCritical = remaining <= 60;

  return (
    <div
      className={`
        flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold
        transition-all duration-300
        ${isCritical
          ? 'bg-red-500/20 text-red-400 animate-pulse'
          : isWarning
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-surface-interactive text-text-secondary'
        }
      `}
    >
      <Timer className="h-4 w-4" />
      <span className="tabular-nums">{formatTime(remaining)}</span>
    </div>
  );
}
