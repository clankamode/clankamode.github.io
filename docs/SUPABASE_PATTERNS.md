# Supabase Patterns & Best Practices

Comprehensive guide to database patterns, RLS policies, and advanced Supabase usage in this project.

## Table of Contents
- [Client Setup](#client-setup)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Common Query Patterns](#common-query-patterns)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Migrations](#migrations)
- [Advanced Patterns](#advanced-patterns)
- [Performance Optimization](#performance-optimization)

---

## Client Setup

### Basic Client (Browser & Server)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Usage in Server Components**:
```typescript
// Direct import and use
import { supabase } from '@/lib/supabase';

export default async function Page() {
  const { data } = await supabase
    .from('content')
    .select('*')
    .order('created_at', { ascending: false });

  return <ContentList items={data} />;
}
```

**Usage in API Routes**:
```typescript
// src/app/api/resource/route.ts
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('table')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**Usage in Client Components**:
```typescript
'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function Component() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('table').select('*');
      if (data) setData(data);
    }
    fetchData();
  }, []);

  return <div>{/* render */}</div>;
}
```

---

## Row Level Security (RLS)

### Understanding RLS

RLS policies control which rows users can access at the **database level**. This is the **primary security mechanism** in Supabase.

**Key Concepts**:
- Policies are evaluated **before** the query executes
- Use `auth.uid()` to get current user's ID
- Use `auth.email()` to get current user's email
- Policies can be different for SELECT, INSERT, UPDATE, DELETE
- Multiple policies with `OR` logic (any passing policy grants access)

### Common RLS Patterns

#### Pattern 1: Public Read, Authenticated Write

**Use Case**: Blog posts, resources—anyone can read, only authenticated users can create.

```sql
-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read content"
  ON public.content
  FOR SELECT
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can create content"
  ON public.content
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

#### Pattern 2: User-Scoped Data

**Use Case**: User bookmarks, progress—users can only see/modify their own data.

```sql
-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookmarks
CREATE POLICY "Users can read own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.email() = user_email);

-- Users can insert their own bookmarks
CREATE POLICY "Users can create own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.email() = user_email);

-- Users can update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
  ON public.bookmarks
  FOR UPDATE
  USING (auth.email() = user_email);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.email() = user_email);
```

#### Pattern 3: Role-Based Access

**Use Case**: Admin panel—only admins can access certain tables.

```sql
-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read settings"
  ON public.admin_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.email()
      AND users.role = 'ADMIN'
    )
  );

-- Only admins can modify
CREATE POLICY "Admins can update settings"
  ON public.admin_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.email()
      AND users.role = 'ADMIN'
    )
  );
```

#### Pattern 4: Conditional Read Access

**Use Case**: Live questions—read all, but only see non-archived for normal users.

```sql
-- Enable RLS
ALTER TABLE public.live_questions ENABLE ROW LEVEL SECURITY;

-- Users can read non-archived questions
CREATE POLICY "Users can read active questions"
  ON public.live_questions
  FOR SELECT
  USING (
    is_archived = false
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.email()
      AND users.role IN ('ADMIN', 'EDITOR')
    )
  );

-- Users can insert questions
CREATE POLICY "Authenticated users can create questions"
  ON public.live_questions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.email() = user_email);

-- Only admins can archive
CREATE POLICY "Admins can update questions"
  ON public.live_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.email()
      AND users.role = 'ADMIN'
    )
  );
```

#### Pattern 5: One Vote Per User

**Use Case**: Voting system—prevent duplicate votes.

```sql
-- Enable RLS
ALTER TABLE public.live_question_votes ENABLE ROW LEVEL SECURITY;

-- Users can read all votes (for counts)
CREATE POLICY "Anyone can read votes"
  ON public.live_question_votes
  FOR SELECT
  USING (true);

-- Users can only insert if they haven't voted
CREATE POLICY "Users can vote once per question"
  ON public.live_question_votes
  FOR INSERT
  WITH CHECK (
    auth.email() = user_email
    AND NOT EXISTS (
      SELECT 1 FROM public.live_question_votes
      WHERE question_id = NEW.question_id
      AND user_email = auth.email()
    )
  );

-- Users can delete their own votes (unvote)
CREATE POLICY "Users can remove own votes"
  ON public.live_question_votes
  FOR DELETE
  USING (auth.email() = user_email);
```

#### Pattern 6: Time-Based Access

**Use Case**: Test sessions—only access during active session.

```sql
-- Enable RLS
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON public.test_sessions
  FOR SELECT
  USING (auth.email() = user_email);

-- Users can only update active sessions (not completed)
CREATE POLICY "Users can update active sessions"
  ON public.test_sessions
  FOR UPDATE
  USING (
    auth.email() = user_email
    AND status IN ('in_progress', 'active')
    AND created_at > NOW() - INTERVAL '24 hours'
  );
```

---

## Common Query Patterns

### Basic CRUD

#### Read All

```typescript
const { data, error } = await supabase
  .from('content')
  .select('*');
```

#### Read with Filter

```typescript
const { data, error } = await supabase
  .from('content')
  .select('*')
  .eq('pillar', 'algorithms')
  .order('created_at', { ascending: false });
```

#### Read Single Row

```typescript
const { data, error } = await supabase
  .from('content')
  .select('*')
  .eq('id', contentId)
  .single(); // Returns single object, not array
```

#### Insert

```typescript
const { data, error } = await supabase
  .from('bookmarks')
  .insert([
    {
      user_email: session.user.email,
      content_id: contentId,
    },
  ])
  .select(); // Returns inserted rows
```

#### Update

```typescript
const { data, error } = await supabase
  .from('content')
  .update({ title: 'New Title' })
  .eq('id', contentId)
  .select();
```

#### Delete

```typescript
const { data, error } = await supabase
  .from('bookmarks')
  .delete()
  .eq('id', bookmarkId);
```

### Advanced Queries

#### Joins (Foreign Key Relations)

```typescript
// Get questions with vote counts
const { data, error } = await supabase
  .from('live_questions')
  .select(`
    *,
    live_question_votes (count)
  `)
  .order('created_at', { ascending: false });

// Result:
// [
//   {
//     id: '...',
//     content: 'Question text',
//     live_question_votes: [{ count: 5 }]
//   }
// ]
```

#### Pagination

```typescript
const ITEMS_PER_PAGE = 24;

const { data, error } = await supabase
  .from('videos')
  .select('*')
  .order('published_at', { ascending: false })
  .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
```

#### Search (Full-Text)

```typescript
const { data, error } = await supabase
  .from('content')
  .select('*')
  .textSearch('title', 'algorithm', {
    type: 'websearch',
    config: 'english',
  });
```

#### Aggregations

```typescript
// Count rows
const { count, error } = await supabase
  .from('live_questions')
  .select('*', { count: 'exact', head: true });

// Group by and count
const { data, error } = await supabase
  .from('user_progress')
  .select('pillar, count:id')
  .eq('completed', true)
  .order('pillar');
```

#### Conditional Logic

```typescript
// Multiple filters with OR
const { data, error } = await supabase
  .from('content')
  .select('*')
  .or('pillar.eq.algorithms,pillar.eq.data-structures');

// IN clause
const { data, error } = await supabase
  .from('content')
  .select('*')
  .in('id', [id1, id2, id3]);

// NULL checks
const { data, error } = await supabase
  .from('test_sessions')
  .select('*')
  .is('completed_at', null);
```

#### Upsert (Insert or Update)

```typescript
const { data, error } = await supabase
  .from('user_progress')
  .upsert(
    {
      user_email: session.user.email,
      content_id: contentId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_email,content_id', // Unique constraint
    }
  );
```

### Error Handling Pattern

```typescript
async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryFn();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Database query failed');
  }

  if (!data) {
    throw new Error('No data returned');
  }

  return data;
}

// Usage
try {
  const content = await safeQuery(() =>
    supabase.from('content').select('*').eq('id', id).single()
  );
  // Use content
} catch (error) {
  // Handle error
}
```

---

## Real-time Subscriptions

### Basic Subscription

```typescript
const channel = supabase
  .channel('table-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'live_questions',
    },
    (payload) => {
      console.log('Change received:', payload);

      if (payload.eventType === 'INSERT') {
        setQuestions((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setQuestions((prev) =>
          prev.map((q) => (q.id === payload.new.id ? payload.new : q))
        );
      } else if (payload.eventType === 'DELETE') {
        setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
      }
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Filtered Subscription

```typescript
const channel = supabase
  .channel('active-questions')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'live_questions',
      filter: 'is_archived=eq.false', // Only non-archived
    },
    handleChange
  )
  .subscribe();
```

### Multiple Tables

```typescript
const channel = supabase
  .channel('multi-table')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'live_questions' },
    handleQuestionInsert
  )
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'live_question_votes' },
    handleVoteInsert
  )
  .subscribe();
```

### Presence (User Online Status)

```typescript
const channel = supabase.channel('room-1', {
  config: {
    presence: {
      key: session.user.email,
    },
  },
});

// Track user presence
channel.on('presence', { event: 'sync' }, () => {
  const users = channel.presenceState();
  console.log('Online users:', users);
});

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      user: session.user.email,
      online_at: new Date().toISOString(),
    });
  }
});

// Leave
channel.untrack();
```

### Broadcast (Ephemeral Messages)

```typescript
// Sender
await channel.send({
  type: 'broadcast',
  event: 'cursor-move',
  payload: { x: 100, y: 200 },
});

// Receiver
channel.on('broadcast', { event: 'cursor-move' }, (payload) => {
  console.log('Cursor moved:', payload);
});
```

---

## Migrations

### Migration File Structure

```
supabase/migrations/
├── 20260214120000_create_resources_table.sql
├── 20260214130000_add_rls_policies.sql
└── 20260214140000_create_indexes.sql
```

### Complete Migration Example

```sql
-- supabase/migrations/20260214120000_create_content_system.sql

-- Create content table
CREATE TABLE IF NOT EXISTS public.content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  pillar TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, content_id)
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Content policies
CREATE POLICY "Anyone can read content"
  ON public.content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage content"
  ON public.content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.email()
      AND users.role = 'ADMIN'
    )
  );

-- Progress policies
CREATE POLICY "Users can read own progress"
  ON public.user_progress FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can upsert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.email() = user_email);

-- Create indexes
CREATE INDEX idx_content_pillar ON public.content(pillar);
CREATE INDEX idx_content_created_at ON public.content(created_at DESC);
CREATE INDEX idx_user_progress_user ON public.user_progress(user_email);
CREATE INDEX idx_user_progress_content ON public.user_progress(content_id);
CREATE INDEX idx_user_progress_completed ON public.user_progress(completed, completed_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.content IS 'Learning content (articles, tutorials)';
COMMENT ON TABLE public.user_progress IS 'Tracks user completion of content';
COMMENT ON COLUMN public.content.blocks IS 'Block editor JSON structure';
```

### Migration Best Practices

1. **Always use timestamps** in filename: `YYYYMMDDHHMMSS_description.sql`
2. **Use IF NOT EXISTS** for safety
3. **Add indexes** for frequently queried columns
4. **Enable RLS** immediately after table creation
5. **Add comments** to document table purpose
6. **Use CASCADE** for foreign key deletions when appropriate
7. **Test migrations** locally before deploying

---

## Advanced Patterns

### Composite Unique Constraints

```sql
-- One vote per user per question
CREATE TABLE public.live_question_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.live_questions(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, user_email)
);
```

### JSON/JSONB Columns

```typescript
// Insert with JSON
const { data, error } = await supabase
  .from('content')
  .insert({
    title: 'My Article',
    blocks: [
      { type: 'heading', content: 'Introduction' },
      { type: 'paragraph', content: 'Hello world' },
    ],
  });

// Query JSON fields
const { data, error } = await supabase
  .from('test_sessions')
  .select('*')
  .contains('metadata', { difficulty: 'hard' });
```

### Computed Columns (Views)

```sql
-- Create view with computed columns
CREATE VIEW public.questions_with_votes AS
SELECT
  q.*,
  COUNT(v.id) AS vote_count,
  ARRAY_AGG(v.user_email) FILTER (WHERE v.user_email IS NOT NULL) AS voters
FROM public.live_questions q
LEFT JOIN public.live_question_votes v ON q.id = v.question_id
GROUP BY q.id;

-- Query view
const { data } = await supabase
  .from('questions_with_votes')
  .select('*')
  .order('vote_count', { ascending: false });
```

### Database Functions (Stored Procedures)

```sql
-- Create function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count(question_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  vote_count INTEGER;
BEGIN
  -- Insert vote (will fail if duplicate due to unique constraint)
  INSERT INTO public.live_question_votes (question_id, user_email)
  VALUES (question_uuid, auth.email());

  -- Return updated count
  SELECT COUNT(*) INTO vote_count
  FROM public.live_question_votes
  WHERE question_id = question_uuid;

  RETURN vote_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call from application
const { data, error } = await supabase.rpc('increment_vote_count', {
  question_uuid: questionId,
});
```

### Soft Deletes

```sql
-- Add deleted_at column
ALTER TABLE public.content
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policy to exclude soft-deleted
CREATE POLICY "Users can read non-deleted content"
  ON public.content FOR SELECT
  USING (deleted_at IS NULL);

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_content(content_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.content
  SET deleted_at = NOW()
  WHERE id = content_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Performance Optimization

### Indexes

```sql
-- Single column index
CREATE INDEX idx_content_pillar ON public.content(pillar);

-- Composite index (order matters!)
CREATE INDEX idx_progress_user_completed ON public.user_progress(user_email, completed);

-- Partial index (only index active sessions)
CREATE INDEX idx_active_sessions ON public.test_sessions(user_email)
WHERE status IN ('in_progress', 'active');

-- Full-text search index
CREATE INDEX idx_content_search ON public.content
USING GIN (to_tsvector('english', title || ' ' || blocks));
```

### Query Optimization

```typescript
// Bad: Multiple queries
const { data: question } = await supabase.from('live_questions').select('*').eq('id', id).single();
const { data: votes } = await supabase.from('live_question_votes').select('*').eq('question_id', id);

// Good: Single query with join
const { data } = await supabase
  .from('live_questions')
  .select(`
    *,
    live_question_votes (*)
  `)
  .eq('id', id)
  .single();
```

### Batch Operations

```typescript
// Bad: Loop with individual inserts
for (const item of items) {
  await supabase.from('table').insert(item);
}

// Good: Single batch insert
await supabase.from('table').insert(items);
```

### Connection Pooling

Supabase handles connection pooling automatically. For high-traffic applications:

1. Use **Supavisor** (Supabase's connection pooler)
2. Configure max connections in Supabase dashboard
3. Monitor connection usage in dashboard

---

## Troubleshooting

### Common Issues

#### RLS Policy Not Working

```typescript
// Debug: Check auth context
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated as:', user?.email);

// Verify policy in Supabase SQL Editor:
SELECT * FROM public.content; -- May return nothing if RLS blocks
```

#### Performance Issues

```sql
-- Check slow queries in Supabase Dashboard > Reports
-- Or use EXPLAIN ANALYZE:
EXPLAIN ANALYZE
SELECT * FROM public.content
WHERE pillar = 'algorithms';

-- Look for:
-- - Missing indexes (Seq Scan instead of Index Scan)
-- - High execution time
-- - Large row counts
```

#### Real-time Not Updating

1. Check if RLS allows SELECT (real-time requires read access)
2. Verify channel subscription status
3. Check network tab for WebSocket connection
4. Enable real-time on table in Supabase dashboard

---

## Related Documentation

- **API Examples**: See `docs/API.md`
- **Code Examples**: See `docs/EXAMPLES.md`
- **Architecture**: See `docs/ARCHITECTURE.md`

---

**Last Updated**: 2026-02-14
**Maintained By**: Project team
