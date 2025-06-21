import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'


type ThumbnailJob = {
  id: string;
  name: string;
  status: 'TODO' | 'REVIEW' | 'DONE';
  video_link: string;
  thumbnail_link?: string;
  description?: string;
  created_at?: string; // ISO timestamp string
}

export async function GET(request: Request): Promise<NextResponse<{
  data?: ThumbnailJob[];
  error?: string;
}>> {
  try {
    // Get query parameters
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    let { data, error } = await supabase
        .from('thumbnail_jobs')
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
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const body = await request.json()
  const { data, error } = await supabase.from('thumbnail_jobs').insert({
    name: body.name,
    status: body.status,
    video_link: body.video_link,
  })

  return NextResponse.json({
    data,
    error,
  })
}