import { NextResponse } from 'next/server';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import type { ThumbnailActivityType } from '@/types/ThumbnailActivity';
import { supabase } from '@/lib/supabase';


type PathParams = {
  params: Promise<{ id: string }>
}

const ACTIVITY_TABLE = 'ThumbnailActivity';

async function logThumbnailActivity(
  thumbnailJobId: string,
  type: ThumbnailActivityType,
  message: string,
  actor = 'system'
) {
  const { error } = await supabase.from(ACTIVITY_TABLE).insert({
    thumbnail_job_id: thumbnailJobId,
    type,
    message,
    actor,
  });

  if (error) {
    console.error('Failed to log thumbnail activity:', error);
  }
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
  const { thumbnail, notes, status, favorite } = body;

  const now = new Date().toISOString();

  // If favorite is provided, update the favorite field
  if (favorite !== undefined) {
    const { data, error } = await supabase
      .from('ThumbnailJob')
      .update({ favorite: Boolean(favorite), updated_at: now })
      .eq('id', id)
      .select();

    return NextResponse.json({
      data,
      error,
    })
  }

  // If status is provided, only update the status
  if (status !== undefined) {
    // Validate that the status is a valid ThumbnailJobStatus
    if (!Object.values(ThumbnailJobStatus).includes(status)) {
      return NextResponse.json({
        error: 'Invalid status value',
      }, { status: 400 })
    }

    const { data: currentData } = await supabase
      .from('ThumbnailJob')
      .select('status')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('ThumbnailJob')
      .update({ status, updated_at: now })
      .eq('id', id)
      .select();

    if (!error) {
      const previousStatus = currentData?.status;
      const message = previousStatus && previousStatus !== status
        ? `Status changed from ${previousStatus} to ${status}`
        : `Status set to ${status}`;
      await logThumbnailActivity(id, 'STATUS_CHANGE', message);
    }

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

  const { data: existingJob } = await supabase
    .from('ThumbnailJob')
    .select('thumbnail')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('ThumbnailJob')
    .update({
      thumbnail,
      notes,
      updated_at: now,
    })
    .eq('id', id)
    .select();

  if (!error) {
    const hadThumbnail = Boolean(existingJob?.thumbnail);
    const message = hadThumbnail ? 'Thumbnail updated' : 'Thumbnail uploaded';
    await logThumbnailActivity(
      id,
      hadThumbnail ? 'THUMBNAIL_UPDATED' : 'THUMBNAIL_UPLOADED',
      message
    );
  }

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
  // Soft delete by setting deleted_at timestamp
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ThumbnailJob')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .select();

  if (!error) {
    await logThumbnailActivity(id, 'STATUS_CHANGE', 'Thumbnail job deleted');
  }

  return NextResponse.json({
    data,
    error,
  })
} 