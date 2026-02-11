import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { UserRole } from '@/types/roles';
import { requireAuth } from '@/lib/auth-helpers';

interface OpenAIResponseContent {
  type?: string;
  text?: string;
}

interface OpenAIResponseItem {
  type?: string;
  content?: OpenAIResponseContent[];
}

interface OpenAIResponse {
  output_text?: string;
  output?: OpenAIResponseItem[];
}

function extractOutputText(response: OpenAIResponse): string | null {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  const output = response.output ?? [];
  for (const item of output) {
    if (!item.content?.length) {
      continue;
    }

    const textContent = item.content
      .filter((content) => content.type === 'output_text' && content.text)
      .map((content) => content.text)
      .join(' ')
      .trim();

    if (textContent) {
      return textContent;
    }

    const fallback = item.content
      .map((content) => content.text || '')
      .join(' ')
      .trim();

    if (fallback) {
      return fallback;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const token = await requireAuth(req, UserRole.EDITOR);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { transcript, existingBody } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are a technical content editor. Turn rough spoken notes into a polished markdown blog post that keeps the speaker\'s tone, examples, and intent. Output only markdown with a clear title, intro, section headings, and a practical takeaway section. Do not use em dashes. Keep code snippets if implied by transcript.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Spoken transcript:\n${transcript}`,
            },
            {
              type: 'input_text',
              text: existingBody
                ? `Current draft context (use only if useful):\n${existingBody}`
                : 'There is no existing draft context.',
            },
          ],
        },
      ],
      max_output_tokens: 4000,
    });

    const draft = extractOutputText(response as OpenAIResponse);

    if (!draft) {
      return NextResponse.json({ error: 'Model returned no draft text' }, { status: 502 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error generating voice draft:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}

