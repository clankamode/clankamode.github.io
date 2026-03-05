import React, { type SVGProps } from 'react';

type LearnGlyphProps = SVGProps<SVGSVGElement>;

interface ArticleNodeGlyphProps extends LearnGlyphProps {
  active?: boolean;
  level?: number;
}

interface ArticleProgressGlyphProps extends LearnGlyphProps {
  state: 'idle' | 'loading' | 'complete';
}

interface ArticleFeedbackGlyphProps extends LearnGlyphProps {
  vote: 'up' | 'down';
}

interface ArticleDirectionGlyphProps extends LearnGlyphProps {
  direction?: 'left' | 'right';
}

export function ArticleCompassGlyph(props: LearnGlyphProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="7.75" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M10 3.7v12.6M3.7 10h12.6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="10" cy="10" r="2.15" fill="currentColor" fillOpacity="0.2" />
      <path
        d="M10 6.2l1.15 2.65 2.65 1.15-2.65 1.15L10 13.8l-1.15-2.65-2.65-1.15 2.65-1.15L10 6.2z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArticleNodeGlyph({ active = false, level = 2, ...props }: ArticleNodeGlyphProps) {
  const coreRadius = level >= 3 ? 2 : 2.6;
  const rightOpacity = level >= 3 ? 0.45 : 0.75;
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.75 10h4.9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity={active ? 0.95 : 0.6}
      />
      <circle
        cx="9.5"
        cy="10"
        r={coreRadius}
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity={active ? 0.32 : 0.12}
      />
      <path
        d="M12.9 8.2h5.35M12.9 11.8h3.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={active ? 0.9 : rightOpacity}
      />
    </svg>
  );
}

export function ArticleProgressGlyph({ state, ...props }: ArticleProgressGlyphProps) {
  if (state === 'complete') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <circle cx="10" cy="10" r="7.75" stroke="currentColor" strokeWidth="1.35" opacity="0.9" />
        <circle cx="10" cy="10" r="6.7" fill="currentColor" fillOpacity="0.12" />
        <path
          d="M5.8 10.1l2.6 2.6 5.7-5.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (state === 'loading') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
        <circle cx="10" cy="10" r="7.75" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
        <path
          d="M10 2.25a7.75 7.75 0 0 1 6.95 4.32"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15.15 3.15h2.15v2.15"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="7.75" stroke="currentColor" strokeWidth="1.3" opacity="0.85" />
      <circle cx="10" cy="10" r="6.5" fill="currentColor" fillOpacity="0.08" />
      <path
        d="M5.8 10.1l2.6 2.6 5.7-5.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
    </svg>
  );
}

export function ArticleFeedbackGlyph({ vote, ...props }: ArticleFeedbackGlyphProps) {
  const isUp = vote === 'up';
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1.3" />
      {isUp ? (
        <path
          d="M5.5 8.9 7.8 11.2 12.5 6.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6.2 6.2 11.8 11.8M11.8 6.2 6.2 11.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function ArticleDirectionGlyph({ direction = 'right', ...props }: ArticleDirectionGlyphProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <g transform={direction === 'left' ? 'translate(18 0) scale(-1 1)' : undefined}>
        <path
          d="M1.8 9h12.1"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
        <path
          d="M10.1 5.5 14.2 9l-4.1 3.5"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
