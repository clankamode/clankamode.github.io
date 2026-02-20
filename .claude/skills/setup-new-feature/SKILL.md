---
name: setup-new-feature
description: Scaffold a new feature from scratch — creates branch, page route, navbar entries, middleware config, and API boilerplate.
argument-hint: <feature name and description>
allowed-tools: Bash, Read, Write, Edit, Glob
---

Set up the scaffolding for a new feature: $ARGUMENTS

## Steps

### 1. Clarify Scope First
Before touching code, confirm:
- What does this feature do from the user's perspective?
- Is it a new page, a section on an existing page, or just a new API?
- Is it authenticated or public?

### 2. Create Feature Branch
```bash
git checkout main && git pull
git checkout -b feat/[feature-name]
```

### 3. File Scaffolding

**New page** — create/update all 5 of these:
```
src/app/[page]/page.tsx               # Page component
src/app/[page]/_components/           # Page-specific components
src/components/layout/Navbar.tsx      # Add desktop nav link
src/components/layout/Navbar.tsx      # Add mobile nav link
src/middleware.ts                     # Add to public/protected + matcher
```

**New API endpoint:**
```
src/app/api/[name]/route.ts
```

### 4. API Route Boilerplate
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

### 5. Page Component Boilerplate
```typescript
import { supabase } from '@/lib/supabase';

export default async function FeaturePage() {
  const { data } = await supabase.from('table').select('*');
  return <div>{/* render */}</div>;
}
```

### 6. Checklist
- [ ] Feature branch created from latest main
- [ ] Page route created (if applicable)
- [ ] Navbar updated: desktop + mobile (if new nav item)
- [ ] Middleware updated: route logic + matcher (if applicable)
- [ ] API route created with auth check (if applicable)
- [ ] TypeScript interfaces defined
- [ ] No unused imports or variables
