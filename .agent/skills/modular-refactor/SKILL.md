---
name: modular-refactor
description: Component surgery patterns for React refactoring. Use when breaking apart large components, extracting hooks, or improving testability. Follows the established BlockEditor modularization pattern.
---

# Modular Refactor

Patterns for decomposing React components into maintainable, testable modules.

## The BlockEditor Pattern

The canonical example of good decomposition in this codebase:

```
components/editor/
├── BlockEditor.tsx          # Orchestrator (thin, imports hooks/components)
├── hooks/
│   ├── useBlockEditorState.ts   # State management
│   ├── useCommandMenu.ts        # Menu positioning logic
│   ├── useEditorShortcuts.ts    # Keyboard handling
│   └── useMediaHandlers.ts      # File upload logic
├── components/
│   ├── GhostGutter.tsx          # Block manipulation UI
│   ├── BlockCommandMenu.tsx     # Slash command menu
│   └── MinimalInsertToolbar.tsx # Bottom insert bar
├── blocks/                       # Individual block renderers
├── utils/                        # Pure functions
└── types.ts                      # Shared types
```

## When to Extract

### Extract a Hook When:
- Logic is reused across components
- State + effects form a cohesive unit
- Testing the logic independently would be valuable
- The component file exceeds ~200 lines

### Extract a Component When:
- UI is reused elsewhere
- The section has its own interaction patterns
- It represents a distinct visual unit
- It could reasonably have its own tests

### Keep Inline When:
- Logic is truly component-specific
- Extraction would just move code without adding value
- The abstraction isn't natural

## Hook Extraction Checklist

1. **Identify the boundary** — What state + effects + handlers form a unit?
2. **Name it descriptively** — `use[Domain][Action]` (e.g., `useCommandMenu`, `useMediaHandlers`)
3. **Define the interface** — What does the hook return?
4. **Move dependencies** — Bring refs, state, effects together
5. **Return stable references** — Use `useCallback` for handlers returned to parent

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| State hook | `use[Feature]State` | `useBlockEditorState` |
| Behavior hook | `use[Feature][Action]` | `useEditorShortcuts` |
| UI component | `[Feature][Role]` | `GhostGutter`, `BlockCommandMenu` |
| Utility | `[action][Object]` | `parseBlocks`, `createBlockId` |

## Import Organization

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react';

// 2. External packages
import type { SomeType } from 'some-package';

// 3. Internal types
import type { EditorBlock } from './types';

// 4. Internal hooks
import { useBlockEditorState } from './hooks/useBlockEditorState';

// 5. Internal components
import { GhostGutter } from './components/GhostGutter';

// 6. Internal utilities
import { parseBlocks } from './utils/parseBlocks';
```

## Red Flags (When to Refactor)

- File exceeds 300 lines
- More than 5 `useState` calls in one component
- Prop drilling more than 2 levels deep
- Copy-pasting logic between components
- "God component" that does everything
