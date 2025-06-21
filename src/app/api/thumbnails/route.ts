import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    // Get query parameters
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    let { data, error } = await supabase
        .from('thumbnail_jobs')
        .select('*')

    return NextResponse.json({
        data,
    });
  } catch (error: unknown) {
    console.error('Error fetching videos:', error);
    let errorMessage = 'Failed to fetch videos';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
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