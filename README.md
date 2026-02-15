# James Peralta Personal Website

> **For AI Assistants**: See [`CLAUDE.md`](./CLAUDE.md) for development conventions and patterns.

A modern personal website showcasing videos, blog posts, and portfolio items. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- Responsive design with modern styling inspired by LeetCode's dark theme
- YouTube API integration for automatically displaying your latest videos
- View counts and publish dates for videos
- Dark mode by default
- Mobile-friendly navigation
- Infinite scrolling on videos page to load more content as you scroll
- Google OAuth authentication
- AI Chat interface with multiple models (GPT-4.1, GPT-5)
- **AI Image Generation & Editing** powered by Google Gemini with real-time streaming
- Fix the themes. Make it editable in one spot.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Google Cloud Platform account for YouTube Data API access and OAuth

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/personal-website.git
   cd personal-website
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy the `.env.local.example` file to `.env.local` and fill in your YouTube API key, channel ID, and OAuth credentials.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view your site.

## Setting Up YouTube Data API

To display your YouTube videos, you need to set up the YouTube Data API:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Navigate to "APIs & Services" > "Library".
4. Search for "YouTube Data API v3" and enable it.
5. Go to "APIs & Services" > "Credentials".
6. Click "Create Credentials" and select "API Key".
7. Copy your API key.
8. In your `.env.local` file, paste your API key:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```
9. To find your YouTube channel ID:
   - Go to your YouTube channel
   - Look at the URL: https://www.youtube.com/channel/YOUR_CHANNEL_ID
   - Or if you have a custom URL, you can use a tool like [Comment Picker](https://commentpicker.com/youtube-channel-id.php)

## Setting Up Google OAuth

To enable Google login functionality:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to the same project you created for the YouTube API or create a new one.
3. Go to "APIs & Services" > "OAuth consent screen".
   - Set up the OAuth consent screen with your app name and contact information.
   - Add the necessary scopes (typically `userinfo.email` and `userinfo.profile`).
   - Add your email as a test user if you're in testing mode.

4. Go to "APIs & Services" > "Credentials".
5. Click "Create Credentials" > "OAuth client ID".
   - Select "Web application" as the application type.
   - Add your app's URL to "Authorized JavaScript origins":
     - For local development: `http://localhost:3000`
     - For production: Your actual domain
   - Add redirect URIs:
     - For local development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-domain.com/api/auth/callback/google`

6. Copy the generated Client ID and Client Secret.

7. Add these credentials to your `.env.local` file:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_URL=http://localhost:3000 # or your production URL
   NEXTAUTH_SECRET=your_generated_secret # Generate with: openssl rand -base64 32
   ```

8. Now you should be able to sign in with Google.

## Setting Up Google Gemini Image Generation

To enable AI image generation in the chat interface:

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Navigate to "Get API Key" in the left sidebar.
4. Create a new API key or use an existing one.
5. Add the API key to your `.env.local` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

6. The image generation model will now be available in the chat interface.
   - Select "Gemini Image Generation" from the model dropdown
   - **Generate**: Type your image prompt and press Send
   - **Edit**: Upload an image, then describe how to modify it (e.g., "make it black and white", "add a sunset")
   - Generated/edited images will stream in real-time and be automatically uploaded to Vercel Blob storage

**Note**: Make sure you have Vercel Blob storage configured for image uploads. The generated images are stored using the same upload endpoint as other chat attachments.

## Customization

- **Content**: Edit the text in `src/app/page.tsx` to customize the homepage content.
- **Colors**: The primary color scheme uses LeetCode's green (#2cbb5d). You can modify colors in the TailwindCSS classes.
- **Topics**: Update the topics section in `src/app/page.tsx` to highlight your areas of expertise.
- **Links**: Update social media links in the community section.

## Supabase tables for Live Q&A

The live question feature expects two tables in Supabase:

- **LiveQuestions**
  - `id`: uuid, primary key, default `uuid_generate_v4()`
  - `content`: text, required
  - `user_email`: text, required
  - `user_name`: text, nullable
  - `created_at`: timestamp with time zone, default `now()`
  - `is_archived`: boolean, default `false` - marks questions as answered/archived
  - `video_url`: text, nullable - URL to the video where the question was answered

- **LiveQuestionVotes**
  - `id`: uuid, primary key, default `uuid_generate_v4()`
  - `question_id`: uuid, foreign key to `LiveQuestions.id`, `on delete cascade`
  - `user_email`: text, required
  - `created_at`: timestamp with time zone, default `now()`
  - Unique constraint on (`question_id`, `user_email`) to prevent duplicate votes

## Supabase tables for Gallery

The gallery feature expects one table in Supabase:

- **HeadShots**
  - `id`: uuid, primary key, default `uuid_generate_v4()`
  - `url`: text, required - The public URL of the uploaded headshot image
  - `created_at`: timestamp with time zone, default `now()`

## Deployment

This project can be easily deployed to Vercel:

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Add your environment variables in the Vercel project settings.
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Ideas

- tell it use a terminal theme like green/black with gradients so it can give a hacker kind of vibe
- Farzan says build it like the leetcode home page

## Functional requirments
- A github style contribution graph for youtube uploads
- Build coderpad straight into my website so I can run my mock interviews there
- Build a calander feature so I can schedule streams and mock interviews
- Show youtube content
- Show stream schedule
- Maybe analytics

