/**
 * ChatMessage Component
 * 
 * Renders individual chat messages with streaming effect for AI responses.
 * Handles both user and AI persona messages with appropriate styling.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChatMessage as ChatMessageType } from '@/types/persona';

interface ChatMessageProps {
  message: ChatMessageType;
  isNewMessage?: boolean;
}

/**
 * Streaming Message Component
 * 
 * Displays messages with a streaming effect for AI responses.
 * User messages appear immediately, while AI messages stream character by character
 * to create a more natural conversation experience.
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isNewMessage = false }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (message.sender === 'user' || !isNewMessage) {
      // User messages and old messages show immediately
      setDisplayedContent(message.content);
      setIsComplete(true);
      return;
    }

    // Only new AI messages stream character by character for natural effect
    let currentIndex = 0;
    const streamInterval = setInterval(() => {
      if (currentIndex < message.content.length) {
        setDisplayedContent(message.content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(streamInterval);
      }
    }, 30); // Adjust speed here (lower = faster)

    return () => clearInterval(streamInterval);
  }, [message.content, message.sender, isNewMessage]);

  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge 
            variant={isUser ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {isUser ? 'You' : 'AI Persona'}
          </Badge>
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {displayedContent}
          {/* Cursor indicator for streaming effect */}
          {!isComplete && !isUser && isNewMessage && (
            <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5"></span>
          )}
        </p>
      </div>
    </div>
  );
};
