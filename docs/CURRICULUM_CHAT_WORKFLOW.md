# Curriculum Chat Workflow

Build your learning platform curriculum by dictating articles in chat. The AI inserts them into the correct pillars and topics.

---

## Overview

You describe articles you want. The AI:
1. Maps each article to the right **pillar** and **topic**
2. Creates the article in the database
3. Uses sensible defaults (draft, unpublishable until you review)

No admin UI needed—just chat.

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

## How to Dictate Articles

### Format (informal is fine)

Examples of things you can say:

- *"Add an article to DSA > Patterns on Sliding Window."*
- *"Create a blog post under Career Notes called 'How I Got My First Offer'."*
- *"New article in System Design > Foundations: CAP Theorem Explained."*
- *"Job Hunt pillar, Positioning topic: 'Quantify Your Impact'."*

### What the AI Needs

For each article, the AI infers or asks:

| Field         | Required | Source                                      |
|---------------|----------|---------------------------------------------|
| **Pillar**    | Yes      | From your words (DSA, System Design, Job Hunt, etc.) |
| **Topic**     | Yes      | From your words or existing topic under pillar     |
| **Title**     | Yes      | You provide it                               |
| **Slug**      | Yes      | Auto-derived from title (or you specify)     |
| **Body**      | Yes      | Minimal scaffold or you paste content        |

### Optional Details

- **New topic**: If you say "DSA > New Topic: Bit Manipulation," the AI creates the topic first, then the article.
- **Body content**: You can paste markdown; otherwise the AI uses a minimal scaffold. Use the rich content elements below for engaging articles.
- **Order**: Articles use `order_index`; new ones go at the end unless you specify.
- **Practice question** (data structure articles): Link an "Implement X From Scratch" practice problem via `practice_question_id`. See `docs/DATA_STRUCTURE_PRACTICE_QUESTIONS.md`.

---

## Rich Content Elements

Articles support Markdown plus custom blocks. Use these to make content engaging. Reference: DSA → Data Structures → "For Testing Bugs" article.

### Standard Markdown

- **Typography**: `**bold**`, *italic*, ***bold italic***, ~strikethrough~, `inline code`
- **Headings**: `#` through `######`
- **Lists**: Unordered (`*` or `-`), ordered (`1.`), task lists (`- [ ]` / `- [x]`)
- **Links**: `[text](url)`
- **Blockquotes**: `> quote`
- **Tables**: `| col1 | col2 |` with alignment (`:---`, `:---:`, `---:`)

### Code Blocks

Two options:

**Fenced code** (syntax highlighting):

````
```python
def hello():
    print("world")
```
````

**Custom code block** (filename, line highlighting):

```
:::code{lang="python" filename="example.py" highlight="2-4"}
def hello():
    print("world")
:::
```

- `lang`: python, javascript, typescript, sql, etc.
- `filename`: optional label (e.g., "two_pointers.py")
- `highlight`: optional comma-separated lines or ranges (e.g., "2,5-7")

### Custom Components (Directive Syntax)

All custom blocks use `:::type{attrs}` … `:::`.

**Callouts** (tip, warning, info, important):

```
:::callout{type="tip"}
**Tip**: Use a list and join for string building—it's O(n) instead of O(n²).
:::
```

`type`: `tip` | `warning` | `info` | `important`  
Optional: `title="..."`, `collapsible="true"`

**Images**:

```
:::image{src="https://..." alt="Description" caption="Optional caption" size="full"}
:::
```

`size`: `full` | `medium` | `small` | `inline`

**Mermaid diagrams**:

```
:::diagram{lang="mermaid"}
graph TD;
    A[Start] --> B{Valid?};
    B -- Yes --> C[OK];
    B -- No --> D[Retry];
:::
```

**Divider** (horizontal rule):

```
:::divider
:::
```

**Embeds** (YouTube, CodePen, LeetCode, etc.):

```
:::embed{provider="youtube" url="https://youtube.com/watch?v=..."}
:::
```

`provider`: `youtube` | `twitter` | `codesandbox` | `codepen` | `leetcode` | `gist` | `url`

### Quick Reference for the AI

When creating articles, use:

- **Code**: `:::code{lang="python" filename="..."}` for syntax highlighting and copy button
- **Callouts**: `:::callout{type="tip"}` for tips, warnings, important notes
- **Tables**: Markdown tables for comparisons (e.g., time complexity)
- **Diagrams**: `:::diagram{lang="mermaid"}` for flowcharts, sequence diagrams
- **Images**: `:::image{src="..." alt="..." caption="..."}` for visuals
- **Dividers**: `:::divider` between major sections

---

## What the AI Does

1. **Resolve pillar + topic**
   - Match your words to existing pillars/topics.
   - If the topic doesn’t exist, create it.

2. **Create the article**
   - Via `POST /api/content` with `topic_id`, `slug`, `title`, `body`, `is_published: false`.

3. **Confirm**
   - Tell you where it was created and the edit URL (`/admin/content/<id>`).

---

## Example Chat Flow

**You:** *"Add an article to DSA > Patterns called 'Sliding Window Basics'. Just use a simple scaffold for the body."*

**AI:** Creates the article under DSA → Patterns, returns the edit URL.

---

**You:** *"Create a new topic under Blog called 'Videos' and add an article 'My YouTube Approach'."*

**AI:** Inserts a new topic "Videos" under Blog, then creates the article under that topic.

---

**You:** *"Add three DSA articles: Two Pointers, Fast and Slow Pointers, Merge Intervals. All under Patterns, just scaffolds."*

**AI:** Creates three articles in DSA > Patterns with scaffold bodies.

---

## New Pillars or Topics

- **New pillar**: Requires SQL in Supabase (no API yet). Say *"I want a new pillar X"* and the AI can provide the SQL.
- **New topic**: The AI can create it via SQL/migration when you dictate an article under a new topic name.

---

## Checklist for the AI

When you dictate an article, the AI should:

- [ ] Identify pillar (DSA, System Design, Resume, Blog) or note if a new pillar is needed
- [ ] Identify or create topic
- [ ] Derive slug from title (lowercase, hyphens, no special chars)
- [ ] Create article with `is_published: false` unless you say "publish"
- [ ] Use rich content (code blocks, callouts, tables, diagrams) when it improves clarity
- [ ] Respond with edit URL and pillar/topic path
