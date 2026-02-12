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

        const { content, currentSummary } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ summary: 'OpenAI API key not configured' }, { status: 500 });
        }

        const prompt = currentSummary
            ? `Rewrite this card teaser for the following article. Keep it under 120 characters, hook-focused, not a summary. Do not use em-dashes (—). Current teaser: "${currentSummary}"`
            : 'Write a short card teaser (under 120 characters) that hooks readers into clicking this article. Focus on the key insight or benefit, not a summary. Do not start with "Learn", "Discover", or "This article". Do not use em-dashes (—).';

        const response = await openai.responses.create({
            model: 'gpt-5-nano',
            input: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: prompt,
                        },
                        {
                            type: 'input_text',
                            text: content,
                        },
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

        return NextResponse.json({ summary: outputText?.trim() || null });
    } catch (error) {
        console.error('Error generating summary:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
