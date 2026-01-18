# AI Chat File Upload Setup

This document describes the file upload feature for the AI chat and required setup steps.

## Features

- Upload images (PNG, JPEG, GIF, WebP) and PDFs
- Preview uploaded images before sending
- Support for multiple file uploads in a single message
- Images are processed using OpenAI's Vision API
- Files are stored in Vercel Blob Storage

## Vercel Blob Storage Setup

The file upload uses Vercel Blob storage. No additional setup is required if you already have:

1. **Vercel Blob enabled** on your Vercel project
2. **Environment variables** set (automatic in Vercel deployment):
   - `BLOB_READ_WRITE_TOKEN` - automatically provided by Vercel

### Local Development

For local development, you'll need to:

1. Install the Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull`

This will create a `.env.local` file with the required `BLOB_READ_WRITE_TOKEN`.

### File Storage Configuration

Files are stored with the following settings:
- **Access**: Public (files are publicly accessible via URL)
- **Max file size**: 10MB
- **Allowed file types**: 
  - Images: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
  - Documents: `application/pdf`
- **Naming**: Random suffix added for uniqueness

## Usage

1. In the AI chat interface, click the attachment icon (📎) next to the message input
2. Select one or more image files or PDFs (max 10MB each)
3. Preview your attachments (images will show thumbnails, PDFs will show file names)
4. Remove any attachment by clicking the X button
5. Type your message (optional) and click Send
6. Images will be analyzed by the AI using vision capabilities
7. PDFs currently show a placeholder message (text extraction coming soon)

## Technical Details

### File Upload Flow

1. User selects files → Files are validated (type, size)
2. Files are uploaded to `/api/chat/upload` endpoint
3. Files are stored in Supabase Storage under `chat-attachments/{email}/{unique-id}.{ext}`
4. Public URLs are returned and stored with the message
5. When sending a message, attachments are included in the message object
6. OpenAI API receives messages with vision format for images

### API Endpoints

- `POST /api/chat/upload` - Upload files and get attachment metadata
- `POST /api/chat/conversations/:id/message` - Save messages with attachments

### Data Structure

Messages with attachments are stored with the following structure:

```typescript
interface MessageAttachment {
  id: string;
  type: 'image' | 'pdf';
  url: string;
  name: string;
  size: number;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
}
```

Attachments are stored in the `metadata` field of ChatMessages as:
```json
{
  "attachments": [
    {
      "id": "unique-id",
      "type": "image",
      "url": "https://...",
      "name": "screenshot.png",
      "size": 123456
    }
  ]
}
```

## Future Enhancements

- PDF text extraction using pdf-parse or similar library
- Support for more file types (documents, spreadsheets)
- Image compression before upload
- Drag and drop file upload
- Copy/paste image support
- File upload progress indicator

