'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';

/* ── 30 success messages ─────────────────────────────────────────── */

const SUCCESS_MESSAGES = [
  { heading: 'Nailed it.', sub: 'All tests passed — clean sweep.' },
  { heading: 'Flawless.', sub: 'Every single test, green.' },
  { heading: 'Rad.', sub: 'You just crushed that problem.' },
  { heading: 'Unstoppable.', sub: 'Zero failures. Zero doubt.' },
  { heading: 'Smooth operator.', sub: 'All tests passed on the mark.' },
  { heading: 'Chef\'s kiss.', sub: 'That solution is *immaculate*.' },
  { heading: 'Boom.', sub: 'Problem solved. All tests green.' },
  { heading: 'Legendary.', sub: 'Clean run — nothing but passes.' },
  { heading: 'You cooked.', sub: 'Every test case, handled.' },
  { heading: 'Locked in.', sub: 'Full marks. Full send.' },
  { heading: 'Dialed.', sub: 'All cases passed — not even close.' },
  { heading: 'Mint.', sub: 'Solution verified. Spotless.' },
  { heading: 'Surgical.', sub: 'Precision code. All tests pass.' },
  { heading: 'Built different.', sub: 'Zero failures detected.' },
  { heading: 'GG.', sub: 'Clean sweep — well played.' },
  { heading: 'Absolute unit.', sub: 'That solution hits every mark.' },
  { heading: 'Textbook.', sub: 'All tests pass. Beautifully done.' },
  { heading: 'Solid.', sub: 'Every assertion satisfied.' },
  { heading: 'Ship it.', sub: 'All green. Production-ready code.' },
  { heading: 'First try?', sub: 'All tests passed — respect.' },
  { heading: 'Cold-blooded.', sub: 'Executed flawlessly.' },
  { heading: 'Crisp.', sub: 'Not a single test left behind.' },
  { heading: 'Immaculate.', sub: 'All tests — passed. Period.' },
  { heading: 'Big brain.', sub: 'That algorithm cleared every case.' },
  { heading: 'No notes.', sub: 'All tests pass. Nothing to fix.' },
  { heading: 'Masterclass.', sub: 'Clean solution, clean results.' },
  { heading: 'Sheesh.', sub: 'Full pass. Every single one.' },
  { heading: 'Elite.', sub: 'All test cases — dominated.' },
  { heading: 'Vibes.', sub: 'Correct output across the board.' },
  { heading: 'Peak.', sub: 'All tests passed. You\'re on fire.' },
] as const;

/* ── Confetti ────────────────────────────────────────────────────── */

const CONFETTI_COLORS = [
  '#2cbb5d', '#22d3ee', '#a78bfa', '#facc15',
  '#fb923c', '#f472b6', '#34d399', '#60a5fa',
];

interface ConfettiPiece {
  id: number;
  angle: number;    // radians — direction it flies
  distance: number; // how far it travels (px)
  delay: number;
  duration: number;
  rotation: number; // initial rotation (deg)
  spin: number;     // extra spin (deg)
  size: number;
  color: string;
  shape: 'rect' | 'circle';
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    return {
      id: i,
      angle,
      distance: 120 + Math.random() * 280,
      delay: Math.random() * 0.35,
      duration: 1.2 + Math.random() * 1.0,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 720,
      size: Math.random() * 6 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    };
  });
}

/* ── Component ───────────────────────────────────────────────────── */

interface SuccessOverlayProps {
  show: boolean;
  onDismiss: () => void;
  passedCount: number;
  totalCount: number;
}

export function SuccessOverlay({ show, onDismiss, passedCount, totalCount }: SuccessOverlayProps) {
  const [message] = useState(() =>
    SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)],
  );
  const confetti = useMemo(() => generateConfetti(80), []);
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'hidden'>(
    show ? 'entering' : 'hidden',
  );

  useEffect(() => {
    if (show) {
      setPhase('entering');
      const t = setTimeout(() => setPhase('visible'), 50);
      return () => clearTimeout(t);
    } else {
      setPhase('exiting');
      const t = setTimeout(() => setPhase('hidden'), 400);
      return () => clearTimeout(t);
    }
  }, [show]);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (phase !== 'visible') return;
    const t = setTimeout(() => handleDismiss(), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleDismiss = useCallback(() => {
    setPhase('exiting');
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  useEffect(() => {
    if (phase === 'hidden') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleDismiss]);

  if (phase === 'hidden') return null;

  const isVisible = phase === 'entering' || phase === 'visible';

  return (
    /* Wrapper: centered in viewport, pointer-events only on the card itself */
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Confetti — burst outward from center */}
      <div className="absolute overflow-visible">
        {confetti.map((c) => {
          const endX = Math.cos(c.angle) * c.distance;
          const endY = Math.sin(c.angle) * c.distance;
          return (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: c.size,
                height: c.shape === 'rect' ? c.size * 1.6 : c.size,
                borderRadius: c.shape === 'circle' ? '50%' : '2px',
                backgroundColor: c.color,
                opacity: 0,
                transform: `rotate(${c.rotation}deg)`,
                animation: isVisible
                  ? `confettiBurst ${c.duration}s cubic-bezier(0.2, 0.8, 0.3, 1) ${c.delay}s forwards`
                  : 'none',
                // CSS custom properties drive the keyframe
                '--end-x': `${endX}px`,
                '--end-y': `${endY}px`,
                '--gravity': `${80 + Math.random() * 60}px`,
                '--spin': `${c.spin}deg`,
                '--start-rot': `${c.rotation}deg`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* Card — centered, non-blocking */}
      <div
        className="relative flex flex-col items-center gap-4 rounded-2xl border border-brand-green/20 px-8 py-6 pointer-events-auto transition-all duration-400 ease-out"
        style={{
          background:
            'linear-gradient(145deg, rgba(44, 187, 93, 0.06) 0%, rgba(13, 13, 13, 0.96) 35%, rgba(13, 13, 13, 0.98) 100%)',
          backdropFilter: 'blur(24px)',
          boxShadow: isVisible
            ? '0 0 80px rgba(44, 187, 93, 0.1), 0 24px 48px rgba(0, 0, 0, 0.6)'
            : 'none',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.85)',
        }}
        onClick={handleDismiss}
      >
        {/* Top row: check + heading */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-green/30"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(44, 187, 93, 0.2), rgba(44, 187, 93, 0.05))',
              boxShadow: '0 0 20px rgba(44, 187, 93, 0.15)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M5 13l4 4L19 7"
                stroke="#2cbb5d"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: isVisible ? 0 : 30,
                  transition: 'stroke-dashoffset 0.5s ease 0.1s',
                }}
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {message.heading}
          </h2>
        </div>

        {/* Subtitle */}
        <p className="max-w-[280px] text-center text-sm leading-relaxed text-text-secondary">
          {message.sub}
        </p>

        {/* Score pill */}
        <div className="flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/5 px-3.5 py-1">
          <span className="font-mono text-xs font-semibold text-brand-green">
            {passedCount}/{totalCount}
          </span>
          <span className="text-[11px] text-text-muted">passed</span>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes confettiBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(var(--start-rot)) scale(0);
          }
          12% {
            opacity: 1;
            transform: translate(
                calc(var(--end-x) * 0.4),
                calc(var(--end-y) * 0.4)
              )
              rotate(calc(var(--start-rot) + var(--spin) * 0.3))
              scale(1.1);
          }
          60% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translate(
                var(--end-x),
                calc(var(--end-y) + var(--gravity))
              )
              rotate(calc(var(--start-rot) + var(--spin)))
              scale(0.4);
          }
        }
      `}</style>
    </div>
  );
}
