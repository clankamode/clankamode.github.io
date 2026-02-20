---
name: modular-refactor
description: Component surgery patterns for React refactoring. Use when breaking apart large components, extracting hooks, or improving testability.
argument-hint: <component or file to refactor>
allowed-tools: Read, Glob, Grep, Edit, Write
---

Refactor the following into a modular structure: $ARGUMENTS

## When to Extract

### Extract a Hook When:
- Logic is reused across 2+ components
- State + effects form a cohesive unit
- The component file exceeds ~200 lines
- Testing the logic independently has value

### Extract a Component When:
- UI is reused elsewhere
- It has its own distinct interaction patterns
- It represents a distinct visual unit

### Keep Inline When:
- Logic is truly specific to this one component
- Extraction would just move code without adding clarity

## The Pattern

```
components/[feature]/
├── FeatureName.tsx              # Orchestrator — thin, imports hooks/components
├── hooks/
│   ├── useFeatureState.ts       # State management
│   └── useFeatureActions.ts     # Business logic / event handlers
├── components/
│   ├── FeatureToolbar.tsx
│   └── FeatureItem.tsx
├── utils/
│   └── parseFeatureData.ts      # Pure functions
└── types.ts                     # Shared types
```

## Hook Extraction Process

1. **Identify the boundary** — What state + effects + handlers form a unit?
2. **Name descriptively** — `use[Domain][Action]`: `useCommandMenu`, `useMediaHandlers`
3. **Define the interface** — What does the hook return?
4. **Move dependencies** — Bring related refs, state, effects together
5. **Stable references** — `useCallback` for handlers returned to parent

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| State hook | `use[Feature]State` | `useBlockEditorState` |
| Behavior hook | `use[Feature][Action]` | `useEditorShortcuts` |
| UI component | `[Feature][Role]` | `GhostGutter`, `BlockCommandMenu` |
| Utility | `[action][Object]` | `parseBlocks`, `createBlockId` |

## Import Order

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react';
// 2. External packages
import type { SomeType } from 'some-package';
// 3. Internal types
import type { FeatureBlock } from './types';
// 4. Internal hooks
import { useFeatureState } from './hooks/useFeatureState';
// 5. Internal components
import { FeatureToolbar } from './components/FeatureToolbar';
// 6. Internal utilities
import { parseData } from './utils/parseData';
```

## Red Flags (Requires Refactoring)

- File exceeds 300 lines
- More than 5 `useState` calls in one component
- Prop drilling more than 2 levels deep
- Copy-pasting logic between components
- "God component" doing unrelated things

## Checklist

- [ ] Orchestrator is thin (mostly imports, minimal logic)
- [ ] Each hook has a single responsibility
- [ ] Handlers returned from hooks use `useCallback`
- [ ] Types extracted to `types.ts`
- [ ] Pure utilities in `utils/`
- [ ] No circular imports
- [ ] Unused imports removed after refactor
