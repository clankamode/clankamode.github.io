import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type PathParams = {
  params: Promise<{ id: string }>
}

const ACTIVITY_TABLE = 'ThumbnailActivity';

export async function GET(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  const { id } = await params;

  const { data, error } = await supabase
    .from(ACTIVITY_TABLE)
    .select('*')
    .eq('thumbnail_job_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ data, error });
}

export async function POST(
  request: Request,
  { params }: PathParams
) {
  const { id } = await params;
  const body = await request.json();

  const { message, author } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(ACTIVITY_TABLE)
    .insert({
      thumbnail_job_id: id,
      message,
      actor: author || 'Anonymous',
      type: 'COMMENT',
    })
    .select();

  return NextResponse.json({ data, error });
}
