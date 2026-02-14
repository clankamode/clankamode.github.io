# Voice Article Edits Workflow

Use your voice to make incremental changes to existing articles. The AI finds the article, applies your edits, and saves—no admin UI needed.

---

## Overview

You describe what you want changed. The AI:
1. **Finds** the correct article (by title, slug, pillar/topic, or description)
2. **Makes incremental edits** (add, remove, rephrase, fix)
3. **Updates** the article in the database

Unlike the Curriculum Chat workflow (which creates full articles from scratch), this workflow is for **editing what already exists**.

---

## Content Hierarchy (Reference)

```
Pillar → Topic → Article
```

| Pillar (slug)                | Topics (examples)                    |
|------------------------------|--------------------------------------|
| DSA                          | Data Structures, Patterns            |
| System Design                | Fundamentals                         |
| Job Hunt                     | Positioning                          |
| How to Get Good at LeetCode  | Guides                               |
| Blog                         | Chasing Expert, Career Notes         |

---

## How to Dictate Edits

### Format (informal is fine)

Examples of things you can say:

- *"Add a paragraph to the Sliding Window article about when to use it."*
- *"Fix the typo in 'Sliding Window Basics'—'teh' should be 'the'."*
- *"In the CAP Theorem article, rephrase the intro to be less technical."*
- *"Add a callout to the Two Pointers article: tip about using for loops."*
- *"Remove the third paragraph from 'My YouTube Approach'."*
- *"In DSA Patterns, the Merge Intervals article—add a section on follow-ups."*
- *"The article about quantifying impact—make the conclusion stronger."*

### What the AI Needs

| Input           | Required | Source                                              |
|-----------------|----------|-----------------------------------------------------|
| **Article**     | Yes      | Title, slug, pillar/topic path, or partial match    |
| **Edit type**   | Yes      | Add, remove, rephrase, fix, insert section, etc.    |
| **Content**     | Yes*     | The new text or change (*implicit for "fix typo")   |

### Edit Types

| Edit type       | Example                                                                 |
|-----------------|-------------------------------------------------------------------------|
| **Add**         | "Add a paragraph about X" / "Add a callout" / "Add a code example"      |
| **Remove**      | "Remove the second paragraph" / "Delete the intro"                      |
| **Rephrase**    | "Make the intro less technical" / "Shorten the conclusion"              |
| **Fix**         | "Fix typo: teh → the" / "Fix the code block syntax"                     |
| **Insert**      | "Insert a new section before the Conclusion"                            |
| **Replace**     | "Replace the first sentence with: ..."                                  |

---

## Finding the Article

The AI resolves which article to edit by:

1. **Exact title** — "the Sliding Window Basics article"
2. **Slug** — if you know it (e.g. "sliding-window-basics")
3. **Pillar + topic + title** — "DSA Patterns, the Sliding Window one"
4. **Partial match** — "the article about CAP theorem" / "the one on quantifying impact"
5. **Topic only + disambiguate** — if multiple matches, the AI asks or picks the most likely

---

## Rich Content Elements (Same as Curriculum Chat)

When you ask to add content, the AI uses the same block syntax. Reference: DSA → Data Structures → "For Testing Bugs" article.

### Quick Reference

- **Code**: `:::code{lang="python" filename="..."}` 
- **Callouts**: `:::callout{type="tip"}` (tip, warning, info, important)
- **Tables**: Markdown tables
- **Diagrams**: `:::diagram{lang="mermaid"}`
- **Images**: `:::image{src="..." alt="..." caption="..."}`
- **Dividers**: `:::divider`

---

## What the AI Does

1. **Find the article**
   - Query content by title/slug/pillar/topic or search.
   - Confirm the article if ambiguous.

2. **Apply the edit**
   - Make only the incremental change you described.
   - Preserve existing structure and formatting elsewhere.

3. **Save**
   - Via `PATCH /api/content/<id>` (or equivalent) with updated `body` or fields.

4. **Confirm**
   - Tell you what was changed and the edit URL (`/admin/content/<id>`).

---

## Example Chat Flows

**You:** *"Add a paragraph to the Sliding Window article about when to use it."*

**AI:** Finds "Sliding Window Basics" under DSA → Patterns, appends a paragraph on when to use the pattern, saves, returns edit URL.

---

**You:** *"Fix the typo in that article—'teh' should be 'the'."*

**AI:** Uses context (previous article) or asks if unclear, fixes the typo, saves.

---

**You:** *"In the CAP Theorem article, add a callout that says: consistency and availability are often a trade-off in practice."*

**AI:** Finds the CAP Theorem article, inserts `:::callout{type="info"}` with your text, saves.

---

**You:** *"The Merge Intervals article—remove the 'Common Mistakes' section."*

**AI:** Finds the article, removes that section, saves.

---

## System Prompt (For the AI)

Use this system prompt when implementing the voice-to-article-edits flow:

```
You help the user make incremental edits to existing articles via voice. Your job is to:

1. FIND the article: Use title, slug, pillar/topic path, or partial description. Query the content API or database. If multiple matches, ask to disambiguate or pick the most likely.

2. APPLY the edit: Make only the change the user described. Do not rewrite the whole article. Preserve existing structure, formatting, and content elsewhere.

3. SAVE: Update the article via PATCH /api/content/<id> with the modified body (or other fields). Use is_published: false unless the user explicitly says to publish.

4. CONFIRM: Tell the user what you changed and the edit URL.

Edit types you support:
- Add: paragraph, section, callout, code block, list item, etc.
- Remove: paragraph, section, sentence
- Rephrase: make clearer, shorter, less technical, etc.
- Fix: typos, broken syntax, wrong code
- Insert: new content at a specific position
- Replace: swap specific text with new text

Use the same rich content block syntax as article creation (:::code{}, :::callout{}, :::diagram{}, etc.) when the user asks to add formatted content.

Be concise. Only change what the user asked for.
```

---

## Checklist for the AI

When you dictate an edit, the AI should:

- [ ] Identify the target article (or ask if ambiguous)
- [ ] Understand the edit type (add, remove, rephrase, fix, etc.)
- [ ] Apply only the incremental change—don't rewrite the whole article
- [ ] Preserve existing formatting and structure
- [ ] Use rich content blocks when adding formatted content
- [ ] Save with `is_published: false` unless you say "publish"
- [ ] Respond with what was changed and the edit URL
