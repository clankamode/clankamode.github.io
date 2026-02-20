---
name: content-forge
description: Blog authoring guide for James Peralta's voice and block editor conventions. Use when writing or editing blog posts and technical content.
argument-hint: <topic or post to write/edit>
allowed-tools: Read, Edit, Write, Glob
---

Write or edit blog content for: $ARGUMENTS

## Voice Principles

- **Technical depth without jargon gatekeeping** — Explain concepts, don't assume
- **Show, don't tell** — Code examples > abstract explanations
- **Conversational authority** — Confident but approachable
- **Actionable** — Reader should be able to DO something after reading

## Post Structure

1. **Hook** (1-2 sentences) — Why should they read this?
2. **Context** — What problem are we solving?
3. **Solution** — The substance of the post
4. **Takeaway** — What did we learn?

## Sentence Craft

- Lead with the insight, not the setup
- Vary sentence length (short punchy + longer explanatory)
- Use fragments for emphasis. Like this.
- Never start with "In this post, we will..."
- Never end with "I hope you found this helpful"

## Block Editor Commands

Type `/` in the editor:

| Command | Block | Use |
|---------|-------|-----|
| `/code` | Code block | Syntax-highlighted snippets |
| `/callout` | Callout | Tips, warnings, gotchas |
| `/diagram` | Mermaid | Flowcharts, architecture |
| `/embed` | Embed | YouTube, CodeSandbox, LeetCode |
| `/image` | Image | Screenshots, diagrams |
| `/divider` | HR | Section breaks |

## Callout Tones

| Tone | When | Example |
|------|------|---------|
| `tip` | Helpful shortcut | "Pro tip: Use Cmd+Shift+P to..." |
| `note` | Extra context | "Note: This also works in Node 18+" |
| `warning` | Gotcha | "Warning: This will overwrite existing data" |
| `danger` | Breaking/security | "Danger: Never expose this key publicly" |

Use ≤3 callouts per post.

## Code Block Rules

- Always specify language: `tsx`, `python`, `bash`
- One concept per block — keep focused
- Comment non-obvious lines
- Show the "after" state, not just the diff
- Include imports when they matter

## Pre-Publish Checklist

- [ ] Hook is compelling in first 30 words
- [ ] Code examples are copy-paste ready
- [ ] ≤3 callouts in the post
- [ ] All images have alt text
- [ ] No placeholder content or TODOs left
