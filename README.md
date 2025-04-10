# James Peralta Personal Website

A modern personal website showcasing videos, blog posts, and portfolio items. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- Responsive design with modern styling inspired by LeetCode's dark theme
- YouTube API integration for automatically displaying your latest videos
- View counts and publish dates for videos
- Dark mode by default
- Mobile-friendly navigation
- Infinite scrolling on videos page to load more content as you scroll

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Google Cloud Platform account for YouTube Data API access

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
   - Copy the `.env.local.example` file to `.env.local` and fill in your YouTube API key and channel ID.

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
10. Add your channel ID to `.env.local`:
    ```
    YOUTUBE_CHANNEL_ID=your_channel_id_here
    ```

## Customization

- **Content**: Edit the text in `src/app/page.tsx` to customize the homepage content.
- **Colors**: The primary color scheme uses LeetCode's green (#2cbb5d). You can modify colors in the TailwindCSS classes.
- **Topics**: Update the topics section in `src/app/page.tsx` to highlight your areas of expertise.
- **Links**: Update social media links in the community section.

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

