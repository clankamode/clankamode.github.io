import { afterEach, describe, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { runDailyBriefMock } = vi.hoisted(() => ({
  runDailyBriefMock: vi.fn(),
}));

vi.mock('@/app/api/admin/daily-brief/dailyBrief', () => ({
  runDailyBrief: runDailyBriefMock,
}));

import { GET } from './route';

describe('/api/crons/daily-brief GET', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    vi.clearAllMocks();

    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
      return;
    }

    process.env.CRON_SECRET = originalCronSecret;
  });

  test('returns 500 when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    const req = new NextRequest('http://localhost/api/crons/daily-brief');
    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Cron endpoint is not configured' });
    expect(runDailyBriefMock).not.toHaveBeenCalled();
  });

  test('returns 401 for requests with an invalid secret', async () => {
    process.env.CRON_SECRET = 'top-secret';

    const req = new NextRequest('http://localhost/api/crons/daily-brief', {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(runDailyBriefMock).not.toHaveBeenCalled();
  });

  test('runs the daily brief for authorized cron requests', async () => {
    process.env.CRON_SECRET = 'top-secret';
    runDailyBriefMock.mockResolvedValue(NextResponse.json({ ok: true }));

    const req = new NextRequest('http://localhost/api/crons/daily-brief', {
      headers: {
        authorization: 'Bearer top-secret',
      },
    });
    const res = await GET(req);

    expect(runDailyBriefMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
