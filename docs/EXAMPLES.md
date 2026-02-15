# Code Examples & Common Patterns

This file contains practical examples for common development tasks in this codebase.

## Table of Contents
- [Creating a New Page with Navigation](#creating-a-new-page-with-navigation)
- [Adding an API Route with Authentication](#adding-an-api-route-with-authentication)
- [Creating a Supabase Table](#creating-a-supabase-table)
- [Building a Form Component](#building-a-form-component)
- [Real-time Subscriptions](#real-time-subscriptions)
- [File Upload to Vercel Blob](#file-upload-to-vercel-blob)
- [Testing Patterns](#testing-patterns)

---

## Creating a New Page with Navigation

When adding a new top-level page, you must update 5 files for consistency.

### 1. Create the Page Route

```typescript
// src/app/resources/page.tsx
import { Metadata } from 'next';
import { ResourceList } from './_components/ResourceList';

export const metadata: Metadata = {
  title: 'Resources | James Peralta',
  description: 'Coding resources and learning materials',
};

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Resources</h1>
        <ResourceList />
      </div>
    </main>
  );
}
```

### 2. Create Page-Specific Components

```typescript
// src/app/resources/_components/ResourceList.tsx
'use client';

import { useState, useEffect } from 'react';

interface Resource {
  id: string;
  title: string;
  url: string;
  category: string;
}

export function ResourceList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await fetch('/api/resources');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setResources(data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading resources...</div>;
  }

  return (
    <div className="grid gap-4">
      {resources.map((resource) => (
        <a
          key={resource.id}
          href={resource.url}
          className="p-6 bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 transition-colors"
        >
          <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
          <span className="text-sm text-gray-400">{resource.category}</span>
        </a>
      ))}
    </div>
  );
}
```

### 3. Update Navbar Desktop Navigation

```typescript
// src/components/layout/Navbar.tsx (desktop section)
<div className="hidden md:flex items-center gap-8">
  <Link href="/" className="...">Home</Link>
  <Link href="/videos" className="...">Videos</Link>
  <Link href="/resources" className="...">Resources</Link> {/* NEW */}
  <Link href="/learn" className="...">Learn</Link>
  {/* ... other links */}
</div>
```

### 4. Update Navbar Mobile Navigation

```typescript
// src/components/layout/Navbar.tsx (mobile menu section)
{isOpen && (
  <div className="md:hidden ...">
    <Link href="/" onClick={() => setIsOpen(false)}>Home</Link>
    <Link href="/videos" onClick={() => setIsOpen(false)}>Videos</Link>
    <Link href="/resources" onClick={() => setIsOpen(false)}>Resources</Link> {/* NEW */}
    <Link href="/learn" onClick={() => setIsOpen(false)}>Learn</Link>
    {/* ... other links */}
  </div>
)}
```

### 5. Update Middleware

```typescript
// src/middleware.ts
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = [
    '/',
    '/videos',
    '/resources',  // NEW - Make it public
    '/api/auth',
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected route logic...
}

export const config = {
  matcher: [
    '/',
    '/videos/:path*',
    '/resources/:path*',  // NEW - Add to matcher
    '/learn/:path*',
    // ... other routes
  ],
};
```

---

## Adding an API Route with Authentication

### Basic Authenticated Route

```typescript
// src/app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Check authentication
  const token = await getToken({ req });
  if (!token?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, url, category } = body;

    // Validate input
    if (!title || !url || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([
        {
          title,
          url,
          category,
          user_email: token.email,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
```

### Admin-Only Route

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  // Check admin role
  if (!token?.email || token.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Admin-only logic
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
```

---

## Creating a Supabase Table

### Migration SQL

```sql
-- supabase/migrations/20260214000000_create_resources_table.sql
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all resources
CREATE POLICY "Anyone can read resources"
  ON public.resources
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own resources
CREATE POLICY "Authenticated users can insert resources"
  ON public.resources
  FOR INSERT
  WITH CHECK (auth.email() = user_email);

-- Policy: Users can update their own resources
CREATE POLICY "Users can update own resources"
  ON public.resources
  FOR UPDATE
  USING (auth.email() = user_email);

-- Policy: Users can delete their own resources
CREATE POLICY "Users can delete own resources"
  ON public.resources
  FOR DELETE
  USING (auth.email() = user_email);

-- Create indexes for performance
CREATE INDEX idx_resources_user_email ON public.resources(user_email);
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_created_at ON public.resources(created_at DESC);
```

### TypeScript Types

```typescript
// src/types/database.ts
export interface Resource {
  id: string;
  title: string;
  url: string;
  category: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceInsert {
  title: string;
  url: string;
  category: string;
  user_email: string;
}
```

---

## Building a Form Component

```typescript
// src/components/forms/ResourceForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';

interface ResourceFormData {
  title: string;
  url: string;
  category: string;
}

export function ResourceForm() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    url: '',
    category: 'Tutorial',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create resource');
      }

      setSuccess(true);
      setFormData({ title: '', url: '', category: 'Tutorial' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-lg">
        <p className="text-gray-400">Please sign in to add resources.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white/5 backdrop-blur-sm rounded-lg"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-2">
          URL
        </label>
        <input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Category
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="Tutorial">Tutorial</option>
          <option value="Documentation">Documentation</option>
          <option value="Tool">Tool</option>
          <option value="Article">Article</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
          Resource created successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Resource'}
      </button>
    </form>
  );
}
```

---

## Real-time Subscriptions

```typescript
// src/components/LiveQuestions.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  content: string;
  user_email: string;
  user_name: string | null;
  created_at: string;
  is_archived: boolean;
}

export function LiveQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Initial fetch
    async function fetchQuestions() {
      const { data } = await supabase
        .from('LiveQuestions')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (data) setQuestions(data);
    }
    fetchQuestions();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('live-questions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'LiveQuestions',
          filter: 'is_archived=eq.false',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setQuestions((prev) => [payload.new as Question, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === payload.new.id ? (payload.new as Question) : q
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setQuestions((prev) =>
              prev.filter((q) => q.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div
          key={question.id}
          className="p-4 bg-white/5 backdrop-blur-sm rounded-lg"
        >
          <p className="text-lg mb-2">{question.content}</p>
          <p className="text-sm text-gray-400">
            {question.user_name || question.user_email}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## File Upload to Vercel Blob

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/components/FileUpload.tsx
'use client';

import { useState, ChangeEvent } from 'react';

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setFileUrl(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="..."
      />
      {uploading && <p>Uploading...</p>}
      {fileUrl && (
        <div>
          <p>Upload successful!</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            View file
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## Testing Patterns

### E2E Test with Authentication

```typescript
// tests/resources.spec.ts
import { test, expect } from '@playwright/test';

// Use authenticated state
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Resources Page', () => {
  test('should display resources list', async ({ page }) => {
    await page.goto('/resources');

    // Wait for content to load
    await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();

    // Check for resources
    const resourceCards = page.locator('a[href*="http"]');
    await expect(resourceCards.first()).toBeVisible();
  });

  test('should create new resource', async ({ page }) => {
    await page.goto('/resources');

    // Fill form
    await page.fill('input[id="title"]', 'Test Resource');
    await page.fill('input[id="url"]', 'https://example.com');
    await page.selectOption('select[id="category"]', 'Tutorial');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.getByText('Resource created successfully')).toBeVisible();
  });
});
```

### Setup Authentication for Tests

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // Navigate to test auth endpoint
  await page.goto('/api/auth/test-session?role=USER');

  // Wait for redirect or success
  await page.waitForURL('/');

  // Save authenticated state
  await page.context().storageState({
    path: 'playwright/.auth/user.json'
  });
});
```

---

## Summary

These examples cover the most common patterns in this codebase:
- Multi-file updates for new pages
- API routes with authentication
- Database schema and RLS policies
- Form handling with loading/error states
- Real-time subscriptions
- File uploads
- E2E testing with Playwright

For more specific patterns, see:
- **Design**: `.agent/skills/brand-guidelines/SKILL.md`
- **Testing**: `.agent/skills/webapp-testing/SKILL.md`
- **Refactoring**: `.agent/skills/modular-refactor/SKILL.md`
