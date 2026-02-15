# System Architecture

This document provides a visual and textual overview of the system architecture.

## Table of Contents
- [High-Level Architecture](#high-level-architecture)
- [Data Flow](#data-flow)
- [Authentication Flow](#authentication-flow)
- [Key Technologies](#key-technologies)
- [Component Architecture](#component-architecture)
- [Database Schema](#database-schema)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        UI[Next.js App]
        Worker[Python Worker<br/>Pyodide]
    end

    subgraph "Vercel Edge"
        MW[Middleware<br/>Auth Check]
        API[API Routes]
        SSR[Server Components]
    end

    subgraph "External Services"
        YT[YouTube Data API]
        OPENAI[OpenAI API<br/>GPT-4.1/5]
        GEMINI[Google Gemini<br/>Image Gen]
        BLOB[Vercel Blob<br/>Storage]
    end

    subgraph "Supabase"
        DB[(PostgreSQL<br/>Database)]
        AUTH[Auth/RLS]
        RT[Realtime]
    end

    UI -->|Request| MW
    MW -->|Protected| API
    MW -->|Public| API
    MW -->|SSR| SSR

    API -->|Query/Insert| DB
    API -->|Check Auth| AUTH
    API -->|AI Chat| OPENAI
    API -->|Image Gen| GEMINI
    API -->|Upload| BLOB
    API -->|Fetch Videos| YT

    SSR -->|Query| DB

    UI -->|Execute Python| Worker
    UI -->|Subscribe| RT
    RT -->|Updates| DB

    DB -->|RLS| AUTH
```

## System Overview

The application is built as a **Next.js 15 App Router** application deployed on **Vercel**, with:
- **Frontend**: React 19 client components + server components
- **Backend**: Next.js API routes (serverless functions)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: NextAuth.js with Google OAuth
- **Storage**: Vercel Blob for file uploads
- **AI Services**: OpenAI (chat), Google Gemini (images), Pyodide (Python execution)
- **Real-time**: Supabase Realtime for live questions and updates

---

## Data Flow

### Page Load (SSR)

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware
    participant ServerComponent
    participant Supabase
    participant Vercel

    Browser->>Middleware: GET /videos
    Middleware->>Middleware: Check auth (optional)
    Middleware->>ServerComponent: Render page
    ServerComponent->>Supabase: Query videos
    Supabase-->>ServerComponent: Return data
    ServerComponent-->>Vercel: HTML with data
    Vercel-->>Browser: Serve page
    Browser->>Browser: Hydrate React
```

### API Request (Client)

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant API
    participant Supabase
    participant External

    Client->>Middleware: POST /api/endpoint
    Middleware->>Middleware: Check session
    alt Unauthorized
        Middleware-->>Client: 401 Unauthorized
    else Authorized
        Middleware->>API: Forward request
        API->>API: Validate input
        API->>Supabase: Query/Insert
        Supabase-->>API: Result

        opt External API call
            API->>External: Request
            External-->>API: Response
        end

        API-->>Client: JSON response
    end
```

### Real-time Updates

```mermaid
sequenceDiagram
    participant UserA
    participant UserB
    participant Supabase
    participant RealtimeChannel

    UserA->>Supabase: POST /api/live-questions
    Supabase->>Supabase: Insert question
    Supabase->>RealtimeChannel: Broadcast INSERT

    RealtimeChannel-->>UserA: Question created
    RealtimeChannel-->>UserB: New question event

    UserB->>UserB: Update UI with new question
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant NextAuth
    participant Google
    participant Supabase
    participant Middleware

    User->>NextAuth: Click "Sign in with Google"
    NextAuth->>Google: OAuth request
    Google-->>User: Login page
    User->>Google: Enter credentials
    Google-->>NextAuth: Auth code
    NextAuth->>Google: Exchange for tokens
    Google-->>NextAuth: Access token + user info
    NextAuth->>Supabase: Create/update user record
    NextAuth->>NextAuth: Create session (JWT)
    NextAuth-->>User: Set session cookie

    User->>Middleware: Request protected page
    Middleware->>Middleware: Verify JWT
    Middleware-->>User: Allow access
```

### Authentication Tiers

1. **Public Routes**: No auth required (`/`, `/videos`, `/resources`)
2. **Authenticated Routes**: Valid session required (`/learn`, `/practice`)
3. **Admin Routes**: `UserRole.ADMIN` required (`/admin`, `/thumbnails`)
4. **Editor Routes**: `UserRole.EDITOR` required (`/studio`, `/gallery`)

---

## Key Technologies

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.3.8 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling (Cinematic Dark Mode) |
| **Framer Motion** | 12.x | Animations |
| **Monaco Editor** | 4.7.0 | Code editor |
| **Mermaid** | 11.x | Diagrams |
| **Pyodide** | (Worker) | Client-side Python execution |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.3.8 | Serverless functions |
| **NextAuth.js** | 4.24.11 | Authentication |
| **Supabase** | 2.93.2 | Database + Realtime + Auth |
| **OpenAI SDK** | 6.16.0 | GPT-4.1/5 chat |
| **Google Gemini** | 1.38.0 | AI image generation |
| **Vercel Blob** | 1.1.1 | File storage |

### Developer Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Playwright** | E2E testing |
| **Vitest** | Unit testing |
| **TSX** | TypeScript script runner |
| **GitHub Actions** | CI/CD |

---

## Component Architecture

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (routes)/                 # Route groups
│   │   ├── page.tsx              # Route page
│   │   └── _components/          # Page-specific components
│   │
│   └── api/                      # API routes (serverless)
│       ├── auth/                 # Authentication
│       ├── chat/                 # AI chat endpoints
│       ├── content/              # CMS endpoints
│       ├── test-session/         # Assessment system
│       └── [feature]/            # Feature-specific APIs
│
├── components/                   # Shared components
│   ├── ui/                       # Generic UI primitives
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   │
│   ├── editor/                   # Block editor system
│   │   ├── BlockEditor.tsx
│   │   └── hooks/
│   │
│   └── sections/                 # Reusable page sections
│
├── hooks/                        # Custom React hooks
│   ├── usePythonRunner.ts        # Python execution
│   └── useChromeMode.ts          # UI mode detection
│
├── context/                      # React context providers
│   ├── VideoContext.tsx          # Video pagination
│   └── SessionContext.tsx        # Learning session state
│
├── lib/                          # Utilities & clients
│   ├── supabase.ts               # Supabase client
│   ├── youtube.ts                # YouTube API client
│   └── flags.ts                  # Feature flags
│
└── types/                        # TypeScript definitions
    ├── chat.ts
    ├── roles.ts
    └── supabase.ts               # Generated types
```

### Component Hierarchy

```mermaid
graph TB
    ROOT[Root Layout]
    ROOT --> PROVIDER[Providers<br/>Session, Video]
    PROVIDER --> CHROME{Chrome Mode}

    CHROME -->|marketing| MARKETING[Marketing Layout<br/>Navbar + Footer]
    CHROME -->|app| APP[App Layout<br/>Navbar only]
    CHROME -->|execute| EXECUTE[Execution Mode<br/>HUD only]
    CHROME -->|studio| STUDIO[Studio Layout<br/>Editor chrome]

    MARKETING --> PAGES1[Public Pages<br/>Home, Videos]
    APP --> PAGES2[Auth Pages<br/>Learn, Practice]
    EXECUTE --> SESSION[Session Execution<br/>Timer, Exit]
    STUDIO --> EDITOR[Content Editor<br/>Block Editor]
```

### Chrome Modes

The app has **5 chrome modes** that determine UI layout:

1. **Marketing** - Navbar + Footer (public pages, logged out)
2. **App** - Navbar only (logged in, general pages)
3. **Gate** - Session entry point (home page, session mode)
4. **Execute** - Full-screen session mode (timer, minimal UI)
5. **Studio** - Content creation mode (thumbnails, gallery, admin)
6. **Exit** - Session exit flow

**Hook**: `useChromeMode()` determines current mode based on:
- Authentication status
- Current route
- Session state (from SessionContext)
- User role (Admin/Editor)

---

## Database Schema

### Core Tables

```mermaid
erDiagram
    Users ||--o{ TestSessions : creates
    Users ||--o{ UserProgress : has
    Users ||--o{ LiveQuestions : submits
    Users ||--o{ Bookmarks : has
    Users ||--o{ ThumbnailJobs : creates

    Content ||--o{ UserProgress : tracks
    TestSessions ||--o{ TestSessionAnswers : contains
    LiveQuestions ||--o{ LiveQuestionVotes : receives
    ThumbnailJobs ||--o{ ThumbnailComments : has
    ThumbnailJobs ||--o{ ThumbnailActivity : tracks

    Users {
        uuid id PK
        string email UK
        string name
        string role
        timestamp created_at
    }

    Content {
        uuid id PK
        string title
        text blocks
        string pillar
        timestamp created_at
    }

    TestSessions {
        uuid id PK
        uuid user_id FK
        string status
        jsonb metadata
        timestamp created_at
    }

    LiveQuestions {
        uuid id PK
        text content
        string user_email
        boolean is_archived
        timestamp created_at
    }

    ThumbnailJobs {
        uuid id PK
        uuid user_id FK
        string video_title
        string status
        timestamp created_at
    }
```

### Key Patterns

#### Row Level Security (RLS)
All tables use RLS policies:
- **Public read**: Some tables (LiveQuestions, Content) allow public SELECT
- **User-scoped writes**: Users can only INSERT/UPDATE/DELETE their own data
- **Admin bypass**: Admin users can access all data

**Example Policy**:
```sql
-- Users can read all questions
CREATE POLICY "Anyone can read questions"
  ON LiveQuestions FOR SELECT
  USING (true);

-- Users can insert their own questions
CREATE POLICY "Users can insert questions"
  ON LiveQuestions FOR INSERT
  WITH CHECK (auth.email() = user_email);
```

#### Realtime Subscriptions
Tables with real-time updates:
- `LiveQuestions` - Live Q&A during streams
- `ThumbnailActivity` - Collaborative thumbnail creation
- `TestSessions` - Live progress tracking

**Pattern**:
```typescript
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'TableName'
  }, (payload) => {
    // Handle INSERT, UPDATE, DELETE
  })
  .subscribe();
```

---

## Request Flow Examples

### Example 1: User Submits Chat Message

```
1. User types message in /ai chat
2. Client sends POST /api/chat with messages array
3. Middleware checks NextAuth session
4. API route validates user is authenticated
5. API streams to OpenAI API
6. Response streams back to client
7. Client updates UI with streaming text
8. Message saved to Supabase ChatConversations
```

### Example 2: Live Question Voting

```
1. User clicks vote on question
2. POST /api/live-questions/[id]/vote
3. Middleware checks auth
4. API inserts vote into LiveQuestionVotes
5. Supabase triggers real-time broadcast
6. All connected clients receive update
7. UI updates vote count instantly
```

### Example 3: Python Code Execution

```
1. User writes Python code in editor
2. Client calls usePythonRunner.run(code)
3. Message sent to Python Worker (Pyodide)
4. Worker executes code in WebAssembly
5. stdout/stderr streamed back via postMessage
6. UI updates output in real-time
7. Timeout safety net (5s) prevents hangs
```

### Example 4: File Upload

```
1. User selects file in form
2. Client sends POST /api/upload with FormData
3. Middleware checks auth
4. API validates file type/size
5. File uploaded to Vercel Blob
6. Returns public URL
7. URL saved in database record
```

---

## Performance Considerations

### Caching Strategy

1. **Static Generation (SSG)**: Marketing pages
2. **Server Components**: Data-heavy pages (videos, learn)
3. **Client State**: User interactions, forms
4. **API Cache**: YouTube video data cached (cron refresh)

### Optimization Techniques

- **Infinite scroll**: Videos paginate with 24/page
- **Image optimization**: Next.js automatic image optimization
- **Code splitting**: Dynamic imports for heavy components
- **Streaming**: AI responses stream for perceived performance
- **Web Workers**: Python execution offloaded to worker thread

### Database Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_videos_published ON videos(published_at DESC);
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_questions_archived ON live_questions(is_archived, created_at DESC);
CREATE INDEX idx_sessions_user_status ON test_sessions(user_id, status);
```

---

## Security Architecture

### Defense in Depth

1. **Middleware**: First line of defense (auth check)
2. **API Validation**: Input validation in route handlers
3. **RLS Policies**: Database-level access control
4. **Environment Variables**: Secrets never committed
5. **NextAuth**: Secure session management (JWT)
6. **HTTPS Only**: All traffic encrypted in production

### Security Checklist

- ✅ All protected routes check authentication
- ✅ Admin routes verify `UserRole.ADMIN`
- ✅ RLS enabled on all user-data tables
- ✅ Input validation on all API endpoints
- ✅ Secrets stored in environment variables
- ✅ CORS handled by Next.js
- ✅ Content Security Policy configured

---

## Deployment Architecture

### Vercel Deployment

```
Git Push (main branch)
    ↓
GitHub Actions CI
    ├─ Lint
    ├─ Typecheck
    └─ Build
    ↓
Vercel Build
    ├─ Next.js build
    ├─ Environment variables injected
    └─ Deploy to Edge Network
    ↓
Production Live
    ├─ CDN edge caching
    ├─ Serverless functions (API routes)
    └─ Static assets on CDN
```

### Environment Configuration

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Production** | Live site | `peralta.dev` (or configured domain) |
| **Preview** | PR previews | `*.vercel.app` |
| **Development** | Local dev | `localhost:3000` |

### Monitoring

- **Vercel Analytics**: Page views, web vitals
- **Vercel Logs**: Serverless function logs
- **Supabase Dashboard**: Database queries, RLS logs
- **Error Boundaries**: Client-side error catching

---

## Feature Flags

```typescript
// src/lib/flags.ts
export enum FeatureFlags {
  SESSION_MODE = 'session_mode',
  PYTHON_EDITOR = 'python_editor',
  // ... more flags
}

// Usage
const isEnabled = isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user);
```

Allows gradual rollout of features and A/B testing.

---

## Future Architecture Considerations

### Potential Improvements

1. **Caching Layer**: Add Redis for hot data (video metadata, user sessions)
2. **CDN**: Cloudflare for additional edge caching
3. **Background Jobs**: Bull/BullMQ for async processing
4. **Webhooks**: Receive events from external services
5. **GraphQL**: Consider for complex data fetching
6. **Microservices**: Split heavy features (AI, video processing)

### Scalability Path

```
Current: Monolithic Next.js app
    ↓
Next: Modular monolith (separate concerns)
    ↓
Future: Microservices (AI service, CMS service, etc.)
```

---

## Related Documentation

- **API Routes**: See `docs/API.md`
- **Code Examples**: See `docs/EXAMPLES.md`
- **Design System**: See `.agent/skills/brand-guidelines/SKILL.md`
- **Testing**: See `.agent/skills/webapp-testing/SKILL.md`
- **Database**: See `docs/SUPABASE_PATTERNS.md` (if created)

---

**Last Updated**: 2026-02-14
**Maintained By**: Project team
