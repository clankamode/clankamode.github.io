import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabase } from '@/lib/supabase';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface LeetCodeProblemRow {
  id: number;
  name: string;
  link: string;
  difficulty: string;
}

interface AssessmentQuestion {
  id: string;
  title: string;
  difficulty: Difficulty;
  url: string;
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

const mapQuestion = (question: LeetCodeProblemRow): AssessmentQuestion => ({
  id: String(question.id),
  title: question.name,
  difficulty: question.difficulty as Difficulty,
  url: question.link,
});

const fetchQuestionsByDifficulty = async (difficulty: Difficulty) => {
  const { data, error } = await supabase
    .from('LeetCodeProblems')
    .select('id, name, link, difficulty')
    .eq('difficulty', difficulty);

  if (error) {
    throw new Error(`Failed to load ${difficulty} questions.`);
  }

  return (data || []) as LeetCodeProblemRow[];
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
      fetchQuestionsByDifficulty('Easy'),
      fetchQuestionsByDifficulty('Medium'),
      fetchQuestionsByDifficulty('Hard'),
    ]);

    let selectedQuestions: LeetCodeProblemRow[] = [];

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
