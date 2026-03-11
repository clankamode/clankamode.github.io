import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="min-h-[calc(100vh-var(--nav-height,113px))] bg-background px-6 py-24 text-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-border-subtle bg-surface-1 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
          <div className="border-b border-border-subtle bg-[radial-gradient(circle_at_top,rgba(44,187,93,0.14),transparent_55%)] px-8 py-10 sm:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-text-muted">
              404
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              This page doesn&apos;t exist.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
              The link may be outdated, the page may have moved, or the URL is wrong.
            </p>
          </div>

          <div className="flex flex-col gap-4 px-8 py-8 sm:flex-row sm:px-12 sm:py-10">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Go Home
            </Link>
            <Link
              href="/questions"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle bg-transparent px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse Questions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
