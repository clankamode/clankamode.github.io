import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'
import type { ThumbnailJob } from '@/types/ThumbnailJob';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import { supabase } from '@/lib/supabase';

const TABLE_NAME = 'ThumbnailJob';

export async function GET(): Promise<NextResponse<{
  data?: ThumbnailJob[];
  error?: string;
}>> {
  // ADMIN and EDITOR ROLES ONLY
  try {
    // Get query parameters
    const { data } = await supabase
        .from(TABLE_NAME)
        .select('*')

    return NextResponse.json({
        data: data as ThumbnailJob[],
    });
  } catch (error: unknown) {
    console.error('Error fetching videos:', error);
    let errorMessage = 'Failed to fetch videos';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage},
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  // ADMIN ROLE Only
  const body = await request.json()
  const { video_url, video_title } = body;
  if (!video_url || !video_title) {
    return NextResponse.json({
      error: 'Video URL and Video Title is required',
    }, { status: 400 })
  }

  const { data, error } = await supabase.from(TABLE_NAME).insert({
    video_url,
    video_title,
    status: ThumbnailJobStatus.TODO,
  }).select();

  return NextResponse.json({
    data,
    error,
  })
}
