import { NextRequest, NextResponse } from 'next/server';
import { runDailyBrief } from '@/app/api/admin/daily-brief/dailyBrief';

function isAuthorizedCronRequest(request: NextRequest, cronSecret: string): boolean {
  const authorizationHeader = request.headers.get('authorization');
  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('Missing CRON_SECRET for /api/crons/daily-brief');
    return NextResponse.json({ error: 'Cron endpoint is not configured' }, { status: 500 });
  }

  if (!isAuthorizedCronRequest(request, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runDailyBrief();
}
