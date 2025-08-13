/**
 * SamplePrompts Component
 * 
 * Displays sample conversation starters to help users begin chatting.
 * Provides contextually relevant prompts for practice scenarios.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { Button } from '@/components/ui/button';

interface SamplePromptsProps {
  onPromptClick: (prompt: string) => void;
}

/**
 * Sample prompts that help users start conversations
 * These are contextually relevant prompts that work well for practice scenarios
 */
const SAMPLE_PROMPTS = [
  "Hi, I'm calling about your current software solution. Are you experiencing any pain points?",
  "Good morning! I noticed your company has been growing. How are you handling customer support?",
  "Hi there! We help companies like yours reduce operational costs by 30%. Interested in learning more?",
  "Hello! I saw your recent expansion announcement. How are you managing the increased workload?",
  "Hi, what's your biggest challenge right now when it comes to closing deals?",
  "Hey, I wanted to get your thoughts on the new project proposal.",
  "Good afternoon! How's everything going with the team lately?",
  "I need to talk to you about something important. Do you have a minute?",
  "What do you think about the feedback I gave you last week?",
  "Can we discuss the budget concerns I mentioned earlier?"
];

export const SamplePrompts: React.FC<SamplePromptsProps> = ({ onPromptClick }) => {
  return (
    <div className="mb-6">
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-sm mb-2">🎯 Practice with your digital twin</h3>
        <p className="text-sm text-muted-foreground mb-3 break-words">
          Start a conversation with your AI digital twin. It responds exactly like the person you&apos;ve trained it on using real chat/email data. 
          Perfect for rehearsing sales pitches, practicing difficult conversations, or just chatting with an AI clone of anyone you know.
          Click any phrase below to begin, or type your own message.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 lg:flex lg:flex-wrap lg:gap-2">
        {SAMPLE_PROMPTS.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onPromptClick(prompt)}
            className="text-xs h-auto py-2 px-3 whitespace-normal text-left lg:inline-block"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
};
