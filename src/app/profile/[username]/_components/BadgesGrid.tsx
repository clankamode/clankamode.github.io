interface Badge {
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  earned_at: string;
}

interface BadgesGridProps {
  badges: Badge[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  BookMarked: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  ),
  Library: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Code2: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
  Trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  ),
  Target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v2m0 14v2M3 12h2m14 0h2m-4.22-6.22l-1.42 1.42M6.64 17.36l-1.42 1.42m12.14 0l-1.42-1.42M6.64 6.64L5.22 5.22" />
    </svg>
  ),
  Brain: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .28 2.716-1.144 2.716H7.942c-1.424 0-2.144-1.716-1.144-2.716l1.402-1.402" />
    </svg>
  ),
  Zap: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  Crown: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.5 19h19l-2-9-5 4-2.5-7L9.5 14l-5-4-2 9z" />
      <path d="M2 21h20v1.5a.5.5 0 01-.5.5h-19a.5.5 0 01-.5-.5V21z" />
    </svg>
  ),
};

function BadgeIcon({ name }: { name: string }) {
  return ICON_MAP[name] ?? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function BadgesGrid({ badges }: BadgesGridProps) {
  if (badges.length === 0) {
    return (
      <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Badges</h2>
        <p className="text-sm text-muted-foreground">No badges earned yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Badges</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {badges.map((badge) => {
          const isFounder = badge.slug === 'founder';
          return (
            <div
              key={badge.slug}
              className={
                isFounder
                  ? 'col-span-2 flex items-start gap-3 p-3 rounded-xl border relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-yellow-900/20 to-amber-950/40 border-amber-500/40'
                  : 'flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-surface-interactive border border-border-subtle min-w-0'
              }
            >
              {isFounder && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-400/10 to-amber-500/5 pointer-events-none" />
              )}
              <div
                className={
                  isFounder
                    ? 'flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30'
                    : 'flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center'
                }
              >
                <BadgeIcon name={badge.icon_name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-medium leading-tight ${isFounder ? 'text-amber-300' : 'text-foreground'}`}>
                  {badge.name}
                  {isFounder && <span className="ml-2 text-xs font-normal text-amber-500/70 uppercase tracking-wider">OG</span>}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2">{badge.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
