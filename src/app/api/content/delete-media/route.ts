import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/roles';
import { requireAuth } from '@/lib/auth-helpers';
import { del } from '@vercel/blob';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await requireAuth(request, UserRole.EDITOR);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('blob.vercel-storage.com')) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    try {
      await del(url);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (blobError) {
      console.error('Error deleting blob:', blobError);
      return NextResponse.json(
        { error: 'Failed to delete media file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/content/delete-media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
