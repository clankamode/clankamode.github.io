import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PremiumGate() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-xl border border-border-subtle bg-surface-interactive/80 p-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      <div className="relative z-10 space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Premium</p>
        <h3 className="text-2xl font-semibold tracking-tight text-text-primary">
          Unlock the full deep dive
        </h3>
        <p className="text-base text-text-secondary">
          Sign in to access premium system design breakdowns and advanced templates.
        </p>
        <Link href="/login">
          <Button size="lg" className="bg-brand-green text-black hover:bg-brand-green/90">
            Sign in to continue
          </Button>
        </Link>
      </div>
    </div>
  );
}
