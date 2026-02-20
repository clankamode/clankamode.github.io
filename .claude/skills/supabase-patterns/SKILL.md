---
name: supabase-patterns
description: Database and API conventions for this Next.js + Supabase project. Use when adding tables, writing API routes, or implementing data fetching. Covers auth patterns, error handling, and query conventions.
allowed-tools: Read, Glob, Grep
---

Apply Supabase patterns for: $ARGUMENTS

## Stack Context

- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth — `getToken({ req })` in API routes, `useSession()` in client components
- **Client**: `@/lib/supabase` — NOT Prisma

## API Route Boilerplate

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('table_name')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

## Admin-Only Route

```typescript
const token = await getToken({ req });
if (token?.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Data Fetching Patterns

### Server Component (Preferred)
```typescript
import { supabase } from '@/lib/supabase';

export default async function Page() {
  const { data } = await supabase.from('posts').select('*');
  return <PostList posts={data} />;
}
```

### Client Component
```typescript
'use client';
import { useState, useEffect } from 'react';

export function ClientPage() {
  const [data, setData] = useState([]);
  useEffect(() => {
    async function fetch() {
      const res = await fetch('/api/endpoint');
      setData(await res.json());
    }
    fetch();
  }, []);
}
```

### Protected Client Component
```typescript
'use client';
import { useSession } from 'next-auth/react';

export function ProtectedComponent() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <Skeleton />;
  if (!session) return <SignInPrompt />;
  return <ProtectedContent />;
}
```

## Query Patterns

```typescript
// Select with relations
const { data } = await supabase
  .from('posts')
  .select(`*, author:users(name, avatar), tags(id, name)`);

// Insert and return
const { data, error } = await supabase
  .from('posts')
  .insert({ title, content, author_id: userId })
  .select()
  .single();

// Upsert
const { data } = await supabase
  .from('settings')
  .upsert({ user_id: userId, theme: 'dark' })
  .select()
  .single();
```

## Common Gotchas

| Issue | Solution |
|-------|----------|
| `supabase` vs `supabaseAdmin` | Use admin client for server-side ops bypassing RLS |
| Missing `.select()` after insert | Add `.select()` to get the inserted row |
| RLS blocking reads | Check policies or use admin client |
| 401 in API route | Verify `NEXTAUTH_SECRET` is set |

## Error Response Format

Always: `{ error: string }` with appropriate status code. Never expose raw Supabase error objects.
