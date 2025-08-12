/**
 * Convocate - ChatWindow Component
 * 
 * This is the core chat interface component that provides real-time conversation
 * with AI-powered digital twins. It orchestrates smaller, focused components
 * to create a clean, maintainable architecture.
 * 
 * Architecture:
 * - Uses custom hooks for state management
 * - Composes smaller, focused components
 * - Implements streaming message display for natural conversation flow
 * - Integrates with OpenAI API for AI responses
 * - Persists chat history locally for privacy
 * - Provides real-time performance feedback
 * 
 * @author Amin Momin
 * @version 1.0.0
 * @license MIT
 */

import React, { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { SamplePrompts } from './SamplePrompts';

interface ChatWindowProps {
  personaId: string;
  onScoreUpdate?: (score: number | null, tips: string[]) => void;
  onScoringStart?: () => void;
  onMessageCountUpdate?: (count: number) => void;
  onUsageInfoUpdate?: (usage: {
    totalMessagesUsed: number;
    maxMessagesPerIP: number;
  } | null) => void;
  isMobile?: boolean;
}

/**
 * Main ChatWindow Component
 * 
 * This is the primary chat interface that orchestrates all conversation interactions
 * with AI personas. It uses custom hooks for state management and composes smaller
 * components for a clean, maintainable architecture.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  personaId, 
  onScoreUpdate, 
  onScoringStart, 
  onMessageCountUpdate, 
  onUsageInfoUpdate, 
  isMobile = false 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use custom hook for all chat logic
  const {
    messages,
    trainingMessageCount,
    isLoading,
    isTyping,
    error,
    showSamplePrompts,
    usageInfo,
    newMessageIds,
    sendMessage,
    hideSamplePrompts,
  } = useChat({
    personaId,
    onScoreUpdate,
    onScoringStart,
    onMessageCountUpdate,
    onUsageInfoUpdate,
  });

  /**
   * Auto-scroll to bottom of messages
   * Ensures users always see the latest messages in the conversation
   */
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle clicking on sample prompts
   * Fills the input field with the selected prompt
   */
  const handleSamplePromptClick = () => {
    // This would need to be handled by the ChatInput component
    // For now, we'll just hide the prompts
    hideSamplePrompts();
  };

  return (
    <div className="h-full relative bg-background">
      {/* Chat Header - Hidden on mobile for space efficiency */}
      {!isMobile && (
        <ChatHeader 
          trainingMessageCount={trainingMessageCount}
          usageInfo={usageInfo}
        />
      )}

      {/* Messages Area - Scrollable conversation container */}
      <div 
        className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto p-4 space-y-4 scrollbar-hide" 
        style={{ 
          top: isMobile ? '0px' : (usageInfo ? '120px' : '90px'), 
          bottom: '90px' 
        }}
      >
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Chat Error</span>
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Sample Prompts Section */}
        {showSamplePrompts && messages.length === 0 && (
          <SamplePrompts onPromptClick={handleSamplePromptClick} />
        )}
        
        {/* Message List */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isNewMessage={newMessageIds.has(message.id)}
          />
        ))}
        
        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
        
        {/* Scroll anchor for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom for easy access */}
      <ChatInput 
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatWindow;
