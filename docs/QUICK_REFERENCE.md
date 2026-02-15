# Quick Reference Guide

Fast lookup for common commands, patterns, and workflows. Keep this handy while developing.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:headed   # With browser visible
npm run test:e2e:debug    # Debug mode

# Linting & Type Checking
npm run lint              # ESLint
npm run typecheck         # TypeScript
```

## 📁 File Organization Cheatsheet

```
Create new page:
└─ src/app/[name]/page.tsx

Page-specific components:
└─ src/app/[name]/_components/Component.tsx

Shared components:
└─ src/components/[category]/Component.tsx

API routes:
└─ src/app/api/[name]/route.ts

Custom hooks:
└─ src/hooks/useHookName.ts

Types:
└─ src/types/typeName.ts

Utilities:
└─ src/lib/utilName.ts

Context providers:
└─ src/context/ContextName.tsx
```

## 🎨 Design System Quick Reference

### Colors

```typescript
// Backgrounds
bg-[#09090b]              // Base background
bg-white/5 backdrop-blur  // Glassmorphism surface
bg-white/10               // Hover state

// Gradients (brand)
bg-gradient-to-r from-emerald-500 to-blue-500

// Text
text-white                // Primary
text-gray-400             // Secondary
text-gray-600             // Muted

// Accent
text-emerald-500          // Success/primary action
text-red-500              // Error
text-blue-500             // Info
```

### Typography

```typescript
// Headlines
text-4xl font-bold        // Page title
text-2xl font-semibold    // Section title
text-xl font-medium       // Subsection

// Body
text-base                 // Normal text
text-sm text-gray-400     // Captions

// Tracking
tracking-tight            // Headlines
tracking-normal           // Body
```

### Spacing

```typescript
// Padding
p-4, p-6, p-8             // Component padding
px-4 py-2                 // Button padding

// Margin
mb-4, mb-8                // Vertical rhythm
gap-4, gap-6              // Flex/Grid gaps

// Layout
max-w-7xl mx-auto         // Constrain width
min-h-screen              // Full viewport
```

## 🔐 Authentication Patterns

### Middleware Check

```typescript
// src/middleware.ts
const token = await getToken({ req });
if (!token) {
  return NextResponse.redirect(new URL('/login', req.url));
}
```

### API Route Check

```typescript
// Protected API route
const token = await getToken({ req });
if (!token?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Admin Check

```typescript
// Admin-only API route
if (token.role !== UserRole.ADMIN) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Client Component Check

```typescript
'use client';
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();

if (status === 'loading') return <Spinner />;
if (!session) return <SignInPrompt />;
```

## 🗄️ Database Quick Patterns

### Query

```typescript
// Read all
const { data, error } = await supabase.from('table').select('*');

// Read with filter
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value)
  .order('created_at', { ascending: false });

// Read single
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single();
```

### Insert

```typescript
const { data, error } = await supabase
  .from('table')
  .insert([{ column: value }])
  .select();
```

### Update

```typescript
const { data, error } = await supabase
  .from('table')
  .update({ column: value })
  .eq('id', id)
  .select();
```

### Delete

```typescript
const { data, error } = await supabase
  .from('table')
  .delete()
  .eq('id', id);
```

### Upsert

```typescript
const { data, error } = await supabase
  .from('table')
  .upsert(
    { id, column: value },
    { onConflict: 'id' }
  );
```

## 🔄 Real-time Subscription

```typescript
useEffect(() => {
  const channel = supabase
    .channel('changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'table_name',
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setData((prev) => [payload.new, ...prev]);
        }
        // Handle UPDATE, DELETE
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## 🎣 Common Hook Patterns

### Data Fetching

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    const res = await fetch('/api/endpoint');
    const json = await res.json();
    setData(json);
    setLoading(false);
  }
  fetchData();
}, []);
```

### Form Handling

```typescript
const [formData, setFormData] = useState({ field: '' });
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);

  try {
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) throw new Error('Failed');

    setFormData({ field: '' });
  } catch (err) {
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};
```

## 📡 API Route Templates

### GET (Read)

```typescript
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('table').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### POST (Create)

```typescript
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { field } = body;

  if (!field) {
    return NextResponse.json({ error: 'Missing field' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('table')
    .insert([{ field, user_email: token.email }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

### PUT (Update)

```typescript
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase
    .from('table')
    .update(body)
    .eq('id', id)
    .eq('user_email', token.email) // Verify ownership
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### DELETE

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from('table')
    .delete()
    .eq('id', id)
    .eq('user_email', token.email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

## 🧪 Testing Quick Patterns

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

// Use authenticated state
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page');

    // Check element exists
    await expect(page.getByRole('heading', { name: 'Title' })).toBeVisible();

    // Fill form
    await page.fill('input[name="field"]', 'value');

    // Click button
    await page.click('button[type="submit"]');

    // Verify result
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## 🗂️ Migration Template

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- Create table
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column TEXT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data"
  ON public.table_name FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own data"
  ON public.table_name FOR INSERT
  WITH CHECK (auth.email() = user_email);

-- Indexes
CREATE INDEX idx_table_user ON public.table_name(user_email);
CREATE INDEX idx_table_created ON public.table_name(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_table_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.table_name IS 'Description of table purpose';
```

## ⚡ Performance Tips

```typescript
// ❌ Bad: Multiple queries in loop
for (const id of ids) {
  const data = await supabase.from('table').select('*').eq('id', id);
}

// ✅ Good: Single query with IN
const data = await supabase.from('table').select('*').in('id', ids);

// ❌ Bad: Separate queries for related data
const questions = await supabase.from('questions').select('*');
const votes = await supabase.from('votes').select('*');

// ✅ Good: Join in single query
const data = await supabase
  .from('questions')
  .select('*, votes(*)');

// ❌ Bad: No pagination
const all = await supabase.from('table').select('*');

// ✅ Good: Paginate
const page = await supabase
  .from('table')
  .select('*')
  .range(0, 23); // First 24 items
```

## 🎯 Critical Rules Reminder

### Multi-File Consistency

When adding/removing nav items, update **ALL**:
1. ✅ Page route (`src/app/[name]/page.tsx`)
2. ✅ Navbar desktop (`src/components/layout/Navbar.tsx`)
3. ✅ Navbar mobile (`src/components/layout/Navbar.tsx`)
4. ✅ Middleware logic (`src/middleware.ts`)
5. ✅ Middleware matcher (`src/middleware.ts` config)

### Code Cleanup

Always remove after refactoring:
- ✅ Unused imports
- ✅ Unused variables
- ✅ Unused functions
- ✅ Unused types
- ✅ Dead code blocks

### Design System

- ✅ Use `bg-[#09090b]` not `bg-[#1a1a1a]`
- ✅ Use glassmorphism not flat colors
- ✅ Use gradients for brand elements
- ✅ Follow Nine Laws (see brand-guidelines)
- ✅ ≤3 accent instances per viewport

## 🔗 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Stage and commit
git add src/app/feature
git commit -m "feat: add feature description

- Bullet point 1
- Bullet point 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
git push -u origin feature/my-feature

# Create PR (use gh CLI)
gh pr create --title "feat: add feature" --body "Description..."
```

## 📚 Documentation Links

Quick access to all documentation:

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Start here - essential conventions |
| `AGENTS.md` | Available skills & workflows |
| `docs/ARCHITECTURE.md` | System architecture diagrams |
| `docs/API.md` | API endpoint reference |
| `docs/EXAMPLES.md` | Code examples & patterns |
| `docs/HOOKS.md` | Custom hooks reference |
| `docs/SUPABASE_PATTERNS.md` | Database patterns & RLS |
| `docs/QUICK_REFERENCE.md` | This file |

## 🛠️ Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Tests Fail

```bash
# Update Playwright browsers
npx playwright install

# Clear auth state
rm -rf playwright/.auth

# Run in debug mode
npm run test:e2e:debug
```

### Type Errors

```bash
# Regenerate types
npm run typecheck

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

### Supabase Connection Issues

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

## 🚨 Common Mistakes to Avoid

1. ❌ Updating navbar without updating middleware
2. ❌ Leaving unused imports after refactoring
3. ❌ Using flat colors instead of glassmorphism
4. ❌ Forgetting to check authentication in API routes
5. ❌ Not enabling RLS on new tables
6. ❌ Missing indexes on frequently queried columns
7. ❌ Not cleaning up subscriptions in useEffect
8. ❌ Querying in loops instead of batch operations

## 📞 Getting Help

1. Check relevant doc:
   - UI issue? → `brand-guidelines`
   - API issue? → `docs/API.md`
   - Database issue? → `docs/SUPABASE_PATTERNS.md`
   - Hook issue? → `docs/HOOKS.md`

2. Search codebase:
   ```bash
   # Find similar patterns
   grep -r "pattern" src/
   ```

3. Ask with context:
   - What were you trying to do?
   - What went wrong?
   - What have you tried?

---

**Last Updated**: 2026-02-14
**Print this page and keep it handy!**
