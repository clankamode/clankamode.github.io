import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ username: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { username } = await context.params;

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('username, bio, avatar_url, leetcode_url, codeforces_url, github_url, email')
    .eq('username', username)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const email = user.email;

  const [submissionsResult, totalQuestionsResult, articlesResult, badgesResult] = await Promise.all([
    supabase
      .from('UserQuestionSubmissions')
      .select('question_id, solved, updated_at')
      .eq('email', email)
      .eq('solved', true),
    supabase
      .from('InterviewQuestions')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('UserArticleProgress')
      .select('id', { count: 'exact', head: true })
      .eq('email', email),
    supabase
      .from('UserBadges')
      .select('badge_slug, earned_at, Badges(slug, name, description, icon_name)')
      .eq('email', email),
  ]);

  const solvedSubmissions = submissionsResult.data ?? [];
  const totalQuestions = totalQuestionsResult.count ?? 0;
  const articlesRead = articlesResult.count ?? 0;

  const recentSubmissions: { question_id: string; question_name: string; difficulty: string; solved_at: string }[] = [];

  if (solvedSubmissions.length > 0) {
    const questionIds = solvedSubmissions.map((s) => s.question_id);
    const { data: questions } = await supabase
      .from('InterviewQuestions')
      .select('id, name, difficulty')
      .in('id', questionIds);

    const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));

    const sorted = [...solvedSubmissions].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    for (const sub of sorted.slice(0, 20)) {
      const q = questionMap.get(sub.question_id);
      if (q) {
        recentSubmissions.push({
          question_id: sub.question_id,
          question_name: q.name,
          difficulty: q.difficulty,
          solved_at: sub.updated_at,
        });
      }
    }
  }

  const badges = (badgesResult.data ?? []).map((ub) => {
    const badge = Array.isArray(ub.Badges) ? ub.Badges[0] : ub.Badges;
    return {
      slug: badge?.slug ?? ub.badge_slug,
      name: badge?.name ?? '',
      description: badge?.description ?? '',
      icon_name: badge?.icon_name ?? '',
      earned_at: ub.earned_at,
    };
  });

  return NextResponse.json({
    username: user.username,
    bio: user.bio,
    avatar_url: user.avatar_url,
    leetcode_url: user.leetcode_url,
    codeforces_url: user.codeforces_url,
    github_url: user.github_url,
    stats: {
      questionsSolved: solvedSubmissions.length,
      totalQuestions,
      articlesRead,
    },
    badges,
    recentSubmissions,
  });
}
