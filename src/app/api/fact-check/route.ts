import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a YouTube video fact-checker. You will be given a video transcript. Your job is to:
1. Identify any statements that are factually incorrect or need clarification
2. For each issue, provide:
   - The timestamp where it occurred
   - What was said
   - Why it's incorrect or needs clarification
   - The correct information
Present your findings in chronological order by timestamp. If no issues are found, state that the content appears accurate. Focus on factual errors rather than opinions or subjective statements.
`;


export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-5-2025-08-07",
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: text
                }
            ],
            // temperature: 0.7,
            // max_tokens: 500
        });

        const factCheckResults = completion.choices[0].message.content;

        return NextResponse.json({ results: factCheckResults });
    } catch (error) {
        console.error('Error in fact-check API:', error);
        return NextResponse.json(
            { error: 'Failed to check facts' },
            { status: 500 }
        );
    }
}
