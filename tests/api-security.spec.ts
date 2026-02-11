import { test, expect } from '@playwright/test';

test.describe('API Security', () => {
    test('POST /api/thumbnail_job returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/thumbnail_job', {
            data: {
                videoId: 'test-video-id',
                prompt: 'test prompt'
            }
        });
        expect(response.status()).toBe(401);
    });

    test('DELETE /api/thumbnail_job/[id] returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.delete('/api/thumbnail_job/test-job-id');
        expect(response.status()).toBe(401);
    });

    // Note: Testing authorized roles requires complex auth setup in E2E. 
    // For now, verifying that open access is closed is the primary security goal.
});
