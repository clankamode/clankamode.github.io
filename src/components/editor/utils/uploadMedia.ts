import { upload } from '@vercel/blob/client';

export interface UploadedMedia {
  url: string;
  contentType: string;
  size: number;
}

export async function uploadArticleMedia(file: File): Promise<UploadedMedia> {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/content/upload',
  });
  return {
    url: blob.url,
    contentType: blob.contentType ?? file.type,
    size: file.size,
  };
}

export async function generateAltText(url: string): Promise<string | null> {
  try {
    const response = await fetch('/api/content/alt-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { altText?: string };
    return data.altText ?? null;
  } catch {
    return null;
  }
}
