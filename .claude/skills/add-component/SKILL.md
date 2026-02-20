---
name: add-component
description: Create a new React component following the Cinematic Engineering design system. Use when building UI components, sections, or page-specific elements.
argument-hint: <component name and purpose>
allowed-tools: Read, Glob, Grep, Write, Edit
---

Create a new React component for: $ARGUMENTS

## 1. Determine Location

- `src/components/ui/` — generic UI primitives (buttons, inputs, badges)
- `src/components/sections/` — reusable page sections
- `src/app/[page]/_components/` — page-specific, not shared elsewhere

## 2. Create the Component

- Filename: PascalCase (`MyComponent.tsx`)
- TypeScript `interface` for all props (not `type`)
- Named export only
- No emojis

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

## 3. Apply Design Tokens (Cinematic Engineering)

**The Nine Laws — enforce all:**
1. Empty space is working — don't fill it
2. ≤3 accent instances per viewport, ≤1 primary CTA
3. Typography creates hierarchy — not color
4. One effect only: blur OR glow OR gradient, never stacked
5. Hover: `translateY(-2px)` + shadow lift. Never bounce.
6. Every element must earn its place
7. Obvious beats clever
8. Grayscale test: hierarchy must survive without color

**Color tokens:**

| Token | Hex | Use |
|-------|-----|-----|
| `--surface-ambient` | `#0d0d0d` | Page background |
| `--surface-interactive` | `#1a1a1a` | Cards, panels |
| `--surface-dense` | `#242424` | Forms, workbench |
| `--text-primary` | `#ffffff` | Headlines |
| `--text-secondary` | `#a1a1a1` | Supporting text |
| `--text-muted` | `#6b6b6b` | Timestamps, metadata |
| `--accent-primary` | `#2cbb5d` | CTA, active states ONLY |
| `--border-subtle` | `#2a2a2a` | Default borders |
| `--border-interactive` | `#3a3a3a` | Hover borders |

**Motion:**
- Hover card: `translateY(-2px)` + shadow, 200ms ease-out
- Hover button: background-opacity, 150ms ease-out
- Press: `translateY(1px)`, 100ms ease-in
- Focus: ring appears, 150ms ease-out

## 4. The Frame Pattern (Cards/Panels)

```tsx
<div className="
  bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl
  shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
  transition-all duration-200 ease-out
  hover:border-[#3a3a3a] hover:-translate-y-0.5 hover:shadow-lg
">
```

## 5. Verify Before Finishing

- [ ] Grayscale test: hierarchy visible without color
- [ ] Accent count: ≤3 per viewport, ≤1 primary CTA
- [ ] Blur budget: ≤3 blur elements per page
- [ ] Focus ring visible on all interactive elements
- [ ] Mobile touch targets ≥44×44px
- [ ] No unused imports
