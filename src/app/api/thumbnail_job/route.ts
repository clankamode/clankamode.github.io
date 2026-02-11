import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { UserRole, hasRole } from "@/types/roles";
import type { ThumbnailJob } from '@/types/ThumbnailJob';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import { supabase } from '@/lib/supabase';

const TABLE_NAME = 'ThumbnailJob';

export async function GET(): Promise<NextResponse<{
  data?: ThumbnailJob[];
  error?: string;
}>> {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userRole || !hasRole(userRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false, nullsFirst: false })

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
      { error: errorMessage },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userRole || !hasRole(userRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json()
  const { video_url, video_title } = body;
  if (!video_url || !video_title) {
    return NextResponse.json({
      error: 'Video URL and Video Title is required',
    }, { status: 400 })
  }

  const trimmedTitle = String(video_title).trim();
  if (!trimmedTitle) {
    return NextResponse.json({
      error: 'Video Title is required',
    }, { status: 400 })
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase.from(TABLE_NAME).insert({
    video_url,
    video_title: trimmedTitle,
    status: ThumbnailJobStatus.TODO,
    updated_at: now,
  }).select();

  return NextResponse.json({
    data,
    error,
  })
}
