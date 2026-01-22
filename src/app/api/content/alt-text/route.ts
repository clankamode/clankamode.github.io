import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { UserRole } from '@/types/roles';
import { requireAuth } from '@/lib/auth-helpers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(req: NextRequest) {
  try {
    const token = await requireAuth(req, UserRole.EDITOR);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const url = typeof body?.url === 'string' ? body.url : '';

    if (!url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ altText: null }, { status: 200 });
    }

    const response = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Write concise, descriptive alt text (max 16 words). Avoid “image of”.',
            },
            { type: 'input_image', image_url: url, detail: 'auto' },
          ],
        },
      ],
      max_output_tokens: 2000,
    });

    let outputText = (response as OpenAIResponse).output_text;

    if (!outputText) {
      const output = (response as OpenAIResponse).output ?? [];
      for (const item of output) {
        if (item.type === 'message' && item.content) {
          const textContent = item.content
            .filter((c) => c.type === 'output_text' && c.text)
            .map((c) => c.text)
            .join(' ')
            .trim();
          if (textContent) {
            outputText = textContent;
            break;
          }
        }
        if (item.content) {
          const text = item.content
            .map((c) => c.text || '')
            .join(' ')
            .trim();
          if (text) {
            outputText = text;
            break;
          }
        }
      }
    }

    return NextResponse.json({ altText: outputText?.trim() || null });
  } catch (error) {
    console.error('Error generating alt text:', error);
    return NextResponse.json({ error: 'Failed to generate alt text' }, { status: 500 });
  }
}
