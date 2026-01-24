---
name: void-mode-audit
description: Subtractive design checker for Void Mode compliance. Use when reviewing UI changes, checking accent density, or verifying accessibility. Prevents regression to "noisy" design.
---

# Void Mode Audit

Checklist for verifying UI changes adhere to the subtractive design philosophy.

## The Philosophy

> Remove. Demote. Then—and only then—add.

Every element must earn its place. If you can't explain why something exists, delete it.

## Pre-Ship Checklist

### 1. Accent Density Check
Count accent-colored elements per viewport:

- [ ] ≤1 primary CTA (green button)
- [ ] ≤3 total accent instances (buttons, indicators, success states)
- [ ] Green glow counted as accent instance
- [ ] No accent on nav background
- [ ] No accent on card borders at rest

### 2. Blur Budget Check
Count elements with `backdrop-blur` or `blur`:

- [ ] ≤3 blur elements per page
- [ ] No blur behind body text or tables
- [ ] Solid fallback for text on glass

### 3. Grayscale Test
Screenshot → Desaturate → Verify:

- [ ] Hierarchy still visible without color
- [ ] Primary/secondary/tertiary content distinguishable
- [ ] If hierarchy disappears, color is compensating for bad structure

### 4. Ghost State Verification
For editor surfaces:

- [ ] Ghost gutter buttons hidden at rest, visible on hover
- [ ] No textarea resize handles (`resize-none`)
- [ ] No visible borders on inputs in edit mode
- [ ] Active block indicator is subtle (1px, muted color)

### 5. Motion Budget
- [ ] ≤2 simultaneous animations
- [ ] Duration ≤500ms for hero transitions
- [ ] Duration ≤250ms for micro-interactions
- [ ] No scale transforms on text elements
- [ ] No bounce easing

### 6. Accessibility (Non-Negotiable)
- [ ] Text contrast: WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Focus ring: 2px visible on all interactive elements
- [ ] Touch targets: ≥44×44px on mobile
- [ ] Reduced motion: Works with `prefers-reduced-motion`

## Common Violations

| Violation | Fix |
|-----------|-----|
| Multiple green CTAs | Keep one, demote others to secondary |
| Card borders at rest using accent | Use `--border-subtle` instead |
| Glow on non-interactive elements | Remove or use neutral shadow |
| Persistent toolbars in editor | Make hover-revealed |
| Heavy resize handles | Add `resize-none` to textareas |

## The Final Question

> If someone screenshots this page and removes all branding, would it feel like yours?

If no, the fingerprint isn't strong enough.
