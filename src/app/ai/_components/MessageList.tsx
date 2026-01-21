import type React from 'react';
import { Message } from '@/types/chat';
import { suggestedQueries } from './suggestedQueries';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  selectedModel: string;
  onSuggestedQueryClick: (query: string) => void;
  onOpenTimestampModal: () => void;
  onOpenTutorialModal: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList = ({
  messages,
  isLoading,
  selectedModel,
  onSuggestedQueryClick,
  onOpenTimestampModal,
  onOpenTutorialModal,
  messagesEndRef,
}: MessageListProps) => (
  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
    {selectedModel === 'gemini-3-pro-image-preview' && messages.length === 0 && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Image Generation Mode</h3>
            <ul className="text-base text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Generate:</strong> Describe the image you want to create</li>
              <li>• <strong>Edit:</strong> Upload an image, then describe how to modify it</li>
              <li>• Examples: &quot;A futuristic city&quot;, &quot;Make it black and white&quot;, &quot;Add a sunset background&quot;</li>
            </ul>
          </div>
        </div>
      </div>
    )}

    {messages.length === 0 && selectedModel !== 'gemini-3-pro-image-preview' ? (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            How can I help you today?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Ask me anything or start a conversation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {suggestedQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (example.title === 'Generate Chapters & Timestamps') {
                    onOpenTimestampModal();
                  } else {
                    onSuggestedQueryClick(example.query);
                  }
                }}
                className="p-4 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-semibold text-base text-gray-800 dark:text-gray-200">
                  {example.title}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenTutorialModal}
              className="p-4 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="font-semibold text-base text-gray-800 dark:text-gray-200">
                Algorithms Tutor
              </div>
            </button>
          </div>
        </div>
      </div>
    ) : (
      <>
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </>
    )}
  </div>
);
