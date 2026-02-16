# Data Structure Practice Questions

How to create "Implement X From Scratch" practice questions that pair with LearningArticles. **Reference implementation:** Heaps article + Implement Min-Heap From Scratch.

---

## Quick Summary

| Step | Action |
|------|--------|
| 1 | Create `InterviewQuestions` row with `source: ["Articles"]` |
| 2 | Use class-based pattern (class with methods, tests call methods directly) |
| 3 | Run `npm run validate_interview_questions` |
| 4 | Link article via Admin → Content → Practice question dropdown |

---

## Naming

- **Data structure:** `Implement [Structure] From Scratch` (e.g., Implement Min-Heap From Scratch)
- **Article link:** `LearningArticles.practice_question_id` → `InterviewQuestions.id`

---

## Class-Based Pattern (from Min-Heap)

- User implements a class (e.g., `Heap`) with methods: `push(x)`, `pop()`, `peek()`
- Tests call methods directly: `((h := Heap(), h.push(3), h.push(1), [h.pop(), h.pop()])[-1])` → `[1, 2]`
- No runner function — only the class with `pass` stubs

---

## API

- **List practice questions:** `GET /api/content/practice-questions` (editor auth)
- **Link to article:** `PATCH /api/content/[id]` with `practice_question_id`

---

## Full Guide

See `.cursor/rules/data-structure-practice-questions.mdc` for:
- Schema fields
- Prompt and docstring rules
- SQL examples
- Validation checklist
- Alignment with article structure (Heaps reference)
