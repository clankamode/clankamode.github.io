import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/youtube', () => ({
  getUploadsPlaylistId: vi.fn(),
  fetchPlaylistItems: vi.fn(),
  fetchVideosByIds: vi.fn(),
}));

vi.mock('@/lib/video-sync', () => ({
  mapVideoRow: vi.fn(),
  upsertToSupabase: vi.fn(),
}));

import { GET } from '@/app/api/video_data_cron/route';
import { fetchPlaylistItems, fetchVideosByIds, getUploadsPlaylistId } from '@/lib/youtube';
import { mapVideoRow, upsertToSupabase } from '@/lib/video-sync';

function makeRequest(headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/video_data_cron', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/video_data_cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('returns 503 when CRON_SECRET env var is not set', async () => {
    delete process.env.CRON_SECRET;

    const res = await GET(makeRequest({ 'x-cron-secret': 'anything' }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Not configured' });
  });

  it('returns 401 when x-cron-secret header is missing', async () => {
    process.env.CRON_SECRET = 'my-secret';

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when x-cron-secret header is wrong', async () => {
    process.env.CRON_SECRET = 'my-secret';

    const res = await GET(makeRequest({ 'x-cron-secret': 'wrong-secret' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns synced rows when header matches CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'my-secret';
    vi.mocked(getUploadsPlaylistId).mockResolvedValue('uploads-playlist');
    vi.mocked(fetchPlaylistItems).mockResolvedValue({
      items: [
        { contentDetails: { videoId: 'video-1' } },
        { contentDetails: { videoId: undefined } },
      ],
    } as Awaited<ReturnType<typeof fetchPlaylistItems>>);
    vi.mocked(fetchVideosByIds).mockResolvedValue([{ id: 'video-1' }] as Awaited<ReturnType<typeof fetchVideosByIds>>);
    vi.mocked(mapVideoRow).mockReturnValue({ id: 'video-1' } as ReturnType<typeof mapVideoRow>);
    vi.mocked(upsertToSupabase).mockResolvedValue(undefined);

    const res = await GET(makeRequest({ 'x-cron-secret': 'my-secret' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: 'SUCCESS', rows: [{ id: 'video-1' }] });
    expect(getUploadsPlaylistId).toHaveBeenCalledOnce();
    expect(fetchPlaylistItems).toHaveBeenCalledWith('uploads-playlist', undefined, '5');
    expect(fetchVideosByIds).toHaveBeenCalledWith(['video-1']);
    expect(upsertToSupabase).toHaveBeenCalledWith([{ id: 'video-1' }]);
  });
});
