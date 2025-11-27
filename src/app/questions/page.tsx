import { redirect } from 'next/navigation';

export default function QuestionsPage() {
  redirect('/questions/answered');
}
