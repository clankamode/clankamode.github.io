import Link from 'next/link';
import type { SessionItem } from '@/lib/progress';

interface UpNextQueueProps {
    items: SessionItem[];
}

export default function UpNextQueue({ items }: UpNextQueueProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section className="mt-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted mb-4">
                Up next
            </p>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center justify-between p-4 -mx-4 rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.03] text-xs text-text-muted font-medium">
                                {i + 1}
                            </span>
                            <div>
                                <p className="text-text-primary font-medium group-hover:text-text-primary transition-colors">
                                    {item.title}
                                </p>
                                <p className="text-sm text-text-muted">
                                    {item.subtitle}
                                </p>
                            </div>
                        </div>
                        <span className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
