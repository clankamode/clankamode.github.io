import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';
import { buildUserIdentityOrFilter, getEffectiveIdentityFromToken } from '@/lib/auth-identity';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const identity = getEffectiveIdentityFromToken(token);
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from('TestSession')
      .select('id, started_at, completed_at, total_questions, correct_answers, score_percentage')
      .or(buildUserIdentityOrFilter(identity))
      .order('started_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    // Separate incomplete and completed sessions
    const incompleteSessions = sessions?.filter(s => !s.completed_at) || [];
    const completedSessions = sessions?.filter(s => s.completed_at) || [];

    return NextResponse.json({
      incomplete: incompleteSessions,
      completed: completedSessions,
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
