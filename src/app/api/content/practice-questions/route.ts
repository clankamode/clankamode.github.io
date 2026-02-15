import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-helpers';
import { UserRole } from '@/types/roles';

export async function GET(req: NextRequest) {
  const token = await requireAuth(req, UserRole.EDITOR);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name')
    .contains('source', ['Articles'])
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching practice questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practice questions' },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
