---
name: content-forge
description: Blog authoring intelligence for the block editor. Use when writing or editing blog posts, creating technical content, or optimizing for James Peralta's authorial voice. Covers block syntax, style conventions, and content structure.
---

# Content Forge

Guide for creating compelling technical blog content using the block editor.

## Block Syntax Quick Reference

Type `/` in the editor to access these blocks:

| Command | Block Type | Use Case |
|---------|------------|----------|
| `/code` | Code block | Syntax-highlighted code snippets |
| `/callout` | Callout box | Tips, warnings, important notes |
| `/diagram` | Mermaid diagram | Flowcharts, sequences, architecture |
| `/embed` | Embed | YouTube, CodeSandbox, LeetCode |
| `/image` | Image | Screenshots, diagrams, photos |
| `/divider` | Horizontal rule | Section breaks |

## Writing Style

### Voice Principles
- **Technical depth without jargon gatekeeping** — Explain concepts, don't assume
- **Show, don't tell** — Code examples > abstract explanations
- **Conversational authority** — Confident but approachable
- **Actionable insights** — Reader should be able to DO something after reading

### Structure Pattern
1. **Hook** (1-2 sentences) — Why should they care?
2. **Context** — What problem are we solving?
3. **Solution** — The meat of the post
4. **Takeaway** — What did we learn?

### Sentence Craft
- Lead with the insight, not the setup
- Vary sentence length (short punchy + longer explanatory)
- Use fragments for emphasis. Like this.
- Avoid "In this post, we will..."

## Callout Tone Map

| Tone | When to Use | Example |
|------|-------------|---------|
| `tip` | Helpful shortcut or best practice | "Pro tip: Use `Cmd+Shift+P` to..." |
| `note` | Additional context, not critical | "Note: This also works in Node 18+" |
| `warning` | Potential pitfall or gotcha | "Warning: This will overwrite existing data" |
| `danger` | Breaking change or security risk | "Danger: Never expose this key publicly" |

## Code Block Guidelines

- Always specify the language (`tsx`, `python`, `bash`)
- Keep snippets focused — one concept per block
- Add comments for non-obvious lines
- Show the "after" state, not just the diff
- Include imports when relevant to the example

## Image Conventions

- **Caption**: Brief, informative (not "Screenshot of X")
- **Alt text**: Descriptive for accessibility
- **Why field**: Optional — explains significance
- **Size**: Use `full` for hero images, `medium` for inline examples

## Content Checklist

Before publishing:
- [ ] Hook is compelling in first 30 words
- [ ] Code examples are copy-paste ready
- [ ] Callouts used sparingly (≤3 per post)
- [ ] Images have alt text
- [ ] No placeholder content
