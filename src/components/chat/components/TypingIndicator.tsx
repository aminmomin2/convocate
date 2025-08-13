/**
 * TypingIndicator Component
 * 
 * Shows an animated typing indicator when the AI is generating a response.
 * Uses CSS animations and a pulsing effect to indicate active processing.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from '@/components/ui';

export const TypingIndicator: React.FC = () => (
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-xs">
          AI Persona
        </Badge>
        <span className="text-xs opacity-70">
          {new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
        <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
      </div>
    </div>
  </div>
);
