import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getSessionState } from '@/lib/progress';

export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (req.headers.get('x-internal-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { email, trackSlug } = body ?? {};
  if (!email || typeof email !== 'string' || !trackSlug || typeof trackSlug !== 'string') {
    return NextResponse.json({ error: 'Missing email or trackSlug' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: user } = await admin
    .from('Users')
    .select('role')
    .eq('email', email)
    .single();

  // Run session state — the Supabase day-cache is populated as a side effect
  // when planSessionItemsWithLLM produces a result inside getSessionState.
  await getSessionState(email, trackSlug, undefined, {
    viewer: user ? { role: user.role } : null,
  });

  return NextResponse.json({ ok: true });
}
