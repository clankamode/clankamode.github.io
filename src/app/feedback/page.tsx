import type { Metadata } from 'next';
import FeedbackForm from '@/components/feedback/FeedbackForm';

export const metadata: Metadata = {
  title: 'Feedback | James Peralta',
  description: 'Share feedback, report bugs, and suggest improvements.',
};

export default function FeedbackPage() {
  return (
    <main className="bg-background min-h-[calc(100vh-var(--nav-height,113px)-96px)]">
      <FeedbackForm />
    </main>
  );
}
