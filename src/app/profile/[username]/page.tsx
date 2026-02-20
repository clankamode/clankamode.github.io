import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { supabase } from '@/lib/supabase';
import ProfileCard from './_components/ProfileCard';
import StatsSection from './_components/StatsSection';
import BadgesGrid from './_components/BadgesGrid';
import SubmissionHistory from './_components/SubmissionHistory';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface ProfileResponse {
  username: string;
  bio: string | null;
  avatar_url: string | null;
  leetcode_url: string | null;
  codeforces_url: string | null;
  github_url: string | null;
  stats: {
    questionsSolved: number;
    totalQuestions: number;
    articlesRead: number;
  };
  badges: Array<{
    slug: string;
    name: string;
    description: string;
    icon_name: string;
    earned_at: string;
  }>;
  recentSubmissions: Array<{
    question_id: string;
    question_name: string;
    difficulty: string;
    solved_at: string;
  }>;
}

async function fetchProfile(username: string): Promise<ProfileResponse | null> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/profile/${encodeURIComponent(username)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCurrentUserUsername(email: string): Promise<string | null> {
  const { data } = await supabase
    .from('Users')
    .select('username')
    .eq('email', email)
    .single();
  return data?.username ?? null;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const [profile, session] = await Promise.all([
    fetchProfile(username),
    getServerSession(authOptions),
  ]);

  if (!profile) notFound();

  let currentUserUsername: string | null = null;
  if (session?.user?.email) {
    currentUserUsername = await getCurrentUserUsername(session.user.email);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 sm:gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <ProfileCard
              profile={profile}
              currentUserUsername={currentUserUsername}
            />
            <StatsSection stats={profile.stats} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <BadgesGrid badges={profile.badges} />
            <SubmissionHistory submissions={profile.recentSubmissions} />
          </div>
        </div>
      </div>
    </main>
  );
}
