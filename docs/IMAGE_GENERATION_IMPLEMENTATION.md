# Google Gemini Image Generation Implementation

This document describes the implementation of Google Gemini's image generation capabilities in the chat interface.

## Overview

The implementation adds AI-powered image generation and editing to the existing chat interface using Google's Gemini 3 Pro Image Preview model. Users can:
- **Generate images** from text descriptions
- **Edit existing images** by uploading a photo and describing the desired changes

## Key Features

- **Real-time Streaming**: Images and text responses stream in real-time as they're generated
- **Automatic Upload**: Generated images are automatically uploaded to Vercel Blob storage
- **Persistent Storage**: Generated images are saved in the database and restored when you reopen conversations
- **Conversation History**: All generated images persist across sessions and page refreshes
- **Model Selection**: Easy switching between chat models and image generation
- **Authentication**: Requires user authentication to prevent abuse
- **Image Editing**: Upload photos and modify them with natural language prompts
- **Smart UI**: Interface adapts to show generation vs. editing mode

## Architecture

### 1. API Route (`/api/chat/generate-image`)

**Location**: `src/app/api/chat/generate-image/route.ts`

**Key Responsibilities**:
- Authenticates users via NextAuth
- Accepts image generation prompts
- Streams responses from Google Gemini API
- Uploads generated images to Vercel Blob
- Returns image URLs and text via Server-Sent Events (SSE)

**Request Format**:
```json
{
  "prompt": "A beautiful sunset over mountains",
  "imageSize": "1K", // Optional: "1K", "2K", or "4K"
  "inputImageUrl": "https://..." // Optional: URL of image to edit
}
```

**Response Format** (SSE):
```
data: {"type":"text","content":"Generating your image..."}

data: {"type":"image","url":"https://blob.vercel-storage.com/...","mimeType":"image/png"}

data: [DONE]
```

### 2. Frontend Integration

**Location**: `src/app/ai/_components/ChatInterface.tsx`

**Changes Made**:
1. Added `gemini-3-pro-image-preview` to the MODELS array
2. Updated `handleSubmit` to detect image generation requests
3. Modified streaming logic to handle both text and image chunks
4. Updated message rendering to display generated images
5. Added UI indicator for image generation mode

### 3. Type Definitions

**Location**: `src/types/chat.ts`

**New Types**:
```typescript
export interface GeneratedImage {
  id: string;
  url: string;
  mimeType?: string;
  prompt?: string;
}

// Extended Message interface (for UI)
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MessageAttachment[];
  generatedImages?: GeneratedImage[]; // New field
}

// Extended ChatMessage interface (for database)
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  token_count?: number | null;
  metadata?: Record<string, unknown>;
  parent_message_id?: string | null;
  attachments?: MessageAttachment[];
  generatedImages?: GeneratedImage[]; // Extracted from metadata
}
```

### 4. Database Persistence

**Saving Messages**: `src/app/api/chat/conversations/[id]/message/route.ts`
- Accepts `generatedImages` in request body
- Stores in `metadata.generatedImages` JSONB field
- Supports both `attachments` and `generatedImages` in same message

**Loading Messages**: `src/app/api/chat/conversations/[id]/route.ts`
- Fetches messages from database
- Extracts `generatedImages` from metadata
- Returns messages with both `attachments` and `generatedImages`

**Database Schema**:
```json
{
  "metadata": {
    "attachments": [...],      // User uploads
    "generatedImages": [       // AI generated
      {
        "id": "uuid",
        "url": "https://...",
        "mimeType": "image/png"
      }
    ]
  }
}
```

## Configuration

### Environment Variables

Add to your `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/).

### Vercel Blob Storage

The implementation uses Vercel Blob's `put` method for server-side uploads. Ensure you have:
- `BLOB_READ_WRITE_TOKEN` configured in your environment
- Vercel Blob storage enabled for your project

## Usage

### Generating Images

1. Navigate to the AI chat page (`/ai`)
2. Select "Gemini Image Generation" from the model dropdown
3. Type an image prompt (e.g., "A futuristic city at night")
4. Press Send or hit Enter
5. Watch as the image generates and streams in real-time

### Editing Images

1. Navigate to the AI chat page (`/ai`)
2. Select "Gemini Image Generation" from the model dropdown
3. Click the upload button or drag & drop an image
4. Type your editing instructions (e.g., "make it black and white", "add a sunset background", "remove the background")
5. Press Send
6. The AI will generate an edited version of your image

## Technical Details

### Google Gemini Configuration

```typescript
const config = {
  responseModalities: ['IMAGE', 'TEXT'],
  imageConfig: {
    imageSize: '1K', // or '2K', '4K'
  },
  tools: [
    {
      googleSearch: {}, // Enables web search for context
    },
  ],
};
```

### Streaming Implementation

The implementation uses a custom `ReadableStream` to handle:
- Text chunks from the model
- Binary image data (base64 encoded)
- Error handling
- Proper stream closure

### Image Processing Flow

#### Generation Mode (No Input Image)
1. **Request**: User sends text prompt
2. **Generation**: Gemini generates image as base64-encoded data
3. **Decoding**: Convert base64 to Buffer
4. **Upload**: Upload to Vercel Blob using `put()`
5. **Stream**: Send public URL to client via SSE
6. **Display**: Client renders image in chat interface
7. **Save**: Image URL saved to conversation history

#### Editing Mode (With Input Image)
1. **Upload**: User uploads image via UI
2. **Storage**: Image stored in Vercel Blob
3. **Request**: User sends editing instructions with image URL
4. **Fetch**: API fetches the input image
5. **Convert**: Image converted to base64 and sent to Gemini
6. **Generation**: Gemini generates edited image
7. **Upload**: New image uploaded to Vercel Blob
8. **Stream**: Send public URL to client via SSE
9. **Display**: Client renders edited image
10. **Save**: Both original and edited images saved in conversation

## Error Handling

The implementation handles:
- Missing API keys
- Authentication failures
- Invalid prompts
- Network errors during streaming
- Upload failures
- Malformed responses

## Limitations

1. **Model Availability**: Requires access to `gemini-3-pro-image-preview`
2. **Rate Limits**: Subject to Google AI API rate limits
3. **Image Sizes**: Limited to 1K, 2K, or 4K resolutions
4. **Runtime**: Uses Node.js runtime (not Edge) due to Buffer requirements

## Future Enhancements

Potential improvements:
- [ ] Add image size selector in UI
- [x] Support image editing/refinement ✅
- [ ] Add style presets (realistic, artistic, etc.)
- [x] Implement image-to-image generation ✅
- [ ] Add negative prompts
- [ ] Support batch generation
- [ ] Add download button for images
- [ ] Implement image gallery view
- [ ] Add before/after comparison view for edited images
- [ ] Support multiple image inputs for compositing

## Dependencies

New packages added:
```json
{
  "@google/genai": "^latest",
  "mime": "^latest"
}
```

## Testing

### Testing Image Generation

1. Ensure `GEMINI_API_KEY` is set
2. Start the development server: `npm run dev`
3. Navigate to `/ai`
4. Select "Gemini Image Generation"
5. Try prompts like:
   - "A serene Japanese garden"
   - "Abstract geometric patterns"
   - "A cyberpunk street scene"
   - "A photorealistic portrait of a robot"

### Testing Image Editing

1. Navigate to `/ai`
2. Select "Gemini Image Generation"
3. Upload a photo (click upload button or drag & drop)
4. Try editing prompts like:
   - "Make it black and white"
   - "Add a sunset in the background"
   - "Make it look like a watercolor painting"
   - "Remove the background"
   - "Add dramatic lighting"
   - "Make it look vintage"

## Troubleshooting

### Images Not Generating
- Check `GEMINI_API_KEY` is valid
- Verify API quota hasn't been exceeded
- Check browser console for errors

### Upload Failures
- Ensure `BLOB_READ_WRITE_TOKEN` is configured
- Check Vercel Blob storage is enabled
- Verify file size limits

### Streaming Issues
- Check network tab for SSE connection
- Verify no proxy/firewall blocking SSE
- Check server logs for errors

## References

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Server-Sent Events (SSE) Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)

