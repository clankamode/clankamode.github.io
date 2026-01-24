---
name: brand-guidelines
description: Applies James Peralta's "Cinematic Engineering" design language and Void Mode aesthetic to UI components and features. Use when implementing new features, refining visual design, or reviewing code for brand consistency.
---

# James Peralta Brand Guidelines

## Overview

This skill provides the official design language for the personal-website project. It enforces "Cinematic Engineering" principles: clean, confident, minimal UI where every element earns its place.

**Keywords**: branding, void mode, cinematic engineering, design system, visual identity, UI consistency, dark mode, accent colors, typography, motion, accessibility

## North Star

> **Clean means answered, not empty.** The page should be understood in one glance, then explored by choice. If you can't explain why an element exists, delete it.

## The Nine Laws

1. **Silence is Louder Than Noise.** Empty space is not "unused"—it's working.
2. **Accent is a Signal Flare.** ≤3 accent instances per viewport; ≤1 primary CTA.
3. **Typography Does the Work.** Size, weight, and spacing create hierarchy.
4. **Depth Through Restraint.** Pick one effect (blur OR glow OR gradient), never stack.
5. **Hover Reveals, Never Distracts.** Lift + bloom, not bounce + flip.
6. **Everything Earns Its Place.** Decoration without function is noise.
7. **Obvious Beats Clever.** If the user has to figure it out, you failed.
8. **Two Modes, No Compromise.** Atmosphere (marketing) vs Workbench (data).
9. **Grayscale First.** If hierarchy disappears in grayscale, color is compensating for bad structure.

---

## Brand Colors

### Surfaces (Dark Theme)

| Token | Hex | Use |
|-------|-----|-----|
| `--surface-ambient` | `#0d0d0d` | Page background |
| `--surface-interactive` | `#1a1a1a` | Cards, panels |
| `--surface-dense` | `#242424` | Workbench, forms |
| `--surface-workbench` | `#141414` | Dense data tables |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#ffffff` | Headlines, primary content |
| `--text-secondary` | `#a1a1a1` | Supporting text |
| `--text-muted` | `#6b6b6b` | Timestamps, metadata |

### Accent (Use Sparingly!)

| Token | Hex | Use |
|-------|-----|-----|
| `--accent-primary` | `#2cbb5d` | CTA, success, active states ONLY |
| `--accent-primary-muted` | `#1e8a42` | Hover states |
| `--accent-glow` | `rgba(44, 187, 93, 0.15)` | Glow effects |

### Borders

| Token | Hex | Use |
|-------|-----|-----|
| `--border-subtle` | `#2a2a2a` | Default card borders |
| `--border-interactive` | `#3a3a3a` | Hover state borders |
| `--border-workbench` | `rgba(255, 255, 255, 0.10)` | Table dividers |
| `--edge-highlight` | `rgba(255, 255, 255, 0.04)` | 1px inset highlight |

---

## Typography

| Level | Use | Tracking | Line-height |
|-------|-----|----------|-------------|
| Display | Hero headlines | -0.02em | 1.1 |
| H1 | Page titles | -0.01em | 1.2 |
| H2/H3 | Section heads | 0 | 1.3 |
| Body | Paragraphs | 0 | 1.6 |
| Caption | Labels, timestamps | 0.05em | 1.4 |
| Mono | Code, metadata | 0 | 1.5 |

**Rule:** Body text line-length 45–75 characters. Beyond 75: constrain width.

---

## Motion Language

| Interaction | Transform | Duration | Easing |
|-------------|-----------|----------|--------|
| Hover (card) | translateY(-2px) + shadow | 200ms | ease-out |
| Hover (button) | background-opacity | 150ms | ease-out |
| Active/Press | translateY(1px) | 100ms | ease-in |
| Focus | ring appears | 150ms | ease-out |
| Panel open | opacity + translateY(8px→0) | 300ms | ease-out |

**Never:** scale on text elements, bounce easing, simultaneous color-flip.

---

## Component Signatures

### The "Frame" (Cards/Panels)
```css
.frame {
  background: var(--surface-interactive);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.frame::before {
  box-shadow: inset 0 1px 0 var(--edge-highlight);
}
.frame:hover {
  border-color: var(--border-interactive);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
}
```

### Primary Button
- Background: `var(--accent-primary)`
- Text: `#000000`
- Hover: `brightness(1.1)` + glow
- **Only ONE per viewport**

### Secondary Button
- Background: transparent
- Border: `var(--border-interactive)`
- No accent colors

---

## Void Mode (Editor Aesthetic)

The editing surface should feel like "typing into a void":

1. **No card containers** around the editor
2. **No visible borders** on inputs in edit mode
3. **Ghost gutter** buttons appear only on hover
4. **No textarea resize handles**
5. **Minimal active block indicator** (1px, muted)
6. **Preview panel** is the "crafted artifact" with full styling

---

## Accessibility (Non-Negotiable)

| Rule | Requirement |
|------|-------------|
| Text contrast | WCAG AA (4.5:1 normal, 3:1 large) |
| Focus visibility | 2px ring visible against all backgrounds |
| Touch targets | ≥44×44px on mobile |
| Reduced motion | Must function with no transforms |

---

## QA Gates

Before shipping, verify:

1. **Grayscale test:** Hierarchy visible without color
2. **Accent count:** ≤3 per viewport, ≤1 CTA
3. **Blur budget:** ≤3 blur elements per page
4. **Focus test:** Tab through every interactive element

---

## Resources

Full design specification: [DESIGN_PRINCIPLES.md](file:///Users/issackjohn/repos/personal-website/docs/DESIGN_PRINCIPLES.md)
