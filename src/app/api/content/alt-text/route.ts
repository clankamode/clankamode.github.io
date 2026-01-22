import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getToken } from 'next-auth/jwt';
import { UserRole, hasRole } from '@/types/roles';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIResponseContent {
  text?: string;
}

interface OpenAIResponseItem {
  content?: OpenAIResponseContent[];
}

interface OpenAIResponse {
  output_text?: string;
  output?: OpenAIResponseItem[];
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    if (!token || !hasRole(effectiveRole, UserRole.EDITOR)) {
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
      model: 'gpt-4o-mini',
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
      max_output_tokens: 120,
    });

    const outputText =
      (response as OpenAIResponse).output_text ??
      ((response as OpenAIResponse).output ?? [])
        .flatMap((item) => item.content ?? [])
        .map((item) => item.text || '')
        .join(' ')
        .trim();

    return NextResponse.json({ altText: outputText || null });
  } catch (error) {
    console.error('Error generating alt text:', error);
    return NextResponse.json({ error: 'Failed to generate alt text' }, { status: 500 });
  }
}
