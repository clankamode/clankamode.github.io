import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { ThumbnailSuggestionStatus } from '@/types/ThumbnailJob';

const TABLE_NAME = 'ThumbnailJob';
const HEADSHOT_TABLE = 'HeadShots';
const SUGGESTION_COUNT = 2;

type PathParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  const { id } = await params;

  // Get the job to verify it exists and get the video title
  const { data: job, error: jobError } = await supabase
    .from(TABLE_NAME)
    .select('id, video_title, suggested_thumbnails')
    .eq('id', id)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: 'Thumbnail job not found' },
      { status: 404 }
    );
  }

  // Get available headshots
  const { data: headshots } = await supabase
    .from(HEADSHOT_TABLE)
    .select('url, created_at')
    .order('created_at', { ascending: false });

  const headshotUrls = (headshots || []).map((item) => item.url).filter(Boolean);

  if (headshotUrls.length === 0) {
    return NextResponse.json(
      { error: 'No headshots available. Please upload headshots first.' },
      { status: 400 }
    );
  }

  // Set status to generating before starting background task
  await supabase
    .from(TABLE_NAME)
    .update({ 
      thumbnail_suggestion_status: ThumbnailSuggestionStatus.GENERATING,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  // Generate suggestions in background and return immediately
  generateThumbnailSuggestions(job.id, job.video_title, headshotUrls).catch(
    async (suggestionError) => {
      console.error('Failed to generate thumbnail suggestions:', suggestionError);
      // Set status to failed on error
      await supabase
        .from(TABLE_NAME)
        .update({ 
          thumbnail_suggestion_status: ThumbnailSuggestionStatus.FAILED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  );

  return NextResponse.json({
    message: 'Generating suggestions...',
    jobId: job.id,
    status: ThumbnailSuggestionStatus.GENERATING,
  });
}

async function generateThumbnailSuggestions(
  jobId: string,
  videoTitle: string,
  headshotUrls: string[]
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI({ apiKey });
  const selectedHeadshots = selectHeadshots(headshotUrls, SUGGESTION_COUNT);

  if (selectedHeadshots.length === 0) {
    return;
  }

  const imageUrls: string[] = [];

  for (const headshotUrl of selectedHeadshots) {
    const prompt = buildThumbnailPrompt(videoTitle);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: '2K',
        },
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: await fetchImageInlineData(headshotUrl),
            },
          ],
        },
      ],
    });

    const inlineData = response?.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData
    )?.inlineData;
    if (!inlineData?.data) {
      continue;
    }

    const buffer = Buffer.from(inlineData.data, 'base64');
    const fileExtension = inlineData.mimeType?.split('/')[1] || 'png';
    const fileName = `thumbnail-suggestions/${jobId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;
    const { put } = await import('@vercel/blob');

    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType: inlineData.mimeType || 'image/png',
    });

    imageUrls.push(blob.url);
  }

  if (imageUrls.length > 0) {
    await supabase
      .from(TABLE_NAME)
      .update({
        suggested_thumbnails: imageUrls,
        thumbnail_suggestion_status: ThumbnailSuggestionStatus.COMPLETED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } else {
    // No images generated, mark as failed
    await supabase
      .from(TABLE_NAME)
      .update({ 
        thumbnail_suggestion_status: ThumbnailSuggestionStatus.FAILED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

function selectHeadshots(headshotUrls: string[], count: number) {
  const uniqueUrls = headshotUrls.filter(Boolean);
  if (uniqueUrls.length === 0) {
    return [];
  }

  const shuffled = [...uniqueUrls];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected: string[] = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(shuffled[i % shuffled.length]);
  }

  return selected;
}

async function fetchImageInlineData(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch headshot image');
  }

  const imageBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';

  return {
    mimeType: contentType,
    data: base64Image,
  };
}

function buildThumbnailPrompt(videoTitle: string): string {
  return `
Create a high-CTR YouTube thumbnail optimized for tech/coding interview content.

VIDEO TITLE: "${videoTitle}"

SUBJECT REQUIREMENTS:
- Use the provided headshot as the subject
- The headshot has a green background; REPLACE it completely with the new background
- CRITICAL: Preserve the subject's face EXACTLY as provided — do NOT alter, warp, or regenerate facial features
- CRITICAL: Maintain the subject's original proportions, skin tone, and facial structure
- CRITICAL: Do NOT apply color grading, tints, or filters to the subject — keep their natural colors intact
- Position subject on the left or right third of the frame (not dead center)
- Sharp lighting with high contrast
- Subject should look confident, intense, and authoritative
- Keep the subject ultra-sharp and prominent

BACKGROUND & STYLE:
- Be creative! Design a unique, scroll-stopping background optimized for maximum CTR
- Use dark gradients (black, deep blue, purple) with dramatic lighting and subtle tech textures
- Add high-contrast color accents (neon blue, green, yellow, or red) that pop against the dark background
- Include a visual metaphor relevant to the video topic (e.g., rating graphs, code snippets, arrows, ladders, checkmarks, tech icons)
- If relevant to the title, include recognizable tech logos (Meta, Google, LeetCode, Codeforces) but keep them subtle and secondary
- Create visual tension and energy — this should feel premium and high-stakes

COMPOSITION RULES:
- 16:9 aspect ratio, YouTube thumbnail dimensions
- Clean, bold, NOT cluttered — must be readable on mobile
- Leave space for bold text overlay (DO NOT add text yourself)
- High contrast throughout
- Professional, modern, ultra-sharp quality

WHAT TO AVOID:
- No cluttered backgrounds
- No other people
- No flat or washed-out lighting
- DO NOT modify, distort, or regenerate the subject's face or body
- DO NOT change the subject's identity, features, or appearance in any way
- DO NOT apply color casts, tints, or color grading to the subject's skin or clothing

GOAL: Create a thumbnail that immediately answers "Why should I click this instead of everything else?" for ambitious software engineers targeting Meta/Google/competitive programming roles.
`.trim();
}
