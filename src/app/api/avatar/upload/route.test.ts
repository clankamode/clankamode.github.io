import { beforeEach, describe, expect, test, vi } from 'vitest';

const { getServerSessionMock, handleUploadMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  handleUploadMock: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('@vercel/blob/client', () => ({
  handleUpload: handleUploadMock,
}));

vi.mock('@/app/api/auth/[...nextauth]/auth', () => ({
  authOptions: {},
}));

import { POST } from './route';

describe('/api/avatar/upload POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 for unauthenticated requests', async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await POST(new Request('http://localhost/api/avatar/upload', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  test('issues upload token for authenticated users', async () => {
    getServerSessionMock.mockResolvedValue({ user: { email: 'alice@example.com' } });
    handleUploadMock.mockResolvedValue({ url: 'https://blob.vercel-storage.com/avatar.png' });

    const request = new Request('http://localhost/api/avatar/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname: 'avatars/avatar.png' }),
    });

    const res = await POST(request);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://blob.vercel-storage.com/avatar.png' });
    expect(handleUploadMock).toHaveBeenCalledTimes(1);
    expect(handleUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { pathname: 'avatars/avatar.png' },
        request,
        onBeforeGenerateToken: expect.any(Function),
      })
    );

    const uploadConfig = handleUploadMock.mock.calls[0]?.[0];
    const tokenConfig = await uploadConfig.onBeforeGenerateToken();
    expect(tokenConfig.tokenPayload).toBe(JSON.stringify({ email: 'alice@example.com' }));
  });
});
