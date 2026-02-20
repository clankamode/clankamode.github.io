---
name: void-mode-audit
description: Subtractive design audit for Void Mode compliance. Use when reviewing UI changes — checks accent density, blur budget, motion budget, and accessibility.
argument-hint: <file or component to audit — defaults to branch diff>
allowed-tools: Bash, Read, Grep, Glob
---

Audit UI changes for Void Mode compliance: $ARGUMENTS

If no argument, audit all UI files changed in this branch vs main (`git diff main`).

## Philosophy

> Remove. Demote. Then—and only then—add.

Every element must earn its place. If you can't explain why something exists, delete it.

## Audit Checklist

### 1. Accent Density
- [ ] ≤1 primary CTA (green button) per viewport
- [ ] ≤3 total accent instances (buttons, indicators, success states)
- [ ] Green glow counts as an accent instance
- [ ] No accent on nav background
- [ ] No accent on card borders at rest (should be `#2a2a2a`)

### 2. Blur Budget
- [ ] ≤3 blur elements per page total
- [ ] No blur behind body text or data tables
- [ ] Solid color fallback for text on glass surfaces

### 3. Grayscale Test
Screenshot → desaturate → verify:
- [ ] Hierarchy readable without color
- [ ] Primary/secondary/tertiary content distinguishable
- [ ] If hierarchy fails: fix the structure, not the color

### 4. Ghost State (Editor Surfaces)
- [ ] Ghost gutter buttons hidden at rest, visible on hover only
- [ ] `resize-none` on all textareas
- [ ] No visible borders on inputs in edit mode
- [ ] Active block indicator is subtle (1px, muted only)

### 5. Motion Budget
- [ ] ≤2 simultaneous animations at any time
- [ ] Hero transitions ≤500ms
- [ ] Micro-interactions ≤250ms
- [ ] No `scale` transforms on text elements
- [ ] No bounce easing

### 6. Accessibility (Non-Negotiable)
- [ ] Text contrast WCAG AA: 4.5:1 normal, 3:1 large text
- [ ] Focus ring: 2px visible on all interactive elements
- [ ] Touch targets: ≥44×44px on mobile
- [ ] Works with `prefers-reduced-motion`

## Common Violations → Fixes

| Violation | Fix |
|-----------|-----|
| Multiple green CTAs | Keep one, demote others to secondary style |
| Card borders using accent | Switch to `border-[#2a2a2a]` |
| Glow on non-interactive elements | Remove or use neutral shadow |
| Persistent toolbars in editor | Make hover-revealed |
| Textarea resize handles | Add `resize-none` |
| Stacked effects (blur + glow + gradient) | Pick one, remove others |

## Output

List each violation with file path and line number. End with a 1-2 sentence verdict.
