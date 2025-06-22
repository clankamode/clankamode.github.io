import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ADMIN and EDITOR ROLES ONLY
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const body = await request.json()
  const { thumbnail, notes } = body;
  if (!thumbnail || !notes) {
    return NextResponse.json({
      error: 'Thumbnail and Notes are required',
    }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ThumbnailJob')
    .update({
      thumbnail,
      notes,
      status: 'IN_REVIEW',
    })
    .eq('id', params.id);

  return NextResponse.json({
    data,
    error,
  })
} 