import { Message } from '@/types/chat';
import RichText from './RichText';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[80%] rounded-lg p-4 ${
        message.role === 'user'
          ? 'bg-[#2cbb5d] text-white'
          : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
      }`}
    >
      {message.attachments && message.attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {message.attachments.map((attachment) => (
            <div key={attachment.id}>
              {attachment.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-full rounded-lg max-h-64 object-contain"
                />
              ) : (
                <div className="space-y-2">
                  {attachment.url && (
                    <iframe
                      src={attachment.url}
                      className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
                      title={attachment.name}
                    />
                  )}
                  <div
                    className={`flex items-center gap-2 p-2 rounded ${
                      message.role === 'user'
                        ? 'bg-[#25a352]'
                        : 'bg-gray-300 dark:bg-gray-700'
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
                    <span className="text-sm truncate">{attachment.name}</span>
                    {attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline ml-auto"
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Generated image"
                className="max-w-md w-full rounded-lg object-contain max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(image.url, '_blank')}
              />
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline block hover:text-blue-600 dark:hover:text-blue-400"
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
