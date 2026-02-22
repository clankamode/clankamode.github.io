---
name: add-component
description: Create design-compliant React components for this project. Use when adding new UI primitives, sections, or page-specific components and you need placement, styling, interaction, and verification rules.
---

# Add Component

Create React components that match this codebase's design and structure.

## Use With

- `.agent/skills/brand-guidelines/SKILL.md` for tokens and the Nine Laws
- `.agent/skills/frontend-design/SKILL.md` for strong visual direction

## Workflow

1. Pick the correct location:
- `src/components/ui/` for reusable primitives
- `src/components/sections/` for reusable page sections
- `src/app/[page]/_components/` for page-specific UI
2. Create a PascalCase file and named export:
- `MyComponent.tsx`
- `interface MyComponentProps { ... }`
3. Apply project styling rules:
- Use design tokens and existing utility classes
- Keep one clear primary action per viewport
- Avoid decorative effects that do not improve hierarchy
4. Add interaction polish:
- Hover: subtle lift (`translateY(-2px)`) + border/shadow change
- Focus: visible ring
- Motion: 150-200ms, ease-out
5. Verify before done:
- Desktop + mobile layout checks
- Grayscale hierarchy check
- Accent and blur budgets respected

## Starter Template

```tsx
interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-interactive p-6 transition hover:-translate-y-0.5 hover:border-border-interactive">
      <h3 className="font-medium text-text-primary">{title}</h3>
      {children}
    </div>
  );
}
```
