# Design Language Constitution

---

## A) Author Fingerprint

### North Star

> **Clean means answered, not empty.** The page should be understood in one glance, then explored by choice. If you can't explain why an element exists, delete it.

### The Nine Laws

1. **Silence is Louder Than Noise.** The strongest visual statement is often the one you don't make. Empty space is not "unused"—it's working.

2. **Accent is a Signal Flare.** ≤3 accent instances per viewport; ≤1 primary CTA. The primary color appears only when something *requires* attention or confirms *success*.

3. **Typography Does the Work.** Size, weight, and spacing create hierarchy. Effects merely punctuate. If you need a glow to make something readable, your typography failed.

4. **Depth Through Restraint.** Layers, light-angles, and spacing create premium depth. Blur + glow + gradient + noise on one element is effect soup. Pick one.

5. **Hover Reveals, Never Distracts.** Hover states surface information or controls; they don't perform. Lift + bloom, not bounce + flip.

6. **Everything Earns Its Place.** Every element must pass the "what job does this do?" test. Decoration without function is noise.

7. **Obvious Beats Clever.** If the user has to figure it out, you failed. Clean means immediately understood, not stripped bare.

8. **Two Modes, No Compromise.** A page is either Atmosphere or Workbench; components may have variants per mode; dense content always forces Workbench tokens.

9. **Grayscale First.** If hierarchy disappears in grayscale, color is compensating for bad structure.

---

## B) Constitution

### Accessibility (Non-Negotiable)

| Rule | Test |
|------|------|
| Text contrast | WCAG AA (4.5:1 normal, 3:1 large) — measure with contrast checker |
| Focus visibility | 2px outline or ring, visible against all backgrounds — keyboard test every page |
| Color independence | Remove color: information still conveyed via icon/text/pattern |
| Touch targets | ≥44×44px on mobile — measure |
| Glass surfaces | Solid fallback required for >3 lines of text or any data table |

### Performance Budgets

| Budget | Limit |
|--------|-------|
| Blur elements | ≤3 per viewport (nav, hero panel, one accent). Blur never sits behind body text or tables. |
| Simultaneous animations | ≤2 active at once |
| Motion duration ceiling | 500ms (hero transitions); 250ms (micro) |
| `prefers-reduced-motion` | Must function fully with no transforms |
| Image format | WebP/AVIF, lazy-loaded below fold |
| Font strategy | `font-display: swap`, ≤3 families |

### Density Modes

**Atmosphere Mode** — Marketing, hero, landing
- Generous spacing (1.5× base scale)
- Blur permitted on surfaces
- Glow permitted on accent elements
- Fewer controls visible; progressive disclosure

**Workbench Mode** — Dashboards, settings, data
- Tight spacing (1× base scale)
- No blur on surfaces
- No glow except focus states
- Use `--border-workbench` for table dividers/row separators (sharper contrast)
- Optional: `--surface-workbench` for dense tables/lists
- Maximum information density

*Rule: Every component must declare its mode variant; tokens differ by mode; dense content always uses Workbench tokens.*

### Typography System

| Level | Use | Tracking | Line-height |
|-------|-----|----------|-------------|
| Display | Hero headlines | -0.02em (tight) | 1.1 |
| H1 | Page titles | -0.01em | 1.2 |
| H2/H3 | Section heads | 0 | 1.3 |
| Body | Paragraphs | 0 | 1.6 |
| Caption | Timestamps, labels | 0.05em (wide) | 1.4 |
| Mono | Code, metadata | 0 | 1.5 |

*Rule: Body text line-length 45–75 characters. Beyond 75: add columns or constrain width.*

### Motion Language

| Interaction | Transform | Duration | Easing |
|-------------|-----------|----------|--------|
| Hover (card) | translateY(-2px) + shadow bloom | 200ms | ease-out |
| Hover (button) | background-opacity shift | 150ms | ease-out |
| Active/Press | translateY(1px) + inner glow | 100ms | ease-in |
| Focus | ring appears | 150ms | ease-out |
| Panel open | opacity + translateY(8px→0) | 300ms | ease-out |
| Page transition | opacity only | 200ms | ease-in-out |

*Never: scale on text-heavy elements (blurs type), bounce easing, simultaneous color-flip.*

---

## C) Decision Engine

### 1. The "Earned UI" Test

Before adding any visual element, it must do one of three jobs:

- **Answer:** Reduces a question immediately (hierarchy, labels, status)
- **Action:** Enables the next step now (affordance, CTA, navigation)
- **Assurance:** Increases trust (feedback, confirmation, progress, proof)

If an element doesn't do one of these *in the current context*, it's noise. Delete it.

**The three questions:**
1. Which job does this do? (Answer / Action / Assurance)
2. Can an existing element do this job instead?
3. What breaks if I remove it? (nothing = delete it)

### 2. The Reading Budget

**Landing pages:** User reads ≤30 words before understanding what the page offers.

Test: Cover everything except the first viewport. Can a stranger explain what this site does? If not, reduce words or increase hierarchy.

**Interior pages:** First heading + first sentence = complete orientation.

### 3. The Accent Discipline Rule

Primary accent color (#2cbb5d green) appears ONLY for:
- Primary CTA (one per viewport)
- Success confirmation
- Active/selected state indicators
- Links on hover (not at rest)

**Never:** Headers, nav backgrounds, borders-at-rest, decorative icons, multiple buttons in same group.

**Accent Density Test (countable):**
- ≤1 primary CTA per viewport
- ≤3 accent instances per viewport (button bg, active indicator, success state)
- Link hover doesn't count at rest
- **Green glow counts as an accent instance** — don't backdoor accent via effects

### 4. The Collapsed State Rule

Every collapsed/preview state must answer the user's first question without expansion.

| Component | Must Show When Collapsed |
|-----------|-------------------------|
| Video card | Title + thumbnail + duration |
| Nav item | Label + active indicator |
| Notification | Type + headline + timestamp |
| List row | Primary identifier + status |

*If collapsed state requires thought to understand, expand by default or redesign.*

---

## D) Tokens + Component Recipes

### Token Definitions

```css
:root {
  /* Surfaces */
  --surface-ambient: #0d0d0d;        /* Page background */
  --surface-interactive: #1a1a1a;    /* Cards, panels */
  --surface-dense: #242424;          /* Workbench, forms, data */
  
  /* Text */
  --text-primary: #ffffff;           /* Headlines, primary content */
  --text-secondary: #a1a1a1;         /* Supporting text, descriptions */
  --text-muted: #6b6b6b;             /* Timestamps, metadata */
  
  /* Accent */
  --accent-primary: #2cbb5d;         /* CTA, success, active states ONLY */
  --accent-primary-muted: #1e8a42;   /* Hover states, subtle indicators */
  --accent-glow: rgba(44, 187, 93, 0.15); /* Glow recipes */
  
  /* Borders */
  --border-subtle: #2a2a2a;          /* Default card borders */
  --border-interactive: #3a3a3a;     /* Hover state borders */
  --border-focus: var(--accent-primary); /* Focus rings */
  --border-workbench: rgba(255, 255, 255, 0.10); /* Workbench: table dividers, row separators */
  
  /* Edge highlight (the "frame" signature) */
  --edge-highlight: rgba(255, 255, 255, 0.04); /* 1px inset highlight at top of cards */
  
  /* Workbench surfaces (optional, for denser data displays) */
  --surface-workbench: #141414;      /* Workbench: tables, dense lists */
  
  /* Radii (two values only) */
  --radius-sm: 6px;                  /* Buttons, inputs, small cards */
  --radius-lg: 12px;                 /* Panels, modals, large cards */
  
  /* Spacing Scale (8px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  
  /* Motion */
  --duration-micro: 150ms;
  --duration-standard: 200ms;
  --duration-emphasis: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  
  /* Focus */
  --focus-ring: 0 0 0 2px var(--surface-ambient), 0 0 0 4px var(--accent-primary);
  
  /* Shadows */
  --shadow-lift: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-glow-ambient: 0 0 40px var(--accent-glow);
  --shadow-glow-interactive: 0 0 20px var(--accent-glow);
  --shadow-glow-focus: 0 0 0 4px rgba(44, 187, 93, 0.25);
}
```

### Glow Recipes (Three Only)

| Recipe | Use | CSS |
|--------|-----|-----|
| Ambient | Hero name (if used), major headlines | `text-shadow: 0 0 40px rgba(44, 187, 93, 0.3)` |
| Interactive | Button hover, primary CTA hover | `box-shadow: 0 0 20px rgba(44, 187, 93, 0.15)` |
| Focus | Focus rings | `box-shadow: var(--focus-ring)` |

*Constraints:*
- One glow per element maximum. Never stack.
- **Green glow counts as an accent instance.** Budget accordingly.
- Card hover uses neutral `--shadow-lift`, not accent glow.

---

### Component Recipes

#### Nav

**Signature:** Quiet by default. One loud element maximum (the primary CTA).

```
Base:
- Background: var(--surface-interactive) with backdrop-blur (8px)
- Border-bottom: 1px solid var(--border-subtle)
- Logo: var(--text-primary), NO accent color
- Links: var(--text-secondary)

Hover (links):
- Color: var(--text-primary)
- NO glow, NO underline animation

Active (current page):
- Color: var(--text-primary)  
- Indicator: 2px bottom border in var(--accent-primary)

CTA Button (one only):
- Background: var(--accent-primary)
- Text: #000000
- Hover: brightness(1.1)

❌ DON'T:
- Accent color on logo
- Accent color on nav background (ever)
- Glow on nav links
- Multiple green buttons
- Heavy borders or separators

Nav background is never accent. Accent only appears as active indicator + one CTA.
```

#### Card / Panel (Video Card)

**Signature:** The "frame" — subtle border + inset top-edge highlight (via pseudo-element) + hover reveal.

```
Base:
- Position: relative (for ::before pseudo-element)
- Background: var(--surface-interactive)
- Border: 1px solid var(--border-subtle)
- Border-radius: var(--radius-lg)
- ::before: inset box-shadow (0 1px 0 var(--edge-highlight)) for specular edge
- Padding: var(--space-4)
- Title: var(--text-primary)
- Metadata: var(--text-muted), mono font

Hover:
- Border: 1px solid var(--border-interactive)
- Transform: translateY(-2px)
- Box-shadow: var(--shadow-lift)
- Optional: reveal duration badge or play icon

Active/Press:
- Transform: translateY(0)
- Background: var(--surface-dense)

Focus:
- Box-shadow: var(--focus-ring)
- Outline: none

Disabled:
- Opacity: 0.5
- Pointer-events: none

❌ DON'T:
- Green borders at rest
- Glow at rest
- Scale transforms
- Multiple accent elements per card
```

#### Primary Button

**Signature:** Engineered power — solid, confident, singular.

```
Base:
- Background: var(--accent-primary)
- Color: #000000 (dark text on light bg)
- Border: none
- Border-radius: var(--radius-sm)
- Padding: var(--space-3) var(--space-5)
- Font-weight: 600
- Min-height: 44px

Hover:
- Filter: brightness(1.1)
- Box-shadow: var(--shadow-glow-interactive)
- Cursor: pointer

Active:
- Filter: brightness(0.95)
- Transform: translateY(1px)

Focus:
- Box-shadow: var(--focus-ring)

Disabled:
- Background: var(--text-muted)
- Color: var(--surface-ambient)
- Cursor: not-allowed

❌ DON'T:
- Gradient backgrounds
- Multiple primary buttons in same context
- Green outline variant (use secondary)
```

#### Secondary Button

**Signature:** Ghost with presence — outline that knows its place.

```
Base:
- Background: transparent
- Color: var(--text-primary)
- Border: 1px solid var(--border-interactive)
- Border-radius: var(--radius-sm)
- Padding: var(--space-3) var(--space-5)

Hover:
- Background: rgba(255, 255, 255, 0.05)
- Border-color: var(--text-secondary)

Active:
- Background: rgba(255, 255, 255, 0.08)

Focus:
- Box-shadow: var(--focus-ring)

Disabled:
- Opacity: 0.4

❌ DON'T:
- Accent-colored borders
- Glow on hover
- Compete visually with primary
```

#### List Row (Video List)

**Signature:** Scannable, quiet, information-dense.

```
Base:
- Background: transparent (or var(--surface-workbench) in Workbench mode)
- Border-bottom: 1px solid var(--border-subtle) (or var(--border-workbench) in Workbench mode)
- Padding: var(--space-4) 0
- Layout: thumbnail (fixed width) | title + meta (flex) | actions (fixed)
- Title: var(--text-primary), single line, truncate
- Meta: var(--text-muted), mono, smaller

Hover:
- Background: rgba(255, 255, 255, 0.02)
- Show action buttons (if hidden)

Focus-within:
- Background: rgba(255, 255, 255, 0.03)
- Outline on interactive child

❌ DON'T:
- Accent color on row backgrounds
- Visible actions at rest (reveal on hover)
- Heavy row separators
```

---

## E) Site Transformation Plan

### Current Problems

1. **Accent everywhere:** Green navbar, green hero name, green on cards = no hierarchy
2. **Template feel:** Nothing says "authored" — could be any creator site
3. **Muddy priorities:** Eye doesn't know where to land

### Before → After Transformations

| # | Element | Before | After |
|---|---------|--------|-------|
| 1 | Navbar logo/text | Accent green | `--text-primary` (white) |
| 2 | Navbar links | Mixed colors | `--text-secondary`, white on hover |
| 3 | Navbar CTA | Green (same as everything) | ONLY green element in nav |
| 4 | Hero name | Green + glow | White text, NO glow (or: white + green glow, but that counts as 1 accent instance) |
| 5 | Hero CTA | Green button | Keep green — now it's singular, powerful |
| 6 | Card borders | Green tint | `--border-subtle` (neutral) |
| 7 | Card hover | Green glow | Neutral lift + `--shadow-lift` |
| 8 | Card titles | Potentially green | `--text-primary` (white) |
| 9 | Metadata text | Low contrast | `--text-muted` + mono font |
| 10 | Video duration badges | Accent background | `--surface-dense` background, white text |
| 11 | Section headers | Generic | Tighter tracking, larger scale gap from body |
| 12 | Grid spacing | Tight | Increase gap to `--space-6` for luxury feel |
| 13 | Page background | Pure black | `--surface-ambient` (#0d0d0d) for depth |
| 14 | Focus states | Default browser | Custom `--focus-ring` |
| 15 | Hover transitions | Instant/missing | 200ms ease-out |

### The 3% That Changes Everything

These micro-edits have disproportionate impact:

1. **Remove green from the hero name.** Change to white text. If you keep a green glow, it counts as one of your ≤3 accent instances — budget accordingly. The name now feels confident, not decorated.

2. **Reduce navbar to one green element.** The CTA. Everything else goes neutral. Immediately feels intentional.

3. **Add the "frame" signature to cards.** 1px subtle border + inner padding + lift on hover. This becomes your visual fingerprint across the site.

4. **Tighten headline tracking by -0.02em.** Instantly more editorial, less template.

5. **Switch metadata to monospace.** Timestamps, view counts, durations. Creates a "data layer" separate from content.

6. **Increase the gap between sections.** From 32px to 48px. Breathing room = premium.

7. **Make the page background not-quite-black.** #0d0d0d instead of #000. Subtle, but cards now "sit" on a surface instead of floating in void.

---

## F) QA Gates

### Pre-Ship Checklist (Pass/Fail)

| Gate | Test Method | Pass Condition |
|------|-------------|----------------|
| Grayscale hierarchy | Screenshot → desaturate in any image editor | Can identify primary/secondary/tertiary content without color |
| Accent density | Count accent-colored elements per viewport | ≤3 per viewport, ≤1 primary CTA |
| Blur budget | Count elements with backdrop-blur or blur filter | ≤3 per page |
| Motion budget | Record scroll/interaction → count simultaneous animations | ≤2 animating at once |
| Text contrast | Use contrast checker on all text/bg pairs | All pass WCAG AA (4.5:1 normal, 3:1 large) |
| Focus visibility | Tab through entire page | Every interactive element shows visible focus ring |
| Reduced motion | Enable `prefers-reduced-motion` → full page test | All features functional, no transforms |
| Touch targets | Measure button/link dimensions on mobile | All ≥44×44px |
| Loading states | Throttle network to Slow 3G → observe | Skeletons appear >500ms, no layout shift |
| Glow recipe compliance | Inspect all glow/shadow instances | Only uses defined recipes (ambient/interactive/focus) |
| Typography scale | Inspect all text sizes | Only uses defined scale values |
| Density mode purity | Review each page | No blur in Workbench mode; no dense grids in Atmosphere mode |

### The Final Question

> **If someone screenshots this page and removes all branding, would it feel like yours?**

If the answer is no, the fingerprint isn't strong enough. Go back to Laws 1–9.

---

## Implementation Notes

### Tailwind v4 Integration (CSS-First)

Define semantic tokens in `:root`, then map them into `@theme` for Tailwind utilities. This keeps a single source of truth.

```css
/* Semantic tokens (source of truth) */
:root {
  /* Surfaces */
  --surface-ambient: #0d0d0d;
  --surface-interactive: #1a1a1a;
  --surface-dense: #242424;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a1a1a1;
  --text-muted: #6b6b6b;
  
  /* Accent */
  --accent-primary: #2cbb5d;
  --accent-primary-muted: #1e8a42;
  --accent-glow: rgba(44, 187, 93, 0.15);
  
  /* Borders */
  --border-subtle: #2a2a2a;
  --border-interactive: #3a3a3a;
  --border-workbench: rgba(255, 255, 255, 0.10);
  --edge-highlight: rgba(255, 255, 255, 0.04);
  
  /* Workbench surfaces (optional, for denser data displays) */
  --surface-workbench: #141414;
  
  /* Radii */
  --radius-sm: 6px;
  --radius-lg: 12px;
  
  /* Spacing (8px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  
  /* Motion */
  --duration-micro: 150ms;
  --duration-standard: 200ms;
  --duration-emphasis: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  
  /* Composed values */
  --focus-ring: 0 0 0 2px var(--surface-ambient), 0 0 0 4px var(--accent-primary);
  --shadow-lift: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-glow-ambient: 0 0 40px var(--accent-glow);
  --shadow-glow-interactive: 0 0 20px var(--accent-glow);
  --shadow-glow-focus: 0 0 0 4px rgba(44, 187, 93, 0.25);
}

/* Map to Tailwind utilities */
@import "tailwindcss";

@theme {
  --color-surface-ambient: var(--surface-ambient);
  --color-surface-interactive: var(--surface-interactive);
  --color-surface-dense: var(--surface-dense);
  --color-surface-workbench: var(--surface-workbench);
  --color-fg: var(--text-primary);
  --color-fg-secondary: var(--text-secondary);
  --color-fg-muted: var(--text-muted);
  --color-accent: var(--accent-primary);
  --color-accent-muted: var(--accent-primary-muted);
  --color-border-subtle: var(--border-subtle);
  --color-border-interactive: var(--border-interactive);
  --color-border-workbench: var(--border-workbench);
  --radius-sm: var(--radius-sm);
  --radius-lg: var(--radius-lg);
  --spacing-1: var(--space-1);
  --spacing-2: var(--space-2);
  --spacing-3: var(--space-3);
  --spacing-4: var(--space-4);
  --spacing-5: var(--space-5);
  --spacing-6: var(--space-6);
  --spacing-7: var(--space-7);
  --spacing-8: var(--space-8);
  --spacing-9: var(--space-9);
  --duration-micro: var(--duration-micro);
  --duration-standard: var(--duration-standard);
  --duration-emphasis: var(--duration-emphasis);
  --ease-out: var(--ease-out);
  --ease-in-out: var(--ease-in-out);
}
```

**Usage in components:**
- Tailwind utilities: `bg-surface-interactive`, `text-fg`, `text-fg-muted`, `border-border-subtle`, `border-border-workbench`, `rounded-lg`
- Direct CSS: `var(--surface-interactive)`, `var(--text-primary)`, etc.

### Component Utility Classes

```css
/* Surface tiers */
.surface-ambient { background-color: var(--surface-ambient); }
.surface-interactive { background-color: var(--surface-interactive); }
.surface-dense { background-color: var(--surface-dense); }

/* The frame signature */
.frame {
  position: relative;
  background: var(--surface-interactive);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color var(--duration-standard) var(--ease-out),
              transform var(--duration-standard) var(--ease-out),
              box-shadow var(--duration-standard) var(--ease-out);
}
.frame::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 var(--edge-highlight);
}
.frame:hover {
  border-color: var(--border-interactive);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
}

/* Focus ring (apply to all interactive elements) */
.focus-ring:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

---

*Version 1.0 — A design language is a living document. Update it when you break it intentionally.*
