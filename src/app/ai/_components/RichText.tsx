import React from 'react';

interface MarkdownBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'blockquote' | 'video' | 'preformatted';
  content: string | string[];
  level?: number;
  ordered?: boolean;
  language?: string;
  videoUrl?: string;
  videoTitle?: string;
}

interface VideoInfo {
  id: string;
  url: string;
  title?: string;
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Extract YouTube video ID from various URL formats
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Extract YouTube URLs and their titles from text
const extractYouTubeLinks = (text: string): Array<{ url: string; id: string; title?: string }> => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
  const links: Array<{ url: string; id: string; title?: string }> = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = youtubeRegex.exec(text)) !== null) {
    const videoId = match[1];
    if (seen.has(videoId)) continue;
    seen.add(videoId);
    
    // Try to extract title from markdown link format: [Title](url) or plain text before URL
    const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
    const beforeUrl = text.substring(0, match.index);
    const markdownLinkMatch = beforeUrl.match(/\[([^\]]+)\]\([^)]*$/);
    const title = markdownLinkMatch ? markdownLinkMatch[1] : undefined;
    
    links.push({ url, id: videoId, title });
  }
  
  return links;
};

// Get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const formatInline = (text: string, removeYouTubeUrls = false) => {
  let html = escapeHtml(text);

  // Remove YouTube URLs if we're rendering them separately
  if (removeYouTubeUrls) {
    html = html.replace(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g, '');
  }

  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (match, linkText, linkUrl) => {
    // Check if it's a YouTube URL - if so, we'll render it separately
    const videoId = extractYouTubeVideoId(linkUrl);
    if (videoId) {
      return match; // Keep the markdown link for now, we'll handle it separately
    }
    return `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" class="text-[#2cbb5d] underline">${escapeHtml(linkText)}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-lg">$1</code>');

  return html;
};

const parseMarkdown = (content: string): MarkdownBlock[] => {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];

  let paragraphLines: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let codeBlock: { language?: string; lines: string[] } | null = null;
  let blockquoteLines: string[] | null = null;
  let videoSection: VideoInfo[] | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      // Preserve newlines for content that looks like timestamps or structured data
      // (lines starting with time codes, numbers, or short structured entries)
      const looksLikeStructuredContent = paragraphLines.some(line => 
        /^\d{1,2}:\d{2}(:\d{2})?/.test(line.trim()) || // Timestamps like 00:00:00 or 0:00
        /^#\w/.test(line.trim()) // Hashtags like #resumetips
      );
      
      if (looksLikeStructuredContent) {
        // Use preformatted type to preserve line breaks without extra spacing
        blocks.push({ type: 'preformatted', content: paragraphLines.join('\n') });
      } else {
        blocks.push({ type: 'paragraph', content: paragraphLines.join(' ') });
      }
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push({ type: 'list', content: list.items, ordered: list.type === 'ol' });
      list = null;
    }
  };

  const flushCode = () => {
    if (codeBlock) {
      blocks.push({ type: 'code', content: codeBlock.lines.join('\n'), language: codeBlock.language });
      codeBlock = null;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines && blockquoteLines.length > 0) {
      blocks.push({ type: 'blockquote', content: blockquoteLines.join(' ') });
      blockquoteLines = null;
    }
  };

  const flushVideoSection = () => {
    if (videoSection && videoSection.length > 0) {
      blocks.push({ type: 'video', content: videoSection.map(v => v.url).join('\n'), videoUrl: videoSection[0].url, videoTitle: videoSection[0].title });
      // Add remaining videos as separate blocks
      for (let i = 1; i < videoSection.length; i++) {
        blocks.push({ type: 'video', content: videoSection[i].url, videoUrl: videoSection[i].url, videoTitle: videoSection[i].title });
      }
      videoSection = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (codeBlock) {
      if (line.startsWith('```')) {
        flushCode();
      } else {
        codeBlock.lines.push(rawLine);
      }
      continue;
    }

    const codeStart = line.match(/^```(.*)/);
    if (codeStart) {
      flushParagraph();
      flushList();
      flushBlockquote();
      codeBlock = { language: codeStart[1]?.trim() || undefined, lines: [] };
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      blocks.push({ type: 'heading', level: headingMatch[1].length, content: headingMatch[2] });
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.*)/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      if (!blockquoteLines) blockquoteLines = [];
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    } else if (blockquoteLines) {
      flushBlockquote();
    }

    // Check for "Related videos" section or YouTube URLs in list items
    const unorderedMatch = line.match(/^[-*+]\s+(.*)/);
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    
    // Check if line contains YouTube URL
    const youtubeLinks = extractYouTubeLinks(line);
    const isRelatedVideosSection = line.toLowerCase().includes('related videos') || 
                                   (blocks.length > 0 && blocks[blocks.length - 1].type === 'heading' && 
                                    blocks[blocks.length - 1].content.toString().toLowerCase().includes('related'));

    if (youtubeLinks.length > 0 && (isRelatedVideosSection || unorderedMatch || orderedMatch)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      
      // Extract title from list item text (everything before the URL)
      youtubeLinks.forEach(link => {
        const listItemText = unorderedMatch ? unorderedMatch[1] : (orderedMatch ? orderedMatch[2] : '');
        // Try to extract title from markdown link or text before URL
        const markdownMatch = listItemText.match(/\[([^\]]+)\]\([^)]*youtube[^)]*\)/);
        const plainTextMatch = listItemText.match(/^(.+?)\s*https?:\/\//);
        link.title = markdownMatch ? markdownMatch[1] : (plainTextMatch ? plainTextMatch[1].trim() : undefined);
      });
      
      if (!videoSection) videoSection = [];
      videoSection.push(...youtubeLinks);
      continue;
    }

    if (unorderedMatch) {
      flushParagraph();
      flushBlockquote();
      flushVideoSection();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(unorderedMatch[1]);
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      flushBlockquote();
      flushVideoSection();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(orderedMatch[2]);
      continue;
    }

    if (line === '') {
      flushParagraph();
      flushList();
      flushBlockquote();
      flushVideoSection();
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  flushCode();
  flushBlockquote();
  flushVideoSection();

  return blocks;
};

const VideoSuggestionCard = ({ videoId, url, title }: { videoId: string; url: string; title?: string }) => {
  const thumbnailUrl = getYouTubeThumbnail(videoId);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 group"
    >
      <div className="flex gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-[#2cbb5d] transition-colors bg-gray-50 dark:bg-gray-700/50">
        <div className="relative flex-shrink-0 w-32 h-20 rounded overflow-hidden bg-gray-200 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to hqdefault if maxresdefault fails
              const target = e.target as HTMLImageElement;
              if (target.src.includes('maxresdefault')) {
                target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="w-8 h-8 bg-[#2cbb5d] rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {title ? (
            <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100 group-hover:text-[#2cbb5d] transition-colors line-clamp-2">
              {title}
            </h4>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{url}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">YouTube</p>
        </div>
      </div>
    </a>
  );
};

const renderBlock = (block: MarkdownBlock, index: number) => {
  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <HeadingTag
          key={index}
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      // Check if list items contain YouTube URLs
      const items = block.content as string[];
      const hasYouTubeLinks = items.some(item => extractYouTubeLinks(item).length > 0);
      
      if (hasYouTubeLinks) {
        // Extract and render videos separately
        const videoBlocks: React.ReactNode[] = [];
        const textItems: string[] = [];
        
        items.forEach((item, idx) => {
          const links = extractYouTubeLinks(item);
          if (links.length > 0) {
            links.forEach(link => {
              const videoId = extractYouTubeVideoId(link.url);
              if (videoId) {
                // Extract title from item text - handle formats like:
                // "Title — https://youtube.com/..." or "[Title](url)" or "Title https://..."
                let title: string | undefined;
                
                // Try markdown link format first
                const markdownMatch = item.match(/\[([^\]]+)\]\([^)]*youtube[^)]*\)/);
                if (markdownMatch) {
                  title = markdownMatch[1];
                } else {
                  // Try to extract text before the URL (remove common separators like —, -, |)
                  const urlIndex = item.indexOf(link.url);
                  if (urlIndex > 0) {
                    const beforeUrl = item.substring(0, urlIndex)
                      .replace(/^[-*+]\s*/, '') // Remove list marker
                      .replace(/[-—–|]\s*$/, '') // Remove trailing separators
                      .trim();
                    if (beforeUrl) {
                      title = beforeUrl;
                    }
                  }
                }
                
                videoBlocks.push(
                  <VideoSuggestionCard
                    key={`video-${index}-${idx}-${link.id}`}
                    videoId={videoId}
                    url={link.url}
                    title={title}
                  />
                );
              }
            });
            // Don't add the list item text if it only contains the YouTube URL
            // (we're rendering it as a video card instead)
          } else {
            textItems.push(item);
          }
        });
        
        return (
          <React.Fragment key={index}>
            {textItems.length > 0 && (
              <ListTag
                className="ml-5 space-y-1 list-outside text-gray-900 dark:text-gray-100"
                style={{ listStyleType: block.ordered ? 'decimal' : 'disc' }}
              >
                {textItems.map((item, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                ))}
              </ListTag>
            )}
            {videoBlocks}
          </React.Fragment>
        );
      }
      
      return (
        <ListTag
          key={index}
          className="ml-5 space-y-1 list-outside text-gray-900 dark:text-gray-100"
          style={{ listStyleType: block.ordered ? 'decimal' : 'disc' }}
        >
          {items.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ListTag>
      );
    }
    case 'video': {
      if (!block.videoUrl) return null;
      const videoId = extractYouTubeVideoId(block.videoUrl);
      if (!videoId) return null;
      return (
        <VideoSuggestionCard
          key={index}
          videoId={videoId}
          url={block.videoUrl}
          title={block.videoTitle}
        />
      );
    }
    case 'code': {
      return (
        <pre
          key={index}
          className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-lg"
        >
          <code>{block.content as string}</code>
        </pre>
      );
    }
    case 'blockquote': {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-[#2cbb5d] pl-3 italic text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: formatInline(block.content as string) }}
        />
      );
    }
    case 'preformatted': {
      // Render content with preserved line breaks but no extra spacing
      const lines = (block.content as string).split('\n');
      return (
        <div key={index} className="text-gray-900 dark:text-gray-100">
          {lines.map((line, idx) => (
            <div key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          ))}
        </div>
      );
    }
    default: {
      // Check if paragraph contains YouTube URLs
      const text = block.content as string;
      const youtubeLinks = extractYouTubeLinks(text);
      
      if (youtubeLinks.length > 0) {
        // Split text and render videos separately
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        
        youtubeLinks.forEach((link, idx) => {
          const urlIndex = text.indexOf(link.url, lastIndex);
          if (urlIndex > lastIndex) {
            const beforeText = text.substring(lastIndex, urlIndex);
            if (beforeText.trim()) {
              parts.push(
                <span
                  key={`text-${idx}`}
                  dangerouslySetInnerHTML={{ __html: formatInline(beforeText, true) }}
                />
              );
            }
          }
          
          const videoId = extractYouTubeVideoId(link.url);
          if (videoId) {
            parts.push(
              <VideoSuggestionCard
                key={`video-${idx}`}
                videoId={videoId}
                url={link.url}
                title={link.title}
              />
            );
          }
          
          lastIndex = urlIndex + link.url.length;
        });
        
        if (lastIndex < text.length) {
          const afterText = text.substring(lastIndex);
          if (afterText.trim()) {
            parts.push(
              <span
                key="text-after"
                dangerouslySetInnerHTML={{ __html: formatInline(afterText, true) }}
              />
            );
          }
        }
        
        return (
          <p key={index} className="text-gray-900 dark:text-gray-100">
            {parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: formatInline(text) }} />}
          </p>
        );
      }
      
      return (
        <p
          key={index}
          className="text-gray-900 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: formatInline(text) }}
        />
      );
    }
  }
};

export function RichText({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="space-y-3 leading-relaxed text-lg">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export default RichText;
