import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getEffectiveIdentityFromToken } from '@/lib/auth-identity';
import { buildTutorSystemPrompt } from '@/lib/tutor-prompt';
import { extractArticleContext } from '@/lib/article-context';
import { getLearningArticleBySlugGlobal } from '@/lib/content';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { UserRole, hasRole } from '@/types/roles';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TutorRequestBody {
  articleSlug?: string;
  message?: string;
  conversationId?: number | string;
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
  messages: StoredTutorMessage[];
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const tutorRateLimitByUser = new Map<number, number[]>();

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

function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const existingTimestamps = tutorRateLimitByUser.get(userId) ?? [];
  const recentTimestamps = existingTimestamps.filter((timestamp) => timestamp > windowStart);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    tutorRateLimitByUser.set(userId, recentTimestamps);
    return true;
  }

  recentTimestamps.push(now);
  tutorRateLimitByUser.set(userId, recentTimestamps);
  return false;
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
    const articleSlug = body.articleSlug?.trim();
    const message = body.message?.trim();

    if (!articleSlug) {
      return NextResponse.json({ error: 'articleSlug is required' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const includeDrafts = !!effectiveRole && hasRole(effectiveRole, UserRole.EDITOR);
    const article = await getLearningArticleBySlugGlobal(articleSlug, includeDrafts);

    if (!article) {
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
    if (isRateLimited(userId)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const resolvedConversationId = normalizeConversationId(body.conversationId);

    let conversationId = resolvedConversationId;
    let existingMessages: StoredTutorMessage[] = [];

    if (conversationId) {
      const { data: conversation, error: conversationError } = await admin
        .from('TutorConversations')
        .select('id, user_id, article_id, messages')
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
      if (row.article_id !== article.id) {
        return NextResponse.json({ error: 'Conversation does not belong to this article' }, { status: 400 });
      }
      existingMessages = coerceMessages(row.messages);
    }

    const articleContext = extractArticleContext(article);
    const systemPrompt = buildTutorSystemPrompt({
      articleTitle: articleContext.title,
      articleSummary: articleContext.summary,
      codeBlocks: articleContext.codeBlocks,
      keyConcepts: articleContext.keyConcepts,
      checklistProgress: 0,
      sessionElapsedMs: 0,
      userRole: effectiveRole,
    });

    const userMessage: StoredTutorMessage = {
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };

    const persistedMessagesBeforeAssistant = [...existingMessages, userMessage];

    if (conversationId) {
      const { error: updateError } = await admin
        .from('TutorConversations')
        .update({
          messages: persistedMessagesBeforeAssistant,
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
          article_id: article.id,
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
