import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { buildUserIdentityOrFilter, getEffectiveIdentityFromToken } from '@/lib/auth-identity';

// GET /api/chat/conversations/[id] - Get conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: conversationId } = await params;

    // Get the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('ChatConversations')
      .select('*')
      .eq('id', conversationId)
      .or(buildUserIdentityOrFilter(identity))
      .single();

    if (conversationError) {
      if (conversationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      );
    }

    // Get messages for the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('ChatMessages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Map messages to include attachments and generatedImages from metadata
    const messagesWithAttachments = messages?.map(msg => ({
      ...msg,
      attachments: msg.metadata?.attachments || undefined,
      generatedImages: msg.metadata?.generatedImages || undefined,
    })) || [];

    return NextResponse.json({
      ...conversation,
      messages: messagesWithAttachments,
    });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/chat/conversations/[id] - Update conversation (rename)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: conversationId } = await params;
    const body = await req.json();
    const { title } = body;

    if (title === undefined) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Update the conversation
    const { data: conversation, error } = await supabase
      .from('ChatConversations')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .or(buildUserIdentityOrFilter(identity))
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      console.error('Error updating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error in PATCH /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/conversations/[id] - Delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });

    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: conversationId } = await params;

    // Delete the conversation (messages will cascade delete)
    const { error } = await supabase
      .from('ChatConversations')
      .delete()
      .eq('id', conversationId)
      .or(buildUserIdentityOrFilter(identity));

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/chat/conversations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
