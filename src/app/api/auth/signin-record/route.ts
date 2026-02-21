import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = (token.proxyEmail as string) || (token.email as string);
  const today = new Date().toISOString().slice(0, 10);

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('UserSignIns')
    .upsert(
      { email, sign_in_date: today },
      { onConflict: 'email,sign_in_date', ignoreDuplicates: true }
    );

  if (error) {
    console.error('signin-record error:', error);
    return NextResponse.json({ error: 'Failed to record sign-in' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
