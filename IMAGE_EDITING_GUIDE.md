# Image Generation & Editing Guide

This guide shows you how to use the AI-powered image generation and editing features.

## 🎨 Image Generation Mode

### How to Generate Images

1. **Select the Model**
   - Navigate to `/ai`
   - Click the model dropdown
   - Select "Gemini Image Generation"

2. **Enter Your Prompt**
   - The placeholder will say: "Describe the image you want to generate..."
   - Type a detailed description of what you want

3. **Examples of Good Prompts**
   ```
   ✅ "A serene Japanese garden with cherry blossoms and a koi pond"
   ✅ "Abstract geometric patterns in blue and gold"
   ✅ "A cyberpunk street scene at night with neon signs"
   ✅ "A photorealistic portrait of a friendly robot"
   ✅ "A cozy coffee shop interior with warm lighting"
   ```

4. **Press Send**
   - The image will generate in real-time
   - You'll see it appear in the chat as it's created

## ✏️ Image Editing Mode

### How to Edit Images

1. **Select the Model**
   - Navigate to `/ai`
   - Select "Gemini Image Generation" from the dropdown

2. **Upload Your Image**
   - Click the upload button (📎 icon)
   - Or drag and drop an image into the chat
   - Supported formats: JPG, PNG, GIF, WebP
   - The UI will show "(Image editing mode)"

3. **Describe Your Edits**
   - The placeholder will say: "Describe how to edit the image..."
   - Type natural language instructions for how to modify the image

4. **Examples of Editing Prompts**
   ```
   ✅ "Make it black and white"
   ✅ "Add a beautiful sunset in the background"
   ✅ "Make it look like a watercolor painting"
   ✅ "Remove the background"
   ✅ "Add dramatic lighting and shadows"
   ✅ "Make it look vintage with a sepia tone"
   ✅ "Increase the contrast and saturation"
   ✅ "Add snow falling in the scene"
   ✅ "Change the time of day to golden hour"
   ✅ "Make it look like a comic book illustration"
   ```

5. **Press Send**
   - The AI will process your image with the requested edits
   - The edited version will stream in real-time
   - Both the original and edited versions are saved in the conversation

## 💡 Tips for Best Results

### For Image Generation
- **Be Specific**: Include details about style, colors, mood, lighting
- **Use Descriptive Language**: "photorealistic", "abstract", "minimalist", etc.
- **Mention Composition**: "close-up", "wide angle", "bird's eye view"
- **Specify Mood**: "serene", "dramatic", "playful", "mysterious"

### For Image Editing
- **Be Clear**: State exactly what you want changed
- **One Change at a Time**: For best results, make one edit per request
- **Use Action Verbs**: "add", "remove", "change", "enhance", "convert"
- **Specify Style**: "realistic", "artistic", "painterly", "sketch-like"

## 🔄 Iterative Editing

You can edit images multiple times in a conversation:

1. Upload an image → Edit it
2. The edited image appears in the chat
3. Upload the edited image again → Make more changes
4. Repeat as needed

Example conversation:
```
User: [uploads photo] "Make it black and white"
AI: [generates B&W version]

User: [uploads B&W version] "Add dramatic film grain"
AI: [generates grainy B&W version]

User: [uploads grainy version] "Increase the contrast"
AI: [generates high-contrast grainy B&W version]
```

## 🚫 Limitations

- **One Image at a Time**: In editing mode, you can only upload one image
- **File Size**: Images should be under 10MB
- **Processing Time**: Complex edits may take 10-30 seconds
- **Style Consistency**: Results may vary based on prompt clarity

## 🎯 Use Cases

### Creative Projects
- Generate concept art
- Create social media graphics
- Design book covers
- Make custom wallpapers

### Photo Enhancement
- Adjust lighting and colors
- Apply artistic filters
- Remove backgrounds
- Add weather effects

### Style Transfer
- Convert photos to paintings
- Apply vintage effects
- Create comic book versions
- Make minimalist versions

## 🛠️ Troubleshooting

### Image Won't Upload
- Check file format (JPG, PNG, GIF, WebP)
- Ensure file is under 10MB
- Try refreshing the page

### Edits Don't Match Expectations
- Be more specific in your prompt
- Try breaking complex edits into steps
- Use reference style terms (e.g., "like a Monet painting")

### Generation Takes Too Long
- Complex prompts may take longer
- Check your internet connection
- Try a simpler prompt first

## 📝 Example Workflows

### Workflow 1: Creating a Logo
```
1. Generate: "A minimalist logo of a mountain peak in blue"
2. Edit: "Make the blue darker and add a subtle gradient"
3. Edit: "Add a thin circular border around it"
4. Edit: "Make the background transparent"
```

### Workflow 2: Photo Enhancement
```
1. Upload: [your photo]
2. Edit: "Enhance the colors and increase brightness"
3. Edit: "Add a subtle vignette effect"
4. Edit: "Make it look like it was taken during golden hour"
```

### Workflow 3: Artistic Transformation
```
1. Upload: [your photo]
2. Edit: "Convert to a watercolor painting style"
3. Edit: "Add more vibrant colors"
4. Edit: "Make the brush strokes more visible"
```

## 🎓 Advanced Tips

1. **Combine Multiple Effects**: "Make it black and white with high contrast and add a vintage film grain effect"

2. **Reference Styles**: "Make it look like a Studio Ghibli animation" or "In the style of Van Gogh"

3. **Specify Details**: Instead of "make it better", say "increase saturation by 20% and add slight sharpening"

4. **Use Comparisons**: "Make the sky more dramatic, like a storm is approaching"

5. **Iterative Refinement**: Start with broad changes, then fine-tune with specific adjustments

## 🔐 Privacy Note

- Uploaded images are stored in Vercel Blob storage
- Images are associated with your account
- Generated/edited images are saved in your conversation history
- You can delete conversations to remove images

## 📚 Additional Resources

- [Google Gemini Documentation](https://ai.google.dev/docs)
- [Image Generation Best Practices](https://ai.google.dev/docs/image_generation)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

**Need Help?** If you encounter issues or have questions, check the troubleshooting section or refer to the main documentation.

