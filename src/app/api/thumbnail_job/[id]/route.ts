import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import type { ThumbnailActivityType } from '@/types/ThumbnailActivity';
import { supabase } from '@/lib/supabase';
import { hasRole, UserRole } from '@/types/roles';


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
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userRole || !hasRole(userRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userRole || !hasRole(userRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json()
  const { thumbnail, notes, status, favorite } = body;

  const now = new Date().toISOString();

  if (favorite !== undefined) {
    if (!hasRole(userRole, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required to favorite thumbnails' }, { status: 403 });
    }

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

  if (status !== undefined) {
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
      await logThumbnailActivity(id, 'STATUS_CHANGE', message, session?.user?.email || 'system');
    }

    return NextResponse.json({
      data,
      error,
    })
  }

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
      message,
      session?.user?.email || 'system'
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

  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userRole || !hasRole(userRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ThumbnailJob')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .select();

  if (!error) {
    await logThumbnailActivity(id, 'STATUS_CHANGE', 'Thumbnail job deleted', session?.user?.email || 'system');
  }

  return NextResponse.json({
    data,
    error,
  })
} 