import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

interface MessageAttachment {
    id: string;
    type: 'image' | 'pdf';
    url?: string;
    file_id?: string;
    name: string;
    size: number;
}

interface IncomingMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: MessageAttachment[];
}

type ContentPart =
    | { type: 'input_text'; text: string }
    | { type: 'input_image'; image_url: string }
    | { type: 'input_file'; file_id: string };

type TransformedMessage =
    | { role: 'user' | 'assistant' | 'system'; content: string }
    | { role: 'user'; content: ContentPart[] };

export async function POST(req: NextRequest) {
    try {
        const { messages, model = 'gpt-4o-mini' } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Messages array is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Transform messages to support vision and file inputs for the Responses API
        const transformedMessages: TransformedMessage[] = messages.map((msg: IncomingMessage): TransformedMessage => {
            if (msg.attachments && msg.attachments.length > 0) {
                const content: ContentPart[] = [];

                if (msg.content) {
                    content.push({
                        type: 'input_text',
                        text: msg.content,
                    });
                }

                msg.attachments.forEach((attachment: MessageAttachment) => {
                    if (attachment.type === 'image' && attachment.url) {
                        content.push({
                            type: 'input_image',
                            image_url: attachment.url,
                        });
                    } else if (attachment.type === 'pdf' && attachment.file_id) {
                        content.push({
                            type: 'input_file',
                            file_id: attachment.file_id,
                        });
                    }
                });

                return {
                    role: 'user',
                    content,
                };
            }

            return {
                role: msg.role,
                content: msg.content,
            };
        });

        const stream = await openai.responses.create({
            model: model,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            input: transformedMessages as any,
            stream: true,
            max_output_tokens: 2000,
        });

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of stream) {
                        if (event.type === 'response.output_text.delta' && 'delta' in event && event.delta) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content: event.delta })}\n\n`)
                            );
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(customStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error in chat API:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

