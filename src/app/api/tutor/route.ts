import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';
import { buildTutorSystemPrompt, buildPracticeSystemPrompt } from '@/lib/tutor-prompt';
import { extractArticleContext } from '@/lib/article-context';
import { getUserLearningContext } from '@/lib/user-learning-context';
import { getLearningArticleBySlugGlobal } from '@/lib/content';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { UserRole, hasRole } from '@/types/roles';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PracticeContextBody {
  questionName: string;
  questionPrompt: string;
  difficulty: string;
  category: string | null;
  pattern: string | null;
  currentCode: string;
  testResults: Array<{ id: number; passed: boolean; error?: string }> | null;
}

interface TutorRequestBody {
  articleSlug?: string;
  message?: string;
  conversationId?: number | string;
  checklistProgress?: number;
  sessionElapsedMs?: number;
  sessionId?: string | null;
  currentChecklistItem?: string;
  practiceContext?: PracticeContextBody;
}

interface StoredTutorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface TutorConversationRow {
  id: number;
  user_id: number;
  article_id: string | null;
  session_uuid?: string | null;
  messages: StoredTutorMessage[];
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function normalizeConversationId(value: number | string | undefined): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function normalizeChecklistProgress(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeSessionElapsedMs(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeSessionUuid(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeChecklistItem(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function coerceMessages(value: unknown): StoredTutorMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is StoredTutorMessage => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<StoredTutorMessage>;
      return (
        (candidate.role === 'user' || candidate.role === 'assistant' || candidate.role === 'system')
        && typeof candidate.content === 'string'
        && typeof candidate.created_at === 'string'
      );
    });
}

async function isRateLimited(admin: ReturnType<typeof getSupabaseAdminClient>, userId: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from('TutorConversations')
    .select('messages')
    .eq('user_id', userId)
    .gte('updated_at', windowStart);

  if (error) {
    // Fail open — don't block users if rate limit check fails
    console.error('[api/tutor] rate limit check failed:', error);
    return false;
  }

  const requestCount = (data ?? []).reduce((total, row) => {
    const messages = coerceMessages((row as { messages?: unknown }).messages);
    return total + messages.filter((entry) => (
      entry.role === 'user' && entry.created_at >= windowStart
    )).length;
  }, 0);

  return requestCount >= RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !isFeatureEnabled(FeatureFlags.AI_TUTOR, { role: effectiveRole })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
    }

    const body = (await req.json()) as TutorRequestBody;
    const {
      articleSlug,
      message,
      conversationId: rawConversationId,
      checklistProgress,
      sessionElapsedMs,
      sessionId,
      currentChecklistItem,
      practiceContext,
    } = body;
    const normalizedArticleSlug = articleSlug?.trim();
    const normalizedMessage = message?.trim();
    const isPractice = !!practiceContext;

    if (!isPractice && !normalizedArticleSlug) {
      return NextResponse.json({ error: 'articleSlug is required' }, { status: 400 });
    }

    if (!normalizedMessage) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    if (normalizedMessage.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const includeDrafts = !!effectiveRole && hasRole(effectiveRole, UserRole.EDITOR);
    const article = isPractice
      ? null
      : await getLearningArticleBySlugGlobal(normalizedArticleSlug!, includeDrafts);

    if (!isPractice && !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const admin = getSupabaseAdminClient();
    const { data: user, error: userError } = await admin
      .from('Users')
      .select('id')
      .eq('email', identity.email)
      .single();

    if (userError || !user?.id) {
      console.error('[api/tutor] failed to resolve user:', userError);
      return NextResponse.json({ error: 'Failed to resolve user identity' }, { status: 400 });
    }

    const userId = user.id as number;
    if (await isRateLimited(admin, userId)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const resolvedConversationId = normalizeConversationId(rawConversationId);
    const resolvedChecklistProgress = normalizeChecklistProgress(checklistProgress);
    const resolvedSessionElapsedMs = normalizeSessionElapsedMs(sessionElapsedMs);
    const resolvedSessionUuid = normalizeSessionUuid(sessionId);
    const resolvedChecklistItem = normalizeChecklistItem(currentChecklistItem);

    let conversationId = resolvedConversationId;
    let existingMessages: StoredTutorMessage[] = [];

    if (conversationId) {
      const { data: conversation, error: conversationError } = await admin
        .from('TutorConversations')
        .select('id, user_id, article_id, session_uuid, messages')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (conversationError || !conversation) {
        if (conversationError?.code === 'PGRST116') {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }
        console.error('[api/tutor] failed to load conversation:', conversationError);
        return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
      }

      const row = conversation as unknown as TutorConversationRow;
      if (isPractice) {
        if (row.article_id !== null) {
          return NextResponse.json({ error: 'Conversation context mismatch' }, { status: 400 });
        }
      } else {
        if (row.article_id !== article!.id) {
          return NextResponse.json({ error: 'Conversation does not belong to this article' }, { status: 400 });
        }
      }
      existingMessages = coerceMessages(row.messages);
    }

    let systemPrompt: string;
    if (isPractice) {
      systemPrompt = buildPracticeSystemPrompt({
        questionName: practiceContext!.questionName,
        questionPrompt: practiceContext!.questionPrompt,
        difficulty: practiceContext!.difficulty,
        category: practiceContext!.category,
        pattern: practiceContext!.pattern,
        currentCode: practiceContext!.currentCode,
        testResults: practiceContext!.testResults,
        userRole: effectiveRole,
      });
    } else {
      const articleContext = extractArticleContext(article!);
      const userLearningContext = await getUserLearningContext(
        identity.email,
        articleContext.keyConcepts,
      );
      systemPrompt = buildTutorSystemPrompt({
        articleTitle: articleContext.title,
        articleSummary: articleContext.summary,
        codeBlocks: articleContext.codeBlocks,
        keyConcepts: articleContext.keyConcepts,
        articleSections: articleContext.sections,
        checklistProgress: resolvedChecklistProgress,
        sessionElapsedMs: resolvedSessionElapsedMs,
        checklistItem: resolvedChecklistItem,
        userRole: effectiveRole,
        userLearningContext,
      });
    }

    const userMessage: StoredTutorMessage = {
      role: 'user',
      content: normalizedMessage,
      created_at: new Date().toISOString(),
    };

    const persistedMessagesBeforeAssistant = [...existingMessages, userMessage];

    if (conversationId) {
      const { error: updateError } = await admin
        .from('TutorConversations')
        .update({
          messages: persistedMessagesBeforeAssistant,
          session_uuid: resolvedSessionUuid ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[api/tutor] failed to update conversation:', updateError);
        return NextResponse.json({ error: 'Failed to persist user message' }, { status: 500 });
      }
    } else {
      const { data: createdConversation, error: createError } = await admin
        .from('TutorConversations')
        .insert({
          user_id: userId,
          article_id: isPractice ? null : article!.id,
          session_uuid: resolvedSessionUuid,
          messages: persistedMessagesBeforeAssistant,
        })
        .select('id')
        .single();

      if (createError || !createdConversation?.id) {
        console.error('[api/tutor] failed to create conversation:', createError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      conversationId = createdConversation.id as number;
    }

    const model = process.env.OPENAI_TUTOR_MODEL || 'gpt-5-nano';
    const existingMessagesForModel = existingMessages
      .filter((entry) => entry.role === 'user' || entry.role === 'assistant')
      .slice(-20);

    const completionStream = await openai.responses.create({
      model,
      stream: true,
      input: [
        { role: 'system', content: systemPrompt },
        ...existingMessagesForModel.map((entry) => ({ role: entry.role, content: entry.content })),
        { role: 'user', content: userMessage.content },
      ],
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let assistantText = '';
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId })}\n\n`));

          for await (const event of completionStream) {
            if (event.type === 'response.output_text.delta') {
              const delta = event.delta;
              if (!delta) continue;

              assistantText += delta;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
              continue;
            }

            if (event.type === 'error') {
              throw new Error(event.message || 'OpenAI stream error');
            }

            if (event.type === 'response.completed') {
              break;
            }
          }

          const assistantMessage: StoredTutorMessage = {
            role: 'assistant',
            content: assistantText.trim(),
            created_at: new Date().toISOString(),
          };

          const finalMessages = [...persistedMessagesBeforeAssistant, assistantMessage];
          const { error: finalizeError } = await admin
            .from('TutorConversations')
            .update({
              messages: finalMessages,
              session_uuid: resolvedSessionUuid ?? undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId)
            .eq('user_id', userId);

          if (finalizeError) {
            console.error('[api/tutor] failed to persist assistant message:', finalizeError);
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          console.error('[api/tutor] stream error:', streamError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[api/tutor] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
