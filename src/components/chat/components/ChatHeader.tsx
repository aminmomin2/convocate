/**
 * ChatHeader Component
 * 
 * Displays chat session information including training data and usage statistics.
 * Hidden on mobile for space efficiency.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  trainingMessageCount: number;
  usageInfo: {
    totalMessagesUsed: number;
    maxMessagesPerIP: number;
  } | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  trainingMessageCount, 
  usageInfo 
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 border-b border-border bg-background z-10">
      <h2 className="text-lg font-semibold">Training Session</h2>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          Practice your skills with AI guidance
        </p>
        {trainingMessageCount > 0 && (
          <Badge variant="outline" className="text-xs">
            Trained on {trainingMessageCount} messages
          </Badge>
        )}
      </div>
      
      {/* Usage Information Display */}
      {usageInfo && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Total Messages: {usageInfo.totalMessagesUsed}/{usageInfo.maxMessagesPerIP}</span>
        </div>
      )}
    </div>
  );
};
