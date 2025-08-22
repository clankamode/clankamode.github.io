import { NextResponse } from 'next/server';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import { supabase } from '@/lib/supabase';


type PathParams = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  // ADMIN and EDITOR ROLES ONLY
  const { id } = await params

  const { data, error } = await supabase
    .from('ThumbnailJob')
    .select()
    .eq('id', id);

  return NextResponse.json({
    data: data?.[0],
    error,
  })
}

export async function PATCH(
  request: Request,
  { params }: PathParams
) {
  const { id } = await params

  // ADMIN and EDITOR ROLES ONLY
  
  const body = await request.json()
  const { thumbnail, notes, status } = body;

  // If status is provided, only update the status
  if (status !== undefined) {
    // Validate that the status is a valid ThumbnailJobStatus
    if (!Object.values(ThumbnailJobStatus).includes(status)) {
      return NextResponse.json({
        error: 'Invalid status value',
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ThumbnailJob')
      .update({ status })
      .eq('id', id)
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
    })
    .eq('id', id)
    .select();

  return NextResponse.json({
    data,
    error,
  })
}

export async function DELETE(
  request: Request,
  { params }: PathParams,
) {
  const { id } = await params

  // ADMIN and EDITOR ROLES ONLY
  const { data, error } = await supabase
    .from('ThumbnailJob')
    .delete()
    .eq('id', id)
    .select();

  return NextResponse.json({
    data,
    error,
  })
} 