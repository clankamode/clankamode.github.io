# Claude.ai Instructions for James Peralta Personal Website

> **AI Assistants**: Start here. This file contains the essential context and conventions for this codebase.

## Project Overview

A modern personal website and learning platform built with Next.js 15, featuring:
- YouTube content showcase with infinite scroll
- AI chat interface with multiple models (GPT-4.1, GPT-5, Gemini)
- Learning platform with mock assessments and practice sessions
- Google OAuth authentication
- Real-time features with Supabase

**Tech Stack**: Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase · NextAuth · Vercel

## Quick Reference

| Documentation | Purpose |
|---------------|---------|
| This file | Essential conventions and patterns |
| `AGENTS.md` | Available AI skills and workflows |
| `.cursorrules` | Detailed project conventions |
| `docs/QUICK_REFERENCE.md` | ⚡ **Cheatsheet** - Fast lookup for commands & patterns |
| `docs/ARCHITECTURE.md` | 📐 System architecture diagrams & data flow |
| `docs/API.md` | 📡 API endpoint reference (50+ endpoints) |
| `docs/EXAMPLES.md` | 💻 Code examples & implementation patterns |
| `docs/HOOKS.md` | 🎣 Custom React hooks reference |
| `docs/SUPABASE_PATTERNS.md` | 🗄️ Database patterns, RLS, migrations |
| `docs/DATA_STRUCTURE_PRACTICE_QUESTIONS.md` | Create/link "Implement X From Scratch" practice questions |
| `docs/DESIGN_PRINCIPLES.md` | Full design specification |
| `.agent/skills/` | Specialized guidance for specific tasks |
| `CODE_REVIEW_CHECKLIST.md` | Code review standards |

## Critical Rules

### 1. Multi-File Consistency ⚠️

When changing **visibility or access** of a top-level nav item, update ALL of these:

| File | What to Update |
|------|----------------|
| **Page route** | `src/app/[section]/page.tsx` |
| **Navbar desktop** | `src/components/layout/Navbar.tsx` (main `<Link>` list) |
| **Navbar mobile** | `src/components/layout/Navbar.tsx` (hamburger menu) |
| **Middleware logic** | `src/middleware.ts` (public vs protected routes) |
| **Middleware matcher** | `src/middleware.ts` (`config.matcher` array) |

**Example**: Adding a `/learn` page requires changes to all 5 locations. Forgetting middleware will break auth.

### 2. Code Cleanup

**ALWAYS** remove unused code when making changes:
- Unused imports
- Unused variables and functions
- Unused types and interfaces
- Dead code blocks

### 3. Design System (Cinematic Engineering)

**Read** `.agent/skills/brand-guidelines/SKILL.md` before implementing UI. Key principles:

**The Nine Laws**:
1. **Silence is Louder Than Noise** - Empty space is working
2. **Accent is a Signal Flare** - ≤3 accent instances per viewport
3. **Typography Does the Work** - Size, weight, spacing create hierarchy
4. **Depth Through Restraint** - Pick one effect (blur OR glow OR gradient)
5. **Hover Reveals, Never Distracts** - Lift + bloom, not bounce
6. **Everything Earns Its Place** - Decoration without function is noise
7. **Obvious Beats Clever** - Don't make users figure it out
8. **Two Modes, No Compromise** - Atmosphere (marketing) vs Workbench (data)
9. **Grayscale First** - If hierarchy disappears, color is compensating

**Color Tokens**:
- Base: `bg-[#09090b]` (not `#1a1a1a`)
- Surfaces: Glassmorphism with subtle blur
- Primary Brand: Green → Emerald → Blue gradient
- Typography: Inter/Jakarta, tight tracking

**DO NOT** use flat colors or over-engineer with excessive effects.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API endpoints
│   │   └── */route.ts      # Use NextResponse, check auth
│   └── [page]/             # Page routes
│       ├── page.tsx        # Page component
│       └── _components/    # Page-specific components only
├── components/             # Shared components
│   ├── ui/                 # Generic UI primitives
│   ├── layout/             # Layout components (Navbar, etc.)
│   └── sections/           # Reusable page sections
├── lib/                    # Utilities and service clients
├── context/                # React context providers
└── types/                  # TypeScript definitions
```

## Common Patterns

### API Routes

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Check authentication
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query Supabase
  const { data, error } = await supabase
    .from('table')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### Server Components (Data Fetching)

```typescript
// Direct Supabase queries in server components
import { supabase } from '@/lib/supabase';

export default async function Page() {
  const { data } = await supabase.from('Table').select('*');
  return <div>{/* render data */}</div>;
}
```

### Client Components (State)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function Component() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/endpoint');
      const json = await res.json();
      setData(json);
    }
    fetchData();
  }, []);

  return <div>{/* render */}</div>;
}
```

## Available Skills & Workflows

Use these via the `.agent/` directory (see `AGENTS.md` for full details):

**Skills** (specialized guidance):
- `brand-guidelines` - Design tokens & Nine Laws
- `frontend-design` - Anti-AI-slop UI guidance
- `webapp-testing` - Playwright patterns
- `content-forge` - Blog authoring
- `modular-refactor` - Component surgery
- `void-mode-audit` - Subtractive design checklist
- `supabase-patterns` - Database conventions

**Workflows** (step-by-step processes):
- `/add-component` - Create design-compliant components
- `/code-review-checklist` - Comprehensive review
- `/create-pr` - Well-structured pull requests
- `/debug` - Systematic debugging
- `/deslop` - Remove AI slop and redundant comments
- `/setup-new-feature` - Feature initialization

## Code Style

### TypeScript
- **Use strict mode** - No `any` types
- **Prefer `interface`** over `type` for object shapes
- **Named exports** for components
- **Async/await** over `.then()` chains

### Components
- **Keep small and focused** - Single responsibility
- **Page-specific** components in `_components/` folder
- **Shared** components in `src/components/`
- **No emojis** unless explicitly requested

### Error Handling
- **API routes**: Return JSON with error message and status code
- **Client**: Show error state in UI, log to console
- **Don't over-engineer**: No excessive try/catch for trusted internal calls

### Authentication
- **Protected routes**: Check session in middleware
- **Admin-only**: Check for `UserRole.ADMIN`
- **Client components**: Use `useSession()` hook
- **API routes**: Use `getToken({ req })`

## Testing

```bash
npm run test:e2e           # Run Playwright tests
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:debug     # Debug mode
```

**Testing patterns**: See `.agent/skills/webapp-testing/SKILL.md`

## MCP Integration

This project uses MCP (Model Context Protocol) for Supabase access:
- Configuration: `.mcp.json`
- Provides: Database queries, migrations, Edge Functions
- Use for: Direct database operations, schema changes

## Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Required variables (see README.md for setup):
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
# - NEXTAUTH_URL / NEXTAUTH_SECRET
# - OPENAI_API_KEY / GEMINI_API_KEY

# Run development server
npm run dev
```

## Common Tasks

### Adding a New Page
1. Create `src/app/[page]/page.tsx`
2. Update `src/components/layout/Navbar.tsx` (desktop + mobile nav)
3. Update `src/middleware.ts` (public/protected logic + matcher)
4. Create `_components/` folder for page-specific components

### Adding an API Endpoint
1. Create `src/app/api/[name]/route.ts`
2. Check authentication with `getToken({ req })`
3. Use Supabase client from `@/lib/supabase`
4. Return `NextResponse.json()` with proper status codes

### Creating a Component
1. Follow brand guidelines (`.agent/skills/brand-guidelines/SKILL.md`)
2. Place in `src/components/[category]/ComponentName.tsx`
3. Use TypeScript interfaces for props
4. Export as named export
5. Consider using `/add-component` workflow

### Modifying Database
1. Use MCP Supabase tools for schema changes
2. Or create migration in `supabase/migrations/`
3. Update types: `npm run generate-types` (if configured)

### Creating Data Structure Practice Questions
1. Create `InterviewQuestions` row (class-based: class with methods, no runner function)
2. Set `source: ["Articles"]` so it appears in admin dropdown
3. Link via `LearningArticles.practice_question_id` (Admin → Content or PATCH)
4. Run `npm run validate_interview_questions`
5. See `docs/DATA_STRUCTURE_PRACTICE_QUESTIONS.md` for full guide

## Known Issues & Gotchas

1. **Forgetting middleware matcher** - New routes won't have auth checks
2. **Updating only Navbar** - Mobile nav and middleware need updates too
3. **Leaving unused imports** - Always clean up after refactoring
4. **Flat colors** - Use glassmorphism and gradients per brand guidelines
5. **Over-engineering** - Keep it simple, don't add features not requested

## Performance Guidelines

- **Don't over-optimize** prematurely
- **Trust internal code** - Don't validate everything
- **Only validate at boundaries** - User input, external APIs
- **No hypothetical abstractions** - Don't design for future requirements

## Before Committing

Run the checklist:
```bash
npm run lint        # ESLint checks
npm run typecheck   # TypeScript validation
npm run build       # Ensure build succeeds
npm run test:e2e    # E2E tests pass
```

See `CODE_REVIEW_CHECKLIST.md` for full review process.

## Getting Help

- **Workflows**: See `AGENTS.md` for available commands
- **Design**: See `docs/DESIGN_PRINCIPLES.md`
- **API Setup**: See `README.md` for API key configuration
- **Testing**: See `.agent/skills/webapp-testing/SKILL.md`

## Philosophy

> "Clean means answered, not empty. The page should be understood in one glance, then explored by choice. If you can't explain why an element exists, delete it."

Keep implementations:
- **Simple** over clever
- **Obvious** over abstract
- **Focused** over comprehensive
- **Tested** over perfect

When in doubt, ask rather than assume.
