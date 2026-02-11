import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { buildUserIdentityOrFilter, getEffectiveIdentityFromToken } from '@/lib/auth-identity';

// POST /api/chat/conversations/[id]/message - Save a message to conversation
export async function POST(
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
    const { role, content, token_count, attachments, generatedImages } = body;

    if (!role || (!content && !attachments && !generatedImages)) {
      return NextResponse.json(
        { error: 'Role and content, attachments, or generatedImages are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, assistant, or system' },
        { status: 400 }
      );
    }

    // Verify the conversation exists and belongs to the user
    const { error: conversationError } = await supabase
      .from('ChatConversations')
      .select('id')
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
      console.error('Error verifying conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to verify conversation' },
        { status: 500 }
      );
    }

    // Build metadata object
    const metadata: Record<string, unknown> = {};
    if (attachments) {
      metadata.attachments = attachments;
    }
    if (generatedImages) {
      metadata.generatedImages = generatedImages;
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('ChatMessages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        token_count: token_count || 0,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Update the conversation's updated_at timestamp
    await supabase
      .from('ChatConversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[id]/message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
