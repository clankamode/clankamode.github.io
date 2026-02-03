'use client';

import { ChannelStats } from '@/lib/youtube';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface HeroSectionProps {
  channelStats: ChannelStats | null;
  channelId: string;
}

function ProfileImage({ src, alt, title }: { src: string; alt: string; title?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-full border border-border-subtle shadow-2xl bg-surface-interactive flex items-center justify-center">
        <span className="text-foreground font-bold text-3xl">
          {title?.charAt(0) || 'J'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-full border border-border-subtle shadow-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function HeroSection({ channelStats, channelId }: HeroSectionProps) {
  return (
    <section aria-label="Hero Section" className="relative bg-background pt-24 pb-16 px-4 md:px-8 overflow-x-hidden overflow-y-visible min-h-[80vh] flex items-center justify-center">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl text-center z-10 flex flex-col items-center w-full px-2 md:px-4">
        {/* Profile Image */}
        {channelStats?.thumbnailUrl && (
          <div className="relative mb-12 group cursor-pointer">
            <ProfileImage
              src={channelStats.thumbnailUrl}
              alt={channelStats.title || 'James Peralta'}
              title={channelStats.title}
            />
          </div>
        )}

        {/* Headline - Editorial Style */}
        <h1 className="mb-6 text-6xl md:text-8xl lg:text-9xl tracking-tighter font-sans font-black text-foreground w-full overflow-visible">
          <span className="block bg-gradient-to-br from-gray-100 via-gray-200 to-gray-400 dark:from-gray-200 dark:via-gray-300 dark:to-gray-500 bg-clip-text text-transparent pb-2">
            JAMES
          </span>
          <span className="block bg-gradient-to-r from-white via-blue-100 to-cyan-300 dark:from-white dark:via-blue-200 dark:to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
            PERALTA
          </span>
        </h1>

        {/* Subline */}
        <p className="mb-10 max-w-2xl text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
          Deep dives into algorithms, system design, and problem-solving strategies for technical interviews.
        </p>

        {/* Stats - Custom Brand Icons */}
        <div className="mb-14 flex flex-wrap justify-center gap-4 md:gap-8">
          <a href="https://www.youtube.com/@jamesperaltaSWE" target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2 rounded-full border border-border-subtle bg-white/5 hover:bg-white/10 transition-all hover:border-border-interactive">
            {/* YouTube Icon */}
            <svg
              className="w-5 h-5 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] group-hover:text-red-500 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <div className="text-left leading-none">
              <span className="block text-base font-bold text-foreground group-hover:text-red-400 transition-colors">200K</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Subscribers</span>
            </div>
          </a>

          <a href="https://leetcode.com/u/jamesperaltaSWE" target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2 rounded-full border border-border-subtle bg-white/5 hover:bg-white/10 transition-all hover:border-border-interactive">
            {/* LeetCode Icon */}
            <svg
              className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(255,161,22,0.4)] transition-transform group-hover:scale-110"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
            </svg>
            <div className="text-left leading-none">
              <span className="block text-base font-bold text-foreground group-hover:text-amber-400 transition-colors">1,758</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">LeetCode Rating</span>
            </div>
          </a>

          <a href="https://codeforces.com/profile/jamesperaltaSWE" target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2 rounded-full border border-border-subtle bg-white/5 hover:bg-white/10 transition-all hover:border-border-interactive">
            {/* Codeforces Icon */}
            <div className="flex items-end gap-[2px] h-5 transition-transform group-hover:scale-110">
              <div className="w-1.5 h-3 bg-yellow-400 rounded-sm drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]" />
              <div className="w-1.5 h-4 bg-blue-500 rounded-sm drop-shadow-[0_0_4px_rgba(33,150,243,0.4)]" />
              <div className="w-1.5 h-2.5 bg-red-500 rounded-sm drop-shadow-[0_0_4px_rgba(244,67,54,0.4)]" />
            </div>
            <div className="text-left leading-none">
              <span className="block text-base font-bold text-foreground group-hover:text-blue-400 transition-colors">1092</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Codeforces Rating</span>
            </div>
          </a>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <a
            href={`https://youtube.com/channel/${channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto px-10 bg-brand-green text-black hover:bg-brand-green/90 font-bold text-lg border-none shadow-none ring-0"
            >
              Watch on Youtube
            </Button>
          </a>
          <Link href="/videos" className="w-full sm:w-auto">
            <Button variant="ghost" size="lg" className="h-14 w-full sm:w-auto px-10 border border-white/10 hover:bg-white/5 text-foreground hover:border-white/30 transition-all font-medium text-lg">
              Explore Content <span className="ml-2">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
} 
