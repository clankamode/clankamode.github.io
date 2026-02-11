import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type { FileSearchTool } from 'openai/resources/responses/responses';
import { supabase } from '@/lib/supabase';

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

interface VideoRow {
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    date_uploaded: string;
}

interface VideoSuggestion {
    title: string;
    url: string;
    description?: string;
    thumbnail?: string | null;
}

type ContentPart =
    | { type: 'input_text'; text: string }
    | { type: 'input_image'; image_url: string; detail: 'auto' | 'low' | 'high' }
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

        const recentUserText = (messages as IncomingMessage[])
            .filter(msg => msg.role === 'user' && msg.content)
            .slice(-3)
            .map(msg => msg.content)
            .join(' ');

        const relevantVideos = await getRelevantVideos(recentUserText);

        const ragTools = buildRagTools();

        const guidanceMessage: TransformedMessage = {
            role: 'system',
            content: buildVideoGuidancePrompt(relevantVideos),
        };

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
                            detail: 'auto',
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
            input: [guidanceMessage, ...transformedMessages],
            stream: true,
            max_output_tokens: 2000,
            ...(ragTools ? { tools: ragTools } : {}),
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

function buildRagTools(): FileSearchTool[] | undefined {
    const vectorStoreId = process.env.OPENAI_VIDEO_VECTOR_STORE_ID;

    if (!vectorStoreId) return undefined;

    return [
        {
            type: 'file_search',
            vector_store_ids: [vectorStoreId],
            max_num_results: 8,
        },
    ];
}

function buildVideoGuidancePrompt(videos: VideoSuggestion[]): string {
    if (videos.length === 0) {
        return [
            'You are a helpful AI assistant for my personal website.',
            'If the user asks about topics I have covered in videos, you should ask if they would like a related video recommendation.',
            'If a vector store is attached, use file_search to ground your suggestions before responding.',
            'Only suggest a video when you have an exact match from the provided list. Never make up URLs or titles.',
        ].join(' ');
    }

    const list = videos
        .map(video => `- ${video.title} — ${video.url}`)
        .join('\n');

    return [
        'You are a helpful AI assistant for my personal website.',
        'After answering the user, include a short "Related videos" section with bullet points when the topic aligns with the provided videos.',
        'IMPORTANT: When listing videos, you MUST use this exact format for each video:',
        '  - [Full Video Title] — [Complete YouTube URL]',
        'Example: - Interviewing Software Engineers Live | Episode 6 — https://www.youtube.com/watch?v=gB50QT8lbZU',
        'Always include the complete video title and the full YouTube URL (starting with https://www.youtube.com/watch?v=) for each video.',
        'Only use the videos in the list below; never invent URLs, titles, or promises about unseen content.',
        'If a vector store is attached, call file_search to ground the answer before recommending.',
        'Relevant videos you can recommend:',
        list,
    ].join('\n');
}

function extractSearchTerms(text: string): string[] {
    return Array.from(
        new Set(
            text
                .toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter(token => token.length > 3)
        )
    ).slice(0, 5);
}

async function getRelevantVideos(searchText: string, limit = 3): Promise<VideoSuggestion[]> {
    if (!searchText?.trim()) return [];

    const terms = extractSearchTerms(searchText);
    if (terms.length === 0) return [];

    const orFilters = terms
        .map(term => `title.ilike.%${term}%,description.ilike.%${term}%`)
        .join(',');

    const { data, error } = await supabase
        .from('Videos')
        .select('id, title, description, thumbnail, date_uploaded')
        .or(orFilters)
        .order('date_uploaded', { ascending: false })
        .limit(30);

    if (error || !data) {
        console.error('Error fetching relevant videos:', error);
        return [];
    }

    const scoredVideos = (data as VideoRow[])
        .map(video => {
            const haystack = `${video.title} ${video.description}`.toLowerCase();
            const score = terms.reduce(
                (count, term) => count + (haystack.includes(term) ? 1 : 0),
                0
            );

            return { video, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.video.date_uploaded).getTime() - new Date(a.video.date_uploaded).getTime();
        })
        .slice(0, limit);

    return scoredVideos.map(({ video }) => ({
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        description: video.description,
        thumbnail: video.thumbnail,
    }));
}

