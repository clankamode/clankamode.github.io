import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { supabase } from '@/lib/supabase';

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  const { data } = await supabase
    .from('Users')
    .select('username')
    .eq('email', session.user.email)
    .single();

  if (data?.username) {
    redirect(`/profile/${data.username}`);
  }

  redirect('/');
}
