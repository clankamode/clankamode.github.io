import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface InterviewQuestionRow {
  id: string;
  name: string;
  leetcode_number: number | null;
  difficulty: string;
  prompt_full: string;
  starter_code: string;
  helper_code: string;
  test_cases: unknown;
  video_ids: string[] | null;
}

const pickRandom = <T,>(items: T[], count: number): T[] => {
  const copy = [...items];
  const picked: T[] = [];
  while (picked.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
};

const fetchByDifficulty = async (difficulty: Difficulty) => {
  const { data, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name, leetcode_number, difficulty, prompt_full, starter_code, helper_code, test_cases, video_ids')
    .eq('difficulty', difficulty)
    .contains('source', ['MOCK_ASSESSMENTS']);

  if (error) {
    throw new Error(`Failed to load ${difficulty} questions.`);
  }
  return (data || []) as InterviewQuestionRow[];
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const level = req.nextUrl.searchParams.get('level');
  if (!level) {
    return NextResponse.json({ error: 'Level is required' }, { status: 400 });
  }

  try {
    const [easy, medium, hard] = await Promise.all([
      fetchByDifficulty('Easy'),
      fetchByDifficulty('Medium'),
      fetchByDifficulty('Hard'),
    ]);

    let selected: InterviewQuestionRow[] = [];

    if (level === 'noob') {
      selected = pickRandom(easy, 2);
    } else if (level === 'intermediate') {
      selected = [...pickRandom(easy, 1), ...pickRandom(medium, 1)];
    } else if (level === 'faang') {
      const useHard = hard.length > 0 && Math.random() > 0.5;
      selected = useHard
        ? [...pickRandom(medium, 1), ...pickRandom(hard, 1)]
        : pickRandom(medium, 2);
    } else {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    if (selected.length < 2) {
      return NextResponse.json({ error: 'Not enough questions available.' }, { status: 500 });
    }

    return NextResponse.json({ questions: selected });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questions.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
