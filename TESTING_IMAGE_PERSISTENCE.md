# Testing Image Generation Persistence

This guide helps you verify that generated images are properly saved and restored in chat conversations.

## What Was Fixed

Previously, generated images were displayed in the chat but not persisted to the database. Now:

1. **Saving**: Generated images are saved in the `metadata` field of `ChatMessages` table
2. **Loading**: When you reload a conversation, generated images are restored from the database
3. **Display**: Images appear exactly as they did before, even after refreshing or navigating away

## Database Schema

Generated images are stored in the `metadata` JSONB column:

```json
{
  "attachments": [...],  // User-uploaded files
  "generatedImages": [   // AI-generated images
    {
      "id": "uuid",
      "url": "https://blob.vercel-storage.com/...",
      "mimeType": "image/png"
    }
  ]
}
```

## How to Test

### Test 1: Basic Image Generation Persistence

1. **Generate an Image**
   ```
   - Navigate to /ai
   - Select "Gemini Image Generation"
   - Type: "A serene mountain landscape"
   - Press Send
   - Wait for image to generate
   ```

2. **Verify Initial Display**
   ```
   - Image should appear in the chat
   - Image should have a working URL
   - Image should be clickable to open in new tab
   ```

3. **Test Persistence**
   ```
   - Navigate away (go to home page)
   - Come back to /ai
   - Click on the conversation in the sidebar
   - ✅ Image should still be visible
   ```

4. **Test Page Refresh**
   ```
   - While viewing the conversation, refresh the page (Cmd+R / Ctrl+R)
   - Click on the conversation again
   - ✅ Image should still be visible
   ```

### Test 2: Multiple Images in One Conversation

1. **Generate Multiple Images**
   ```
   - In the same conversation:
   - Generate: "A sunset over the ocean"
   - Generate: "A cyberpunk city at night"
   - Generate: "Abstract geometric patterns"
   ```

2. **Verify All Images Display**
   ```
   - All three images should be visible in order
   - Each should have its own message bubble
   ```

3. **Test Persistence**
   ```
   - Navigate away and come back
   - ✅ All three images should still be visible
   ```

### Test 3: Image Editing Persistence

1. **Upload and Edit an Image**
   ```
   - Select "Gemini Image Generation"
   - Upload a photo
   - Type: "Make it black and white"
   - Press Send
   - Wait for edited image
   ```

2. **Verify Both Images**
   ```
   - User message should show the original uploaded image
   - Assistant message should show the edited image
   ```

3. **Test Persistence**
   ```
   - Navigate away and come back
   - ✅ Both original and edited images should be visible
   ```

### Test 4: Mixed Content Conversation

1. **Create Mixed Conversation**
   ```
   - Start with regular chat: "Hello, how are you?"
   - Switch to image generation: Generate an image
   - Back to chat: "That looks great!"
   - Generate another image
   ```

2. **Test Persistence**
   ```
   - Navigate away and come back
   - ✅ All messages (text and images) should be in correct order
   ```

### Test 5: Cross-Session Persistence

1. **Generate Images**
   ```
   - Generate 2-3 images in a conversation
   - Note the conversation title
   ```

2. **Close Browser**
   ```
   - Close the browser completely
   - Wait 1 minute
   ```

3. **Reopen and Verify**
   ```
   - Open browser and navigate to /ai
   - Log in if needed
   - Find the conversation in sidebar
   - Click to open
   - ✅ All images should still be visible
   ```

## Verification Checklist

Use this checklist to verify everything works:

- [ ] Generated images appear immediately after generation
- [ ] Images persist after navigating away
- [ ] Images persist after page refresh
- [ ] Images persist after browser restart
- [ ] Multiple images in one conversation all persist
- [ ] Image URLs are valid and images load
- [ ] Images can be opened in new tab
- [ ] Edited images (from uploaded photos) persist
- [ ] Original uploaded images persist
- [ ] Mixed text and image conversations persist correctly
- [ ] Image order is maintained
- [ ] Images appear in conversation history sidebar

## Troubleshooting

### Images Don't Persist

**Check Database**:
```sql
-- Connect to your Supabase database
SELECT id, role, content, metadata 
FROM "ChatMessages" 
WHERE metadata->>'generatedImages' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

You should see entries with `generatedImages` in the metadata.

**Check Browser Console**:
- Open DevTools (F12)
- Look for errors when loading conversation
- Check Network tab for failed requests

**Check API Response**:
```javascript
// In browser console while viewing a conversation
fetch('/api/chat/conversations/CONVERSATION_ID')
  .then(r => r.json())
  .then(data => console.log(data.messages))
```

Look for `generatedImages` array in assistant messages.

### Images Load Slowly

- This is normal for first load
- Images are hosted on Vercel Blob
- Subsequent loads should be faster (cached)

### Images Show Broken

- Check if Vercel Blob storage is configured
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check if URLs are accessible (try opening in new tab)

## Database Queries for Debugging

### Count Messages with Generated Images
```sql
SELECT COUNT(*) 
FROM "ChatMessages" 
WHERE metadata->>'generatedImages' IS NOT NULL;
```

### View Recent Generated Images
```sql
SELECT 
  id,
  conversation_id,
  content,
  metadata->'generatedImages' as images,
  created_at
FROM "ChatMessages"
WHERE metadata->>'generatedImages' IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### Find Conversations with Generated Images
```sql
SELECT DISTINCT 
  cc.id,
  cc.title,
  cc.created_at,
  COUNT(cm.id) as image_count
FROM "ChatConversations" cc
JOIN "ChatMessages" cm ON cm.conversation_id = cc.id
WHERE cm.metadata->>'generatedImages' IS NOT NULL
GROUP BY cc.id, cc.title, cc.created_at
ORDER BY cc.created_at DESC;
```

## Expected Behavior

### When Saving
1. User generates image
2. Image streams to client
3. Client calls `saveMessage` with `generatedImages` array
4. API stores in `metadata.generatedImages`
5. Database write succeeds

### When Loading
1. User opens conversation
2. API fetches messages from database
3. API extracts `generatedImages` from metadata
4. Client receives messages with `generatedImages` array
5. UI renders images

## Code Flow

### Saving Flow
```
ChatInterface.tsx (handleSubmit)
  → Generates image
  → Calls saveMessage(conversationId, { 
      role: 'assistant', 
      content: '...', 
      generatedImages: [...] 
    })
  → POST /api/chat/conversations/[id]/message
  → Stores in metadata: { generatedImages: [...] }
  → Database write
```

### Loading Flow
```
ChatInterface.tsx (loadConversation)
  → GET /api/chat/conversations/[id]
  → API fetches messages
  → API extracts metadata.generatedImages
  → Returns messages with generatedImages
  → UI renders with generatedImages
```

## Success Criteria

✅ **Test Passed** if:
- Images appear after generation
- Images persist across navigation
- Images persist across page refresh
- Images persist across browser restart
- Multiple images work correctly
- No console errors
- Database contains generatedImages in metadata

❌ **Test Failed** if:
- Images disappear after navigation
- Images don't load on conversation reopen
- Console shows errors
- Database doesn't contain generatedImages
- Images show as broken

## Performance Notes

- **First Load**: 1-3 seconds (fetching from Vercel Blob)
- **Cached Load**: <100ms (browser cache)
- **Database Query**: <50ms (indexed conversation_id)
- **Total Load Time**: ~1-3 seconds for conversation with images

## Security Notes

- Images are stored in Vercel Blob with public access
- URLs are unguessable (random tokens)
- Only authenticated users can generate images
- Images are associated with user's conversations
- Deleting conversation doesn't auto-delete images (consider cleanup job)

## Next Steps

After verifying persistence works:

1. **Monitor Storage**: Check Vercel Blob usage
2. **Add Cleanup**: Consider job to delete orphaned images
3. **Add Analytics**: Track image generation usage
4. **Optimize Loading**: Consider lazy loading for many images
5. **Add Download**: Let users download generated images

---

**Need Help?** If tests fail, check:
1. Browser console for errors
2. Network tab for failed requests
3. Database for missing metadata
4. Vercel Blob dashboard for storage issues

