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
    const { body, instruction } = await req.json();

    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'Article body is required' }, { status: 400 });
    }

    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      return NextResponse.json({ error: 'Update instruction is required' }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `You are a technical content editor. You will receive the current article body (markdown with optional block syntax: /code, /callout, /diagram, /embed, /image, /divider) and an instruction for how to update it. Output ONLY the full revised article body as markdown. Preserve all block syntax and structure unless the instruction asks to change it. Do not add commentary or explanations. Do not use em dashes.`,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Current article body:\n\n${body}`,
            },
            {
              type: 'input_text',
              text: `Instruction: ${instruction.trim()}`,
            },
          ],
        },
      ],
      max_output_tokens: 8000,
    });

    const proposedBody = extractOutputText(response as OpenAIResponse);

    if (!proposedBody) {
      return NextResponse.json({ error: 'Model returned no proposed content' }, { status: 502 });
    }

    return NextResponse.json({ proposedBody });
  } catch (error) {
    console.error('Error generating article update:', error);
    return NextResponse.json({ error: 'Failed to generate update' }, { status: 500 });
  }
}
