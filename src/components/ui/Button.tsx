import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' | 'novice' | 'intermediate' | 'advanced' | 'expert';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            // Standard Variants
            primary: 'bg-primary text-black hover:bg-primary/90 border-none font-semibold min-h-[44px] transition-all',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5',
            outline: 'border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
            link: 'text-primary underline-offset-4 hover:underline',

            // Gradient of Mastery Specifics (Cinematic Glows)
            novice: 'bg-brand-green text-white hover:bg-brand-green/90 shadow-[0_0_20px_-5px_rgba(44,187,93,0.4)] hover:shadow-[0_0_30px_-5px_rgba(44,187,93,0.6)] border border-brand-green/20 transition-all duration-300',
            intermediate: 'bg-brand-amber text-white hover:bg-brand-amber/90 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.6)] border border-brand-amber/20 transition-all duration-300',
            advanced: 'bg-brand-red text-white hover:bg-brand-red/90 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.6)] border border-brand-red/20 transition-all duration-300',
            expert: 'bg-brand-charcoal text-white hover:bg-brand-charcoal/90 shadow-[0_0_20px_-5px_rgba(82,82,82,0.4)] hover:shadow-[0_0_30px_-5px_rgba(82,82,82,0.6)] border border-white/10 transition-all duration-300',
        };

        const sizes = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-lg font-semibold tracking-wide',
            icon: 'h-10 w-10',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
