import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface InterviewQuestionRow {
  id: string;
  name: string;
  leetcode_number: number | null;
  leetcode_url: string | null;
  difficulty: string;
}

interface AssessmentQuestion {
  id: string;
  title: string;
  difficulty: Difficulty;
  url: string | null;
}

const pickRandomItems = <T,>(items: T[], count: number): T[] => {
  const copy = [...items];
  const picked: T[] = [];

  while (picked.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }

  return picked;
};

const mapQuestion = (question: InterviewQuestionRow): AssessmentQuestion => ({
  id: String(question.leetcode_number ?? question.id),
  title: question.name,
  difficulty: question.difficulty as Difficulty,
  url: question.leetcode_url,
});

const fetchQuestionsByDifficulty = async (difficulty: Difficulty) => {
  const { data, error } = await supabase
    .from('InterviewQuestions')
    .select('id, name, leetcode_number, leetcode_url, difficulty')
    .eq('difficulty', difficulty)
    .contains('source', ['MOCK_ASSESSMENTS'])
    .not('leetcode_number', 'is', null)
    .not('leetcode_url', 'is', null);

  if (error) {
    throw new Error(`Failed to load ${difficulty} questions.`);
  }

  return (data || []) as InterviewQuestionRow[];
};

const fetchQuestionByIdentifier = async (questionIdentifier: string) => {
  const baseQuery = supabase
    .from('InterviewQuestions')
    .select('id, name, leetcode_number, leetcode_url, difficulty')
    .or('source.cs.{MOCK_ASSESSMENTS},source.cs.{PERALTA_75}');

  const numericIdentifier = Number(questionIdentifier);
  const query = Number.isFinite(numericIdentifier) && numericIdentifier > 0
    ? baseQuery.eq('leetcode_number', numericIdentifier)
    : baseQuery.eq('id', questionIdentifier);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error('Failed to load question.');
  }

  return data as InterviewQuestionRow | null;
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const level = req.nextUrl.searchParams.get('level');
  const questionIdParam = req.nextUrl.searchParams.get('questionId');

  if (questionIdParam) {
    if (!questionIdParam || questionIdParam.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
    }

    try {
      const question = await fetchQuestionByIdentifier(questionIdParam.trim());
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      return NextResponse.json({
        question: mapQuestion(question),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load question.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!level) {
    return NextResponse.json({ error: 'Level is required' }, { status: 400 });
  }

  try {
    const [easy, medium, hard] = await Promise.all([
      fetchQuestionsByDifficulty('Easy'),
      fetchQuestionsByDifficulty('Medium'),
      fetchQuestionsByDifficulty('Hard'),
    ]);

    let selectedQuestions: InterviewQuestionRow[] = [];

    if (level === 'noob') {
      selectedQuestions = pickRandomItems(easy, 2);
    } else if (level === 'intermediate') {
      selectedQuestions = [
        ...pickRandomItems(easy, 1),
        ...pickRandomItems(medium, 1),
      ];
    } else if (level === 'faang') {
      const useHard = Math.random() > 0.5;
      selectedQuestions = useHard
        ? [...pickRandomItems(medium, 1), ...pickRandomItems(hard, 1)]
        : pickRandomItems(medium, 2);
    } else {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    if (selectedQuestions.length < 2) {
      return NextResponse.json({ error: 'Not enough questions available.' }, { status: 500 });
    }

    return NextResponse.json({
      level,
      questions: selectedQuestions.map(mapQuestion),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questions.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
