import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { UserRole, hasRole } from "@/types/roles";
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { ThumbnailJobStatus, ThumbnailSuggestionStatus } from '@/types/ThumbnailJob';

const TABLE_NAME = 'ThumbnailJob';
const HEADSHOT_TABLE = 'HeadShots';
const SUGGESTION_COUNT = 3;

type PathParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userRole || !hasRole(userRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

  await supabase
    .from(TABLE_NAME)
    .update({
      thumbnail_suggestion_status: ThumbnailSuggestionStatus.GENERATING,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  generateThumbnailSuggestions(job.id, job.video_title, headshotUrls).catch(
    async (suggestionError) => {
      console.error('Failed to generate thumbnail suggestions:', suggestionError);
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
  const overlayText = buildOverlayText(videoTitle);
  const inspirationThumbnail = await fetchInspirationThumbnail(jobId);
  const inspirationPrompt = inspirationThumbnail
    ? buildThumbnailPromptWithInspiration(videoTitle)
    : buildThumbnailPrompt(videoTitle);

  if (selectedHeadshots.length === 0) {
    return;
  }

  const suggestionPlans = [
    {
      prompt: inspirationPrompt,
      includeInspiration: Boolean(inspirationThumbnail),
    },
    {
      prompt: buildThumbnailPromptWithText(videoTitle, overlayText),
      includeInspiration: false,
    },
    {
      prompt: buildThumbnailPrompt(videoTitle),
      includeInspiration: false,
    },
  ];

  const imageUrls: string[] = [];

  for (let i = 0; i < suggestionPlans.length; i += 1) {
    const headshotUrl = selectedHeadshots[i % selectedHeadshots.length];
    const { prompt, includeInspiration } = suggestionPlans[i];
    const promptParts = [
      { text: prompt },
      {
        inlineData: await fetchImageInlineData(headshotUrl),
      },
    ];

    if (includeInspiration && inspirationThumbnail) {
      promptParts.push({
        inlineData: await fetchImageInlineData(inspirationThumbnail),
      });
    }

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
          parts: promptParts,
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

async function fetchInspirationThumbnail(jobId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('thumbnail')
    .eq('status', ThumbnailJobStatus.COMPLETED)
    .eq('favorite', true)
    .not('thumbnail', 'is', null)
    .neq('id', jobId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch inspiration thumbnail:', error);
    return null;
  }

  return data?.thumbnail ?? null;
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

function buildThumbnailPromptWithInspiration(videoTitle: string): string {
  return `
Create a high-CTR YouTube thumbnail optimized for tech/coding interview content.

VIDEO TITLE: "${videoTitle}"

REFERENCE IMAGE:
- Use the SECOND image as stylistic inspiration (layout, energy, color balance)
- Do NOT copy the reference exactly, and do NOT reuse any text from it
- Create an original composition that feels similarly premium and high-stakes

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

function buildThumbnailPromptWithText(videoTitle: string, overlayText: string): string {
  return `
Create a high-CTR YouTube thumbnail optimized for tech/coding interview content.

VIDEO TITLE: "${videoTitle}"

TEXT OVERLAY:
- Add bold, high-contrast text: "${overlayText}"
- Place text so it does NOT block the subject's face or torso
- Keep text readable at small sizes and limited to the provided words

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

function buildOverlayText(videoTitle: string): string {
  const sanitized = videoTitle.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const words = sanitized.split(/\s+/).filter(Boolean);
  const selected = words.slice(0, 7);
  const fallbackWords = ['Crush', 'The', 'Coding', 'Interview'];

  while (selected.length < 4) {
    selected.push(fallbackWords[selected.length % fallbackWords.length]);
  }

  return selected.join(' ');
}
