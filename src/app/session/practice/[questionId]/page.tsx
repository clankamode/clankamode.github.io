import AssessmentClient from '@/app/assessment/_components/AssessmentClient';

interface SessionPracticePageProps {
  params: Promise<{ questionId: string }>;
}

export default async function SessionPracticePage({ params }: SessionPracticePageProps) {
  const { questionId } = await params;
  return <AssessmentClient forcedQuestionId={questionId} />;
}
