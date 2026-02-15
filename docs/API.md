# API Routes Reference

This document provides a quick reference for all API endpoints in the application.

## Authentication

All authenticated routes require a valid NextAuth session. Use `getToken({ req })` to validate.

**Auth Check Pattern**:
```typescript
const token = await getToken({ req });
if (!token?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Admin Check Pattern**:
```typescript
if (token.role !== UserRole.ADMIN) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Endpoints by Feature

### Authentication

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth.js authentication handlers |
| `/api/auth/test-session` | GET | Dev Only | Create test auth session for E2E tests |

### User & Profile

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/avatar/upload` | POST | Required | Upload user avatar image |
| `/api/analytics` | GET | Required | Get user analytics data |
| `/api/bookmarks` | GET, POST, DELETE | Required | Manage user bookmarks |

### Chat & AI

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/chat` | POST | Required | Send chat message (streaming) |
| `/api/chat/conversations` | GET, POST | Required | List or create conversations |
| `/api/chat/conversations/[id]` | GET, DELETE | Required | Get or delete specific conversation |
| `/api/chat/conversations/[id]/message` | POST | Required | Add message to conversation |
| `/api/chat/generate-image` | POST | Required | Generate AI image with Gemini |
| `/api/chat/upload` | POST | Required | Upload file attachment |
| `/api/chat/upload-pdf` | POST | Required | Upload PDF for chat context |

### Content Management

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/content` | GET, POST | Admin | List or create content articles |
| `/api/content/[id]` | GET, PUT, DELETE | Admin | CRUD for specific article |
| `/api/content/upload` | POST | Admin | Upload media for articles |
| `/api/content/delete-media` | POST | Admin | Delete media from articles |
| `/api/content/alt-text` | POST | Admin | Generate alt text for images |
| `/api/content/summary` | POST | Admin | Generate article summary |
| `/api/content/article-update` | POST | Admin | Update article with AI assistance |
| `/api/content/voice-draft` | POST | Admin | Create draft from voice notes |
| `/api/content/pillars` | GET | Admin | Get content pillars/categories |

### Learning Platform

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/progress` | GET | Required | Get user learning progress |
| `/api/progress/complete` | POST | Required | Mark content as complete |
| `/api/session/finalize` | POST | Required | Finalize learning session |

### Assessment & Testing

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/assessment/questions` | GET | Required | Get assessment questions |
| `/api/test-session` | POST | Required | Start new test session |
| `/api/test-session/list` | GET | Required | List user's test sessions |
| `/api/test-session/answer` | POST | Required | Submit answer to question |
| `/api/test-session/complete` | POST | Required | Complete test session |
| `/api/test-session/results` | GET | Required | Get test session results |
| `/api/interview-questions/random` | GET | Required | Get random interview question |
| `/api/mocks` | GET | Required | Get mock interview data |

### Peralta75 (Daily Challenge)

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/peralta75/[id]` | GET, PUT | Required | Get or update challenge progress |

### Live Q&A

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/live-questions` | GET, POST | GET: Public, POST: Required | List or submit live questions |
| `/api/live-questions/[id]/vote` | POST | Required | Vote on a question |
| `/api/live-questions/[id]/archive` | POST | Admin | Archive answered question |

### Feedback

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/feedback` | POST | Required | Submit user feedback |

### Gallery

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/gallery` | GET | Public | List gallery images |
| `/api/gallery/upload` | POST | Admin | Upload gallery image |
| `/api/gallery/confirm` | POST | Admin | Confirm gallery upload |
| `/api/gallery/delete` | POST | Admin | Delete gallery image |

### Thumbnail Jobs

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/thumbnail_job` | GET, POST | Required | List or create thumbnail jobs |
| `/api/thumbnail_job/batch` | POST | Admin | Batch create thumbnail jobs |
| `/api/thumbnail_job/[id]` | GET, PUT, DELETE | Required | CRUD specific thumbnail job |
| `/api/thumbnail_job/[id]/activity` | GET, POST | Required | Job activity log |
| `/api/thumbnail_job/[id]/comments` | GET, POST | Required | Job comments |
| `/api/thumbnail_job/[id]/comments/upload` | POST | Required | Upload comment attachment |
| `/api/thumbnail_job/[id]/generate-suggestions` | POST | Required | AI-generate thumbnail ideas |

### Videos & YouTube

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/videos` | GET | Public | List YouTube videos with pagination |
| `/api/youtube/random-video` | GET | Public | Get random YouTube video |
| `/api/video_data_cron` | GET | Cron Only | Update video data from YouTube API |

### Admin & Development

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/admin/daily-brief` | POST | Admin | Generate daily content brief |
| `/api/dev/cache` | DELETE | Dev Only | Clear application cache |

---

## Common Request/Response Patterns

### Pagination (GET)

**Request**:
```
GET /api/videos?page=1&limit=12
```

**Response**:
```json
{
  "items": [...],
  "page": 1,
  "limit": 12,
  "total": 100,
  "hasMore": true
}
```

### Create Resource (POST)

**Request**:
```json
POST /api/resource
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

**Success Response**:
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2026-02-14T..."
}
```

**Error Response**:
```json
{
  "error": "Error message"
}
```

### Update Resource (PUT)

**Request**:
```json
PUT /api/resource/[id]
Content-Type: application/json

{
  "field1": "new_value"
}
```

**Response**:
```json
{
  "id": "uuid",
  "field1": "new_value",
  "updated_at": "2026-02-14T..."
}
```

### Delete Resource (DELETE)

**Request**:
```
DELETE /api/resource/[id]
```

**Success Response**:
```json
{
  "success": true
}
```

### File Upload (POST)

**Request**:
```
POST /api/upload
Content-Type: multipart/form-data

FormData: { file: File }
```

**Response**:
```json
{
  "url": "https://blob.vercel-storage.com/...",
  "pathname": "file-name-xyz.jpg"
}
```

### Streaming Response

Used for AI chat responses:

```typescript
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

---

## Error Codes

| Status | Meaning | Use Case |
|--------|---------|----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input/missing required fields |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized (e.g., not admin) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for:
- AI endpoints (chat, image generation)
- File upload endpoints
- Public endpoints (live questions, videos)

---

## Cron Jobs

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/video_data_cron` | Daily | Fetch latest video data from YouTube API |

**Vercel Cron Configuration** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/video_data_cron",
    "schedule": "0 0 * * *"
  }]
}
```

---

## Security Considerations

1. **Authentication**: All protected routes check for valid NextAuth token
2. **Authorization**: Admin routes verify `UserRole.ADMIN`
3. **Input Validation**: Validate all user inputs before processing
4. **RLS**: Supabase Row Level Security policies enforce data access rules
5. **Environment Variables**: Sensitive keys stored in `.env.local` (never committed)
6. **CORS**: Next.js handles CORS automatically
7. **File Uploads**: Files uploaded to Vercel Blob with public access

---

## Adding a New API Route

1. Create `src/app/api/[name]/route.ts`
2. Implement HTTP method handlers (GET, POST, PUT, DELETE)
3. Add authentication check if needed
4. Validate input data
5. Use Supabase client from `@/lib/supabase`
6. Return `NextResponse.json()` with appropriate status codes
7. Add to this documentation

**Template**:
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('table')
      .select('*');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

---

## Testing API Routes

### Unit Testing
Currently not implemented. Consider adding Vitest tests for:
- Input validation
- Authentication logic
- Business logic

### E2E Testing
Use Playwright to test API routes through the UI. See `tests/` directory.

### Manual Testing
Use tools like:
- **Postman**: For manual API testing
- **curl**: For command-line testing
- **Browser DevTools**: For network inspection

**Example curl**:
```bash
curl -X GET http://localhost:3000/api/videos?page=1&limit=12
```

---

## Performance Optimization

1. **Database Queries**: Use indexes (see migration SQL)
2. **Caching**: Consider adding Redis for frequently accessed data
3. **Pagination**: Always paginate large datasets
4. **Lazy Loading**: Load data on-demand
5. **Streaming**: Use for AI responses to improve perceived performance

---

## Future Considerations

- [ ] Add OpenAPI/Swagger documentation generation
- [ ] Implement rate limiting
- [ ] Add request logging/monitoring
- [ ] Add API versioning (e.g., `/api/v1/...`)
- [ ] Add webhook endpoints for external integrations
- [ ] Add GraphQL endpoint as alternative to REST
- [ ] Add comprehensive API testing suite

---

For implementation examples, see `docs/EXAMPLES.md`.
