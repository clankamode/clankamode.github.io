---
name: brand-guidelines
description: Applies the Cinematic Engineering / Void Mode design language. Use when building or reviewing UI — enforces Nine Laws, color tokens, typography, and motion standards.
allowed-tools: Read, Glob, Grep
---

Apply the Cinematic Engineering design language to: $ARGUMENTS

## North Star

> Clean means answered, not empty. The page should be understood in one glance, then explored by choice. If you can't explain why an element exists, delete it.

## The Nine Laws

1. **Silence is Louder Than Noise** — Empty space is not unused, it's working
2. **Accent is a Signal Flare** — ≤3 accent instances per viewport; ≤1 primary CTA
3. **Typography Does the Work** — Size, weight, spacing create hierarchy (not color)
4. **Depth Through Restraint** — One effect only: blur OR glow OR gradient, never stacked
5. **Hover Reveals, Never Distracts** — Lift + bloom. Never bounce + flip.
6. **Everything Earns Its Place** — Decoration without function is noise
7. **Obvious Beats Clever** — If the user has to figure it out, you failed
8. **Two Modes, No Compromise** — Atmosphere (marketing) vs Workbench (data)
9. **Grayscale First** — If hierarchy disappears without color, fix the structure

## Color Tokens

### Surfaces
| Token | Hex | Use |
|-------|-----|-----|
| `--surface-ambient` | `#0d0d0d` | Page background |
| `--surface-interactive` | `#1a1a1a` | Cards, panels |
| `--surface-dense` | `#242424` | Forms, workbench |
| `--surface-workbench` | `#141414` | Dense data tables |

### Text
| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#ffffff` | Headlines, primary content |
| `--text-secondary` | `#a1a1a1` | Supporting text |
| `--text-muted` | `#6b6b6b` | Timestamps, metadata |

### Accent (Sparingly!)
| Token | Hex | Use |
|-------|-----|-----|
| `--accent-primary` | `#2cbb5d` | CTA, success, active states ONLY |
| `--accent-primary-muted` | `#1e8a42` | Hover states |
| `--accent-glow` | `rgba(44,187,93,0.15)` | Glow effects |

### Borders
| Token | Hex | Use |
|-------|-----|-----|
| `--border-subtle` | `#2a2a2a` | Default card borders |
| `--border-interactive` | `#3a3a3a` | Hover state borders |
| `--edge-highlight` | `rgba(255,255,255,0.04)` | 1px inset highlight |

## Typography

| Level | Tracking | Line-height |
|-------|----------|-------------|
| Display/H1 | -0.02em | 1.1 |
| H2/H3 | -0.01em | 1.3 |
| Body | 0 | 1.6 (45–75 char line length) |
| Caption | 0.05em | 1.4 |

## Motion

| Interaction | Transform | Duration | Easing |
|-------------|-----------|----------|--------|
| Hover card | `translateY(-2px)` + shadow | 200ms | ease-out |
| Hover button | background-opacity | 150ms | ease-out |
| Press | `translateY(1px)` | 100ms | ease-in |
| Focus | ring appears | 150ms | ease-out |
| Panel open | opacity + translateY(8px→0) | 300ms | ease-out |

**Never:** scale on text, bounce easing, simultaneous color-flip.

## The Frame Pattern

```tsx
<div className="
  bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl
  shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
  transition-all duration-200 ease-out
  hover:border-[#3a3a3a] hover:-translate-y-0.5 hover:shadow-lg
">
```

## Buttons

**Primary (one per viewport):**
- Background: `#2cbb5d`, text: `#000000`
- Hover: `brightness(1.1)` + glow

**Secondary:**
- Background: transparent, border: `#3a3a3a`
- No accent colors

## QA Gates

1. Grayscale test: hierarchy visible without color
2. Accent count: ≤3 per viewport, ≤1 CTA
3. Blur budget: ≤3 blur elements per page
4. Focus test: tab through every interactive element
5. Touch targets: ≥44×44px on mobile
