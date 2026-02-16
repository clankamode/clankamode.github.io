# Custom Hooks Reference

This document catalogs all custom React hooks in the codebase with usage examples and implementation details.

## Table of Contents
- [Global Hooks](#global-hooks)
- [Feature-Specific Hooks](#feature-specific-hooks)
- [Editor Hooks](#editor-hooks)
- [Context Hooks](#context-hooks)
- [Hook Patterns](#hook-patterns)

---

## Global Hooks

### `usePythonRunner`

**Location**: `src/hooks/usePythonRunner.ts`

Manages Python code execution using Pyodide (WebAssembly) in a Web Worker.

**Features**:
- ✅ Asynchronous initialization with retry logic
- ✅ 5-second execution timeout
- ✅ Output streaming (stdout, stderr, result)
- ✅ Worker lifecycle management
- ✅ Minimum spinner duration (UX improvement)

**Interface**:
```typescript
interface UsePythonRunnerReturn {
  isReady: boolean;      // Pyodide loaded and ready
  isRunning: boolean;    // Code currently executing
  isLoading: boolean;    // Pyodide loading
  output: OutputLine[];  // Accumulated output
  run: (code: string) => void;  // Execute code
  reset: () => void;     // Clear output
}

interface OutputLine {
  text: string;
  stream: 'stdout' | 'stderr' | 'result' | 'system';
}
```

**Usage Example**:
```typescript
import { usePythonRunner } from '@/hooks/usePythonRunner';

function PythonEditor() {
  const { isReady, isRunning, output, run, reset } = usePythonRunner();
  const [code, setCode] = useState('print("Hello, World!")');

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={!isReady || isRunning}
      />

      <button
        onClick={() => run(code)}
        disabled={!isReady || isRunning}
      >
        {isRunning ? 'Running...' : 'Run'}
      </button>

      <button onClick={reset}>Clear</button>

      <pre>
        {output.map((line, i) => (
          <div
            key={i}
            className={
              line.stream === 'stderr' ? 'text-red-500' :
              line.stream === 'result' ? 'text-emerald-500' :
              'text-gray-300'
            }
          >
            {line.text}
          </div>
        ))}
      </pre>
    </div>
  );
}
```

**Implementation Details**:
- **Worker Path**: `/workers/python.worker.js`
- **Timeout**: 5 seconds (kills worker and restarts)
- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Min Spinner**: 1 second (prevents flickering)

**Error Handling**:
```typescript
// Automatic retry on worker failure
worker.onerror = () => {
  if (attempt >= MAX_INIT_RETRIES) {
    // Show error after 3 attempts
    setOutput([
      { text: 'Failed to initialize Python environment', stream: 'stderr' },
    ]);
    return;
  }
  // Retry with backoff
  setTimeout(createWorker, BACKOFF_MS * 2 ** attempt);
};
```

**Best Practices**:
- Only one instance per page (singleton pattern)
- Always check `isReady` before calling `run()`
- Clear output with `reset()` between unrelated executions
- Handle timeout errors gracefully in UI

---

### `useChromeMode`

**Location**: `src/hooks/useChromeMode.ts`

Determines which UI "chrome" (layout mode) to display based on authentication, route, and session state.

**Chrome Modes**:
1. **`marketing`** - Public pages, logged out (Navbar + Footer)
2. **`app`** - Logged in, general app (Navbar only)
3. **`gate`** - Session entry point (home page in session mode)
4. **`execute`** - Full-screen session execution (timer HUD only)
5. **`exit`** - Session exit flow (review and close)
6. **`studio`** - Content creation mode (editor chrome)

**Interface**:
```typescript
type ChromeMode = 'marketing' | 'app' | 'gate' | 'execute' | 'exit' | 'studio';

function useChromeMode(): ChromeMode;

function useChromeVisibility(): {
  mode: ChromeMode;
  showNavbar: boolean;
  showFooter: boolean;
  showSessionHUD: boolean;
};
```

**Usage Example**:
```typescript
import { useChromeVisibility } from '@/hooks/useChromeMode';

function RootLayout({ children }: { children: ReactNode }) {
  const { showNavbar, showFooter, showSessionHUD } = useChromeVisibility();

  return (
    <html>
      <body>
        {showNavbar && <Navbar />}
        {showSessionHUD && <SessionHUD />}

        <main>{children}</main>

        {showFooter && <Footer />}
      </body>
    </html>
  );
}
```

**Decision Logic**:
```typescript
// Simplified logic
function useChromeMode(): ChromeMode {
  const { session, status } = useSession();
  const { state } = useSessionContext();
  const pathname = usePathname();

  // Session execution overrides
  if (state.phase === 'execution') return 'execute';
  if (state.phase === 'exit') return 'exit';
  if (pathname === '/home' && sessionMode) return 'gate';

  // Not logged in
  if (!session) {
    if (isImmersiveRoute(pathname)) return 'app';
    return 'marketing';
  }

  // Studio routes (admin/editor)
  if (isEditor && isStudioRoute(pathname)) return 'studio';

  // Default logged-in state
  return 'app';
}
```

**Routes by Mode**:
- **Studio Routes**: `/thumbnails`, `/gallery`, `/clips`, `/ai`, `/admin`
- **Immersive Routes**: `/code-editor` (no chrome)

**Best Practices**:
- Use `useChromeVisibility()` for conditional chrome rendering
- Don't call `useChromeMode()` in multiple places—use visibility hook
- Session state takes precedence over route-based detection
- Handle `status === 'loading'` to prevent flicker

---

## Feature-Specific Hooks

### `useChat`

**Location**: `src/app/ai/_components/hooks/useChat.ts`

Manages AI chat functionality including message submission, streaming, and conversation management.

**Features**:
- ✅ Streaming responses from OpenAI/Gemini
- ✅ File attachments (images, PDFs)
- ✅ Model selection (GPT-4.1, GPT-5, Gemini)
- ✅ System prompts
- ✅ Image generation mode
- ✅ Conversation persistence

**Interface**:
```typescript
interface UseChatOptions {
  currentConversationId: string | null;
  createConversation: (firstMessage: string, model: string) => Promise<string | null>;
  saveMessage: (conversationId: string, message: Message) => Promise<void>;
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
  setInput: (value: string) => void;
  setAttachments: React.Dispatch<React.SetStateAction<MessageAttachment[]>>;
  setIsPromptMenuOpen: (value: boolean) => void;
  setPromptQuery: (value: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedSystemPrompt: SystemPrompt | null;
  setSelectedSystemPrompt: (prompt: SystemPrompt | null) => void;
  submitMessage: (content: string, attachments: MessageAttachment[]) => Promise<void>;
}
```

**Usage Example**:
```typescript
import { useChat } from '@/app/ai/_components/hooks/useChat';

function ChatInterface() {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  const {
    messages,
    isLoading,
    selectedModel,
    setSelectedModel,
    submitMessage,
  } = useChat({
    currentConversationId: conversationId,
    createConversation,
    saveMessage,
    setConversations,
    setInput,
    setAttachments,
    setIsPromptMenuOpen,
    setPromptQuery,
  });

  const handleSubmit = async () => {
    await submitMessage(input, attachments);
  };

  return (
    <div>
      <ModelSelector value={selectedModel} onChange={setSelectedModel} />

      <MessageList messages={messages} />

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={isLoading}
      />

      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

**Streaming Implementation**:
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages, model }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;

      const parsed = JSON.parse(data);
      assistantMessage += parsed.content;

      // Update UI with streaming text
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: assistantMessage,
        };
        return newMessages;
      });
    }
  }
}
```

**Image Generation Mode**:
```typescript
// When model is 'gemini-3-pro-image-preview'
const isImageGeneration = selectedModel === 'gemini-3-pro-image-preview';

if (isImageGeneration) {
  const response = await fetch('/api/chat/generate-image', {
    method: 'POST',
    body: JSON.stringify({
      prompt: content,
      inputImageUrl: attachments[0]?.url, // Optional: for image editing
    }),
  });

  // Stream returns image URLs
  generatedImages.push({ id: uuid(), url: parsed.url });
}
```

**Best Practices**:
- Handle network errors gracefully
- Show loading state during streaming
- Clear input after successful send
- Persist messages to database
- Update conversation timestamps

---

### `useConversations`

**Location**: `src/app/ai/_components/hooks/useConversations.ts`

Manages chat conversation list, creation, deletion, and persistence.

**Usage Pattern**:
```typescript
const {
  conversations,
  loading,
  currentConversationId,
  setCurrentConversationId,
  createConversation,
  deleteConversation,
} = useConversations();

// Create new conversation
const conversationId = await createConversation(
  'What is React?',
  'gpt-4.1'
);

// Delete conversation
await deleteConversation(conversationId);
```

---

### `usePracticeTest`

**Location**: `src/app/practice-test/_components/usePracticeTest.ts`

Manages practice test sessions including questions, answers, timing, and scoring.

**Features**:
- Question navigation
- Answer submission
- Time tracking
- Score calculation
- Session persistence

**Usage Pattern**:
```typescript
const {
  session,
  currentQuestion,
  currentQuestionIndex,
  submitAnswer,
  nextQuestion,
  completeSession,
} = usePracticeTest(sessionId);

// Submit answer
await submitAnswer({
  questionId: currentQuestion.id,
  answer: userAnswer,
});

// Complete test
const results = await completeSession();
```

---

## Editor Hooks

### `useBlockEditorState`

**Location**: `src/components/editor/hooks/useBlockEditorState.ts`

Manages block editor state including blocks, selection, history (undo/redo).

**Features**:
- Block CRUD operations
- Selection management
- Undo/redo history
- Block reordering
- Content serialization

**Usage Pattern**:
```typescript
const {
  blocks,
  selectedBlockId,
  addBlock,
  updateBlock,
  deleteBlock,
  moveBlock,
  undo,
  redo,
  canUndo,
  canRedo,
} = useBlockEditorState(initialBlocks);

// Add new block
addBlock({
  type: 'paragraph',
  content: 'Hello, World!',
}, insertIndex);

// Update block
updateBlock(blockId, { content: 'Updated content' });

// Undo/Redo
if (canUndo) undo();
if (canRedo) redo();
```

---

### `useMediaHandlers`

**Location**: `src/components/editor/hooks/useMediaHandlers.ts`

Handles media uploads (images, videos) in the block editor.

**Features**:
- File upload to Vercel Blob
- Image URL insertion
- Upload progress
- Error handling
- File type validation

**Usage Pattern**:
```typescript
const { uploadImage, uploadVideo, isUploading } = useMediaHandlers({
  onImageInsert: (url) => insertImageBlock(url),
  onVideoInsert: (url) => insertVideoBlock(url),
});

// Upload image
await uploadImage(file);
```

---

### `useEditorShortcuts`

**Location**: `src/components/editor/hooks/useEditorShortcuts.ts`

Manages keyboard shortcuts in the block editor.

**Shortcuts**:
- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + Z`: Undo
- `Cmd/Ctrl + Shift + Z`: Redo
- `Cmd/Ctrl + K`: Insert link
- `/`: Command menu

**Usage Pattern**:
```typescript
const { handleKeyDown } = useEditorShortcuts({
  onBold: () => toggleBold(),
  onItalic: () => toggleItalic(),
  onUndo: () => undo(),
  onRedo: () => redo(),
  onCommandMenu: () => openCommandMenu(),
});

<textarea onKeyDown={handleKeyDown} />
```

---

### `useCommandMenu`

**Location**: `src/components/editor/hooks/useCommandMenu.ts`

Manages the command menu (/ menu) for quick block insertion.

**Features**:
- Fuzzy search filtering
- Keyboard navigation (arrow keys)
- Quick block insertion
- Customizable commands

**Usage Pattern**:
```typescript
const {
  isOpen,
  query,
  filteredCommands,
  selectedIndex,
  openMenu,
  closeMenu,
  setQuery,
  executeCommand,
} = useCommandMenu({
  commands: [
    { name: 'Heading', icon: 'H1', action: () => insertHeading() },
    { name: 'Code Block', icon: 'Code', action: () => insertCodeBlock() },
  ],
});

// Trigger with '/' key
if (e.key === '/') openMenu();

// Execute selected command
if (e.key === 'Enter') executeCommand(selectedIndex);
```

---

## Context Hooks

### `useVideoContext`

**Location**: `src/context/VideoContext.tsx`

Provides video pagination state across the app. Used for infinite scroll on videos page.

**Context Value**:
```typescript
interface VideoContextState {
  videos: YouTubeVideo[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  isInitialized: boolean;
  loadMoreVideos: () => Promise<void>;
  initializeState: (initialVideos: YouTubeVideo[], initialHasMore: boolean) => void;
}
```

**Provider Setup**:
```typescript
// In layout or page
<VideoProvider channelId={CHANNEL_ID} initialLoadLimit={24}>
  <VideoGallery />
</VideoProvider>
```

**Usage in Components**:
```typescript
import { useVideoContext } from '@/context/VideoContext';

function VideoGallery() {
  const { videos, loading, hasMore, loadMoreVideos } = useVideoContext();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMoreVideos();
      }
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMoreVideos]);

  return (
    <div>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
      {loading && <Spinner />}
      <div ref={sentinelRef} />
    </div>
  );
}
```

**Best Practices**:
- Initialize state on mount with server-fetched data
- Prevent duplicate fetches with `isFetchingRef`
- Handle both `/videos` and `/mocks` routes
- Update `hasMore` when reaching end

---

### `useSessionContext`

**Location**: `src/contexts/SessionContext.tsx`

Manages learning session state (entry → execution → exit flow).

**Session Phases**:
1. **`idle`** - No active session
2. **`entry`** - Session entry point (scope selected, pre-execution)
3. **`execution`** - Active session (timer running)
4. **`exit`** - Session complete (review results)

**Context Value**:
```typescript
interface SessionState {
  phase: 'idle' | 'entry' | 'execution' | 'exit';
  scope: SessionScope | null;
  execution: SessionExecutionState | null;
  exit: SessionExitState | null;
  transitionStatus: 'ready' | 'advancing' | 'finalizing';
}

interface SessionActions {
  commitSession: (scope: SessionScope) => void;
  advanceItem: () => void;
  completeSession: () => void;
  abandonSession: () => void;
  resetToEntry: () => void;
}
```

**Usage Pattern**:
```typescript
import { useSession } from '@/contexts/SessionContext';

function SessionFlow() {
  const { state, commitSession, completeSession, abandonSession } = useSession();

  if (state.phase === 'entry') {
    return <ContentSelector onSelect={commitSession} />;
  }

  if (state.phase === 'execution') {
    return (
      <ExecutionMode
        session={state.execution}
        onComplete={completeSession}
        onAbandon={abandonSession}
      />
    );
  }

  if (state.phase === 'exit') {
    return <SessionReview onExit={exitSession} />;
  }

  return <HomePage />;
}
```

---

## Hook Patterns

### State Management Pattern

```typescript
// Simple state hook
function useFeature() {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAction = async (data: Data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(data);
      setState(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { state, loading, error, performAction };
}
```

### Async Data Fetching Pattern

```typescript
function useAsyncData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true; // Prevent state updates after unmount
    };
  }, [fetcher]);

  return { data, loading, error };
}
```

### Cleanup Pattern

```typescript
function useResource() {
  const resourceRef = useRef<Resource | null>(null);

  useEffect(() => {
    // Initialize resource
    resourceRef.current = createResource();

    // Cleanup on unmount
    return () => {
      resourceRef.current?.destroy();
      resourceRef.current = null;
    };
  }, []);

  return resourceRef.current;
}
```

### Debounce Pattern

```typescript
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const searchQuery = useDebouncedValue(input, 300);
```

---

## Creating New Hooks

### Checklist

When creating a new custom hook:

- [ ] Name starts with `use` (React convention)
- [ ] Returns consistent interface (object, not array if >2 values)
- [ ] Handles loading and error states
- [ ] Cleans up side effects (timers, subscriptions, listeners)
- [ ] Uses `useCallback` for stable function references
- [ ] Uses `useMemo` for expensive computations
- [ ] Documents interface with TypeScript
- [ ] Adds JSDoc comments for public API
- [ ] Includes usage example in this file
- [ ] Tests edge cases (unmount, rapid calls, etc.)

### Template

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * Brief description of what this hook does.
 *
 * @param param1 - Description
 * @returns Object with state and actions
 *
 * @example
 * ```tsx
 * const { data, loading, refresh } = useMyHook(config);
 * ```
 */
export function useMyHook(config: Config) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(config);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
```

---

## Testing Hooks

### React Testing Library Pattern

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

test('should fetch data on mount', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useMyHook({ id: '123' })
  );

  expect(result.current.loading).toBe(true);

  await waitForNextUpdate();

  expect(result.current.loading).toBe(false);
  expect(result.current.data).toBeDefined();
});

test('should handle errors', async () => {
  // Mock fetch to throw error
  global.fetch = jest.fn(() => Promise.reject(new Error('Failed')));

  const { result, waitForNextUpdate } = renderHook(() =>
    useMyHook({ id: '123' })
  );

  await waitForNextUpdate();

  expect(result.current.error).toBeDefined();
  expect(result.current.error?.message).toBe('Failed');
});
```

---

## Related Documentation

- **Component Patterns**: See `docs/EXAMPLES.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **API Routes**: See `docs/API.md`

---

**Last Updated**: 2026-02-14
**Maintained By**: Project team
