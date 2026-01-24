---
name: supabase-patterns
description: Database and API conventions for this Next.js + Supabase project. Use when adding new tables, writing API routes, or implementing data fetching patterns. Covers authentication, error handling, and RLS.
---

# Supabase Patterns

Conventions for database operations and API routes in this project.

## Project Stack Context

- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth with Supabase adapter
- **Hosting**: Vercel
- **ORM**: Supabase client (not Prisma)

## API Route Boilerplate

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // 1. Auth check (if protected)
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Query
  const { data, error } = await supabase
    .from('table_name')
    .select('*');

  // 3. Error handling
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. Success
  return NextResponse.json(data);
}
```

## Data Fetching Patterns

### Server Component (Preferred)
```typescript
// Runs on server, no client bundle impact
export default async function Page() {
  const { data } = await supabase.from('posts').select('*');
  return <PostList posts={data} />;
}
```

### Client Component
```typescript
'use client';

export default function ClientPage() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    supabase.from('posts').select('*').then(({ data }) => setData(data));
  }, []);
  
  return <PostList posts={data} />;
}
```

## Authentication Patterns

### Protected API Route
```typescript
const token = await getToken({ req });
if (!token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Admin-Only Route
```typescript
const token = await getToken({ req });
if (token?.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Client-Side Session
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

## Error Handling

### API Routes
- Return JSON with `{ error: string }` and appropriate status code
- Log to console for debugging
- Don't expose internal error details to client

### Client Components
- Show error state in UI
- Log to console
- Don't over-engineer with excessive try/catch for trusted internal calls

## Supabase Query Patterns

### Select with Relations
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    author:users(name, avatar),
    tags(id, name)
  `);
```

### Insert with Return
```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({ title, content, author_id: userId })
  .select()
  .single();
```

### Upsert
```typescript
const { data } = await supabase
  .from('settings')
  .upsert({ user_id: userId, theme: 'dark' })
  .select()
  .single();
```

## Common Gotchas

| Issue | Solution |
|-------|----------|
| `supabase` vs `supabaseAdmin` | Use admin client for server-side operations that bypass RLS |
| Missing `.select()` after insert | Add `.select()` to get the inserted row |
| RLS blocking reads | Check policies or use admin client |
| Type errors | Generate types: `npx supabase gen types typescript` |
