---
description: Create a new React component following the design system
---

## Steps

1. **Determine component location**
   - `src/components/ui/` for generic UI primitives
   - `src/components/sections/` for page sections
   - `src/app/[page]/_components/` for page-specific components

2. **Create the component file**
   - Use PascalCase: `MyComponent.tsx`
   - Include TypeScript interface for props
   - Use named exports

3. **Apply design tokens**
   - Reference `brand-guidelines` skill for colors, spacing, typography
   - Use Tailwind CSS 4 with `@theme` tokens
   - Follow the Nine Laws (accent budget, blur budget, etc.)

4. **Add interactivity**
   - Use motion primitives from `brand-guidelines`
   - Hover: `translateY(-2px)` + shadow lift
   - Focus: visible ring
   - Duration: 150-200ms ease-out

5. **Verify**
   - Check in browser at multiple viewport sizes
   - Run grayscale test for hierarchy
   - Confirm ≤1 primary CTA per viewport

## Template

```tsx
interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="bg-surface-interactive border border-border-subtle rounded-xl p-6 transition hover:border-border-interactive hover:-translate-y-0.5">
      <h3 className="text-text-primary font-medium">{title}</h3>
      {children}
    </div>
  );
}
```
