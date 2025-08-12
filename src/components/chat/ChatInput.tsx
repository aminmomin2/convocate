/**
 * ChatInput Component
 * 
 * Handles message input with auto-resizing textarea and send functionality.
 * Includes character count and keyboard shortcuts.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  maxLength?: number;
}

const MAX_MESSAGE_LENGTH = 4000; // Match the API limit

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  maxLength = MAX_MESSAGE_LENGTH 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background z-10">
      <div className="flex gap-2 items-end">
        {/* Auto-resizing textarea for message input */}
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your response..."
          className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none overflow-y-auto scrollbar-hide break-words"
          rows={1}
          maxLength={maxLength}
          style={{
            height: 'auto',
            minHeight: '40px',
            maxHeight: '120px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onInput={(e) => {
            // Auto-resize textarea based on content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        {/* Send Button */}
        <Button 
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          size="sm"
          className="px-3 flex-shrink-0"
        >
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">AI thinking...</span>
            </div>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      {/* Input Helpers */}
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
        <p className={`text-xs ${inputValue.length > maxLength * 0.9 ? 'text-orange-600' : 'text-muted-foreground'}`}>
          {inputValue.length}/{maxLength}
        </p>
      </div>
    </div>
  );
};
