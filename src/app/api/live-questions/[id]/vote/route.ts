import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { buildIdentityOrFilter, getEffectiveIdentityFromToken } from '@/lib/auth-identity';
import { isMissingGoogleIdColumn } from '@/lib/supabase-compat';



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

    const { id: questionId } = await params;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const adminClient = getSupabaseAdminClient();

    // First, check if vote exists
    let { data: existingVotes, error: fetchVoteError } = await supabase
      .from('LiveQuestionVotes')
      .select('id')
      .eq('question_id', questionId)
      .or(buildIdentityOrFilter(identity, 'user_email'))
      .limit(10);

    if (fetchVoteError && isMissingGoogleIdColumn(fetchVoteError)) {
      ({ data: existingVotes, error: fetchVoteError } = await supabase
        .from('LiveQuestionVotes')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_email', identity.email)
        .limit(10));
    }

    if (fetchVoteError) {
      console.error('Error checking existing vote:', fetchVoteError);
      return NextResponse.json({ error: 'Failed to check vote status' }, { status: 500 });
    }

    let hasVoted: boolean;

    if ((existingVotes?.length || 0) > 0) {
      // Remove existing vote(s)
      let { error: deleteError } = await adminClient
        .from('LiveQuestionVotes')
        .delete()
        .eq('question_id', questionId)
        .or(buildIdentityOrFilter(identity, 'user_email'));

      if (deleteError && isMissingGoogleIdColumn(deleteError)) {
        ({ error: deleteError } = await adminClient
          .from('LiveQuestionVotes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_email', identity.email));
      }

      if (deleteError) {
        console.error('Error removing vote:', deleteError);
        return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
      }
      hasVoted = false;
    } else {
      // Try to insert new vote
      let { error: insertError } = await adminClient
        .from('LiveQuestionVotes')
        .insert({
          question_id: questionId,
          user_email: identity.email,
          google_id: identity.googleId ?? null,
        });

      if (insertError && isMissingGoogleIdColumn(insertError)) {
        ({ error: insertError } = await adminClient
          .from('LiveQuestionVotes')
          .insert({
            question_id: questionId,
            user_email: identity.email,
          }));
      }

      if (insertError) {
        // Check if it's a unique constraint violation (race condition)
        if (insertError.code === '23505') {
          // Vote was already created by another concurrent request
          // This means the vote now exists, so hasVoted = true
          hasVoted = true;
        } else {
          console.error('Error adding vote:', insertError);
          return NextResponse.json({ error: 'Failed to add vote' }, { status: 500 });
        }
      } else {
        hasVoted = true;
      }
    }

    const { count: voteCount, error: countError } = await supabase
      .from('LiveQuestionVotes')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId);

    if (countError) {
      console.error('Error counting votes:', countError);
      return NextResponse.json({ error: 'Failed to calculate vote count' }, { status: 500 });
    }

    return NextResponse.json({
      hasVoted: hasVoted,
      voteCount: voteCount || 0,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/live-questions/[id]/vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
