import { getQuestions } from '@/lib/questions';
import QuestionsListServer from '../_components/QuestionsListServer';
import AskQuestionSection from '../_components/AskQuestionSection';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unanswered Questions - Career Q&A',
  description: 'Browse unanswered career questions and upvote your favorites',
  openGraph: {
    title: 'Unanswered Questions - Career Q&A',
    description: 'Browse unanswered career questions and upvote your favorites',
    type: 'website',
  },
};

export default async function UnansweredQuestionsPage() {
  const questions = await getQuestions();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-base uppercase tracking-wider text-[#2cbb5d]">Career Q&A</p>
          <h1 className="text-4xl font-bold">Community Questions</h1>
          <p className="text-gray-400">
            Browse questions from the community. Upvote your favorites to help them rise to the top.
          </p>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Top Questions</h2>
            <div className="flex gap-2 border border-[#3e3e3e] rounded-lg p-1 bg-[#1f1f1f]">
              <Link
                href="/questions/answered"
                className="px-4 py-2 text-base font-semibold rounded transition text-gray-400 hover:text-white"
              >
                Answered
              </Link>
              <Link
                href="/questions/unanswered"
                className="px-4 py-2 text-base font-semibold rounded transition bg-[#2cbb5d] text-black"
              >
                Unanswered
              </Link>
            </div>
          </div>
          {/* Server-rendered for SEO - questions are in initial HTML */}
          <QuestionsListServer questions={questions} tab="unanswered" />
        </section>

        <AskQuestionSection />
      </div>
    </div>
  );
}

