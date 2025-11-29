import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';
import mime from 'mime';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

export const runtime = 'nodejs';

interface ImageGenerationRequest {
  prompt: string;
  imageSize?: '1K' | '2K' | '4K';
  conversationId?: string;
  inputImageUrl?: string; // For image editing
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, imageSize = '1K', inputImageUrl }: ImageGenerationRequest = await req.json();

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const tools = [
      {
        googleSearch: {},
      },
    ];

    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        imageSize,
      },
      tools,
    };

    const model = 'gemini-3-pro-image-preview';

    // Build the parts array for the user message
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    // Add the text prompt
    parts.push({
      text: prompt,
    });

    // If there's an input image, fetch it and add it to the request
    if (inputImageUrl) {
      try {
        const imageResponse = await fetch(inputImageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch input image');
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        parts.push({
          inlineData: {
            mimeType: contentType,
            data: base64Image,
          },
        });
      } catch (error) {
        console.error('Error fetching input image:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to process input image' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const contents = [
      {
        role: 'user',
        parts,
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          let fileIndex = 0;

          for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
              continue;
            }

            // Check if this chunk contains an image
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
              const inlineData = chunk.candidates[0].content.parts[0].inlineData;
              const fileExtension = mime.getExtension(inlineData.mimeType || '');
              const buffer = Buffer.from(inlineData.data || '', 'base64');

              // Upload to Vercel Blob using put (server-side)
              const fileName = `chat-images/generated-${Date.now()}-${fileIndex++}.${fileExtension}`;
              const blob = await put(fileName, buffer, {
                access: 'public',
                contentType: inlineData.mimeType || 'image/png',
              });

              // Send image URL as SSE event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'image',
                    url: blob.url,
                    mimeType: inlineData.mimeType,
                  })}\n\n`
                )
              );
            } else if (chunk.text) {
              // Send text content as SSE event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'text',
                    content: chunk.text,
                  })}\n\n`
                )
              );
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in image generation stream:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
          controller.close();
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
    console.error('Error in image generation API:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate image',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

