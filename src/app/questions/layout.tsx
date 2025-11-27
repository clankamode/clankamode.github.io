import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Q&A',
  description: 'Ask questions and vote on the best topics',
};

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

