'use client';

import { Message } from '@/types/chat';
import RichText from './RichText';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

// Image component with error handling
function SafeImage({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (imgError) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-interactive rounded-lg`}>
        <div className="text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-muted-foreground">Image failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-surface-interactive animate-pulse`} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
      />
    </div>
  );
}

export const MessageBubble = ({ message }: MessageBubbleProps) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[80%] rounded-lg p-4 ${
        message.role === 'user'
          ? 'bg-brand-green text-black'
          : 'bg-surface-interactive text-foreground'
      }`}
    >
      {message.attachments && message.attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {message.attachments.map((attachment) => (
            <div key={attachment.id}>
              {attachment.type === 'image' ? (
                <SafeImage
                  src={attachment.url || ''}
                  alt={attachment.name}
                  className="max-w-full rounded-lg max-h-64 object-contain relative"
                />
              ) : (
                <div className="space-y-2">
                  {attachment.url && (
                    <iframe
                      src={attachment.url}
                      className="w-full h-96 rounded-lg border border-border-subtle"
                      title={attachment.name}
                    />
                  )}
                  <div
                    className={`flex items-center gap-2 p-2 rounded ${
                      message.role === 'user'
                        ? 'bg-brand-green/80 text-black'
                        : 'bg-surface-dense'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-base truncate">{attachment.name}</span>
                    {attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline ml-auto"
                      >
                        Open in new tab
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {message.generatedImages && message.generatedImages.length > 0 && (
        <div className="mb-3 space-y-2">
          {message.generatedImages.map((image) => (
            <div key={image.id} className="space-y-2">
              <SafeImage
                src={image.url}
                alt="Generated image"
                className="max-w-md w-full rounded-lg object-contain max-h-96 cursor-pointer hover:opacity-90 transition-opacity relative"
                onClick={() => window.open(image.url, '_blank')}
              />
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline block hover:text-foreground"
              >
                Open full size in new tab
              </a>
            </div>
          ))}
        </div>
      )}
      <RichText content={message.content} />
    </div>
  </div>
);
