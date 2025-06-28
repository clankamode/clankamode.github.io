import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ADMIN and EDITOR ROLES ONLY
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await supabase
    .from('ThumbnailJob')
    .select()
    .eq('id', params.id);

  return NextResponse.json({
    data: data?.[0],
    error,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ADMIN and EDITOR ROLES ONLY
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const body = await request.json()
  const { thumbnail, notes, status } = body;

  // If status is provided, only update the status
  if (status === ThumbnailJobStatus.COMPLETED) {
    const { data, error } = await supabase
      .from('ThumbnailJob')
      .update({ status })
      .eq('id', params.id)
      .select();

    return NextResponse.json({
      data,
      error,
    })
  }

  // Otherwise, handle the normal thumbnail submission case
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
      status: ThumbnailJobStatus.IN_REVIEW,
    })
    .eq('id', params.id)
    .select();

  return NextResponse.json({
    data,
    error,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ADMIN and EDITOR ROLES ONLY
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await supabase
    .from('ThumbnailJob')
    .delete()
    .eq('id', params.id)
    .select();

  return NextResponse.json({
    data,
    error,
  })
} 