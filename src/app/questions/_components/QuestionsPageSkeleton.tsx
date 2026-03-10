import React from 'react';

function QuestionListItemSkeleton({ withPreview = false }: { withPreview?: boolean }) {
  return (
    <li className="frame flex items-start gap-4 bg-surface-workbench p-5">
      <div className="flex w-[58px] shrink-0 flex-col items-center rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2">
        <div className="h-6 w-6 rounded-full bg-surface-dense" />
        <div className="mt-2 h-5 w-7 rounded bg-surface-dense" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="space-y-2">
          <div className="h-7 w-full max-w-3xl rounded bg-surface-interactive" />
          <div className="h-7 w-4/5 rounded bg-surface-interactive" />
        </div>
        {withPreview && (
          <div className="frame aspect-video w-full max-w-md rounded-lg bg-surface-interactive" />
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {withPreview && <div className="h-6 w-20 rounded-full bg-surface-interactive" />}
            <div className="h-5 w-36 rounded bg-surface-interactive" />
          </div>
          {!withPreview && <div className="h-9 w-40 rounded-lg bg-surface-interactive" />}
        </div>
      </div>
    </li>
  );
}

export default function QuestionsPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-ambient px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl animate-pulse space-y-8">
        <header className="space-y-3">
          <p className="text-base uppercase tracking-wider text-muted-foreground">Career Q&amp;A</p>
          <h1 className="text-4xl font-bold">Community Questions</h1>
          <div className="space-y-2">
            <div className="h-5 w-full max-w-2xl rounded bg-surface-interactive" />
            <div className="h-5 w-3/4 rounded bg-surface-interactive" />
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">Top Questions</h2>
            <div className="flex gap-2 rounded-lg border border-border-subtle bg-surface-workbench p-1">
              <div className="h-11 w-28 rounded-md bg-surface-interactive" />
              <div className="h-11 w-32 rounded-md bg-surface-interactive" />
            </div>
          </div>
          <ul className="space-y-3" aria-hidden="true">
            <QuestionListItemSkeleton />
            <QuestionListItemSkeleton withPreview />
            <QuestionListItemSkeleton />
          </ul>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface-workbench p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-foreground">Have a question?</h2>
            <div className="h-5 w-36 rounded bg-surface-interactive" />
          </div>
          <div className="h-12 w-full rounded-lg bg-surface-interactive" />
        </section>
      </div>
    </div>
  );
}
