import { beforeEach, describe, expect, test, vi } from 'vitest';

const { handleUploadMock, getServerSessionMock } = vi.hoisted(() => ({
  handleUploadMock: vi.fn(),
  getServerSessionMock: vi.fn(),
}));

vi.mock('@vercel/blob/client', () => ({
  handleUpload: handleUploadMock,
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('@/app/api/auth/[...nextauth]/auth', () => ({
  authOptions: {},
}));

import { POST } from './route';

describe('/api/feedback/upload POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 when no authenticated user is present', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await POST(
      new Request('http://localhost/api/feedback/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'screenshot.png' }),
      })
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  test('allows authenticated uploads to proceed', async () => {
    getServerSessionMock.mockResolvedValue({
      user: { email: 'alice@example.com' },
    });
    handleUploadMock.mockResolvedValue({ url: 'https://blob.example.com/upload-token' });

    const req = new Request('http://localhost/api/feedback/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'screenshot.png' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://blob.example.com/upload-token' });
    expect(handleUploadMock).toHaveBeenCalledTimes(1);
    expect(handleUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { filename: 'screenshot.png' },
        request: req,
      })
    );
  });
});
