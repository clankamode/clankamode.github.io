import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'novice' | 'intermediate' | 'advanced' | 'expert';
    dot?: boolean;
}

export function Badge({ className, variant = 'default', dot = false, children, ...props }: BadgeProps) {
    const variants = {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground border-border',

        // Gradient of Mastery Translucent Styles
        novice: 'border-transparent bg-brand-green/10 text-brand-green border border-brand-green/20',
        intermediate: 'border-transparent bg-brand-amber/10 text-brand-amber border border-brand-amber/20',
        advanced: 'border-transparent bg-brand-red/10 text-brand-red border border-brand-red/20',
        expert: 'border-transparent bg-brand-charcoal text-white border border-brand-gold/20',
    };

    const dotColors = {
        default: 'bg-primary',
        secondary: 'bg-secondary-foreground',
        outline: 'bg-foreground',
        novice: 'bg-brand-green',
        intermediate: 'bg-brand-amber',
        advanced: 'bg-brand-red',
        expert: 'bg-brand-gold',
    };

    return (
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props}>
            {dot && (
                <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", dotColors[variant])} />
            )}
            {children}
        </div>
    );
}
