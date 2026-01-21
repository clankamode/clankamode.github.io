import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { supabase } from '@/lib/supabase';
import type { CommentAttachment } from '@/types/ThumbnailComment';

type PathParams = {
  params: Promise<{ id: string }>;
};

const COMMENTS_TABLE = 'ThumbnailComments';
const MAX_TEXT_LENGTH = 200;

export async function GET(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  const { id } = await params;

  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .select('*')
    .eq('thumbnail_job_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const body = await request.json();
  const { text, attachments } = body as {
    text: string;
    attachments?: CommentAttachment[];
  };

  // Validate text
  if (!text || typeof text !== 'string') {
    return NextResponse.json(
      { error: 'Comment text is required' },
      { status: 400 }
    );
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return NextResponse.json(
      { error: 'Comment text cannot be empty' },
      { status: 400 }
    );
  }

  if (trimmedText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Comment text cannot exceed ${MAX_TEXT_LENGTH} characters` },
      { status: 400 }
    );
  }

  // Validate attachments if provided
  const validAttachments: CommentAttachment[] = [];
  if (attachments && Array.isArray(attachments)) {
    for (const attachment of attachments) {
      if (
        attachment &&
        typeof attachment.url === 'string' &&
        typeof attachment.name === 'string' &&
        attachment.type === 'image'
      ) {
        validAttachments.push({
          url: attachment.url,
          name: attachment.name,
          type: 'image',
        });
      }
    }
  }

  // Get author info from session or use Anonymous
  const authorName = session?.user?.name || 'Anonymous';
  const authorEmail = session?.user?.email || undefined;
  const authorImage = session?.user?.image || undefined;

  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .insert({
      thumbnail_job_id: id,
      text: trimmedText,
      attachments: validAttachments,
      author_name: authorName,
      author_email: authorEmail,
      author_image: authorImage,
    })
    .select();

  if (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data?.[0] });
}

export async function PATCH(
  request: Request,
  { params }: PathParams
): Promise<NextResponse> {
  await params; // thumbnail job id not needed for comment update
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { commentId, text } = body as {
    commentId: string;
    text: string;
  };

  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

  // Validate text
  if (!text || typeof text !== 'string') {
    return NextResponse.json(
      { error: 'Comment text is required' },
      { status: 400 }
    );
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return NextResponse.json(
      { error: 'Comment text cannot be empty' },
      { status: 400 }
    );
  }

  if (trimmedText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Comment text cannot exceed ${MAX_TEXT_LENGTH} characters` },
      { status: 400 }
    );
  }

  // First, verify the user owns this comment
  const { data: existingComment, error: fetchError } = await supabase
    .from(COMMENTS_TABLE)
    .select('author_email')
    .eq('id', commentId)
    .single();

  if (fetchError || !existingComment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if (existingComment.author_email !== session.user.email) {
    return NextResponse.json(
      { error: 'You can only edit your own comments' },
      { status: 403 }
    );
  }

  // Update the comment
  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .update({ text: trimmedText })
    .eq('id', commentId)
    .select();

  if (error) {
    console.error('Failed to update comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data?.[0] });
}
