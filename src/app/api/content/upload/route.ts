import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/roles';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await requireAuth(request as NextRequest, UserRole.EDITOR);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 10 * 1024 * 1024,
        tokenPayload: JSON.stringify({
          role: effectiveRole,
        }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('Content media upload completed', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error uploading content media:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 400 });
  }
}
