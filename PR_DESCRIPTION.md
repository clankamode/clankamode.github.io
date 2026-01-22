# Enhance Block Editor UX and Polish

## Overview
This PR improves the block editor experience with better spacing, field clarity, and UX refinements.

## Changes

### Editor Improvements
- **Spacing adjustments**: Reduced block spacing (space-y-6 → space-y-5) and padding (p-5 → p-4) for more compact layout
- **Image constraints**: Added max-height (600px) to prevent oversized images in editor
- **Callout improvements**: Reduced textarea min-height (120px → 80px) with resize capability, added w-full for proper width
- **Preview container**: Removed max-height restriction to allow natural content flow

### Field UX Fixes
- **Caption field**: Added label and improved placeholder text for clarity
- **Paste handling**: Fixed paste handler to not intercept paste events in input/textarea fields
- **Empty value handling**: Normalized empty caption values to undefined for better placeholder display

### Tooltips & Accessibility
- **Slug lock button**: Added tooltip explaining auto-generation behavior

### Code Quality
- Removed AI-generated slop (unnecessary comments, defensive checks)
- Simplified error handling in API routes
- Cleaned up authentication helpers

## Testing
- [x] All editor fields work correctly
- [x] Paste into embed field works as expected
- [x] Image sizing is appropriate
- [x] Caption field shows placeholder correctly
- [x] Tooltips display properly

## Files Changed
- `BlockEditor.tsx` - Main editor component improvements
- `ImageBlock.tsx` - Image display and caption field fixes
- `CalloutBlock.tsx` - Spacing and textarea improvements
- `ArticleForm.tsx` - Slug lock tooltip
- `MarkdownEditor.tsx` - Preview container fix
- API routes - Code cleanup

## Commits
- refactor: remove AI-generated slop
- fix: improve image and embed field UX
- refactor: remove drag-and-drop block reordering
- feat: improve editor UX with drag-and-drop, spacing adjustments, and tooltips
