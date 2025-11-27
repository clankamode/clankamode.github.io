import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

// GET /api/chat/conversations - List user's conversations
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use proxyEmail if admin is proxying, otherwise use their own email
    const userEmail = (token.proxyEmail as string) || token.email;

    // Get all conversations for the user, ordered by most recent
    const { data: conversations, error } = await supabase
      .from('ChatConversations')
      .select('*')
      .eq('email', userEmail)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json(conversations || []);
  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use proxyEmail if admin is proxying, otherwise use their own email
    const userEmail = (token.proxyEmail as string) || token.email;
    const body = await req.json();
    const { title, model } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('ChatConversations')
      .insert({
        email: userEmail,
        title: title || null,
        model,
        is_pinned: false,
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

