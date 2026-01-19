import { upload } from '@vercel/blob/client';
import { MessageAttachment } from '@/types/chat';

export const uploadFile = async (file: File): Promise<MessageAttachment> => {
  const attachmentType = file.type.startsWith('image/') ? 'image' : 'pdf';

  if (attachmentType === 'pdf') {
    const formData = new FormData();
    formData.append('file', file);

    const [blob, openaiResponse] = await Promise.all([
      upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/chat/upload',
      }),
      fetch('/api/chat/upload-pdf', {
        method: 'POST',
        body: formData,
      }),
    ]);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(errorData.error || 'Failed to upload PDF');
    }

    const data = await openaiResponse.json();

    return {
      id: crypto.randomUUID(),
      type: 'pdf',
      url: blob.url,
      file_id: data.file_id,
      name: file.name,
      size: file.size,
    };
  }

  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/chat/upload',
  });

  return {
    id: crypto.randomUUID(),
    type: 'image',
    url: blob.url,
    name: file.name,
    size: file.size,
  };
};
