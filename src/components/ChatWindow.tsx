import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import { ChatMessage, StoredPersona, Msg } from '@/types/persona';
import { updateTotalMessagesUsed } from '@/utils/fetcher';

const MAX_MESSAGE_LENGTH = 4000; // Match the API limit

interface ChatWindowProps {
  personaId: string;
  onScoreUpdate?: (score: number | null, tips: string[]) => void;
  onMessageCountUpdate?: (count: number) => void;
  onUsageInfoUpdate?: (usage: {
    totalMessagesUsed: number;
    maxMessagesPerIP: number;
  } | null) => void;
}

interface UsageInfo {
  totalMessagesUsed: number;
  maxMessagesPerIP: number;
}

export default function ChatWindow({ personaId, onScoreUpdate, onMessageCountUpdate, onUsageInfoUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [trainingMessageCount, setTrainingMessageCount] = useState<number>(0);
  const [personas, setPersonas] = useState<StoredPersona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<StoredPersona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentTips, setCurrentTips] = useState<string[]>([]);
  const [showSamplePrompts, setShowSamplePrompts] = useState(true);
  const [error, setError] = useState<string>('');
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample prompts that will be shown to users
  const samplePrompts = [
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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load personas and chat history from localStorage on component mount
  useEffect(() => {
    const storedPersonas = localStorage.getItem('personas');
    if (storedPersonas) {
      try {
        const parsedPersonas: StoredPersona[] = JSON.parse(storedPersonas);
        setPersonas(parsedPersonas);
        
        const persona = parsedPersonas.find((p: StoredPersona) => p.id === personaId);
        if (persona) {
          setCurrentPersona(persona);
          // Set training message count from transcript
          setTrainingMessageCount(persona.transcript?.length || 0);
          
          // Load chat messages from chatHistory
          const chatHistory = persona.chatHistory || [];
          const chatMessages: ChatMessage[] = chatHistory.map((msg: Msg, index: number) => ({
            id: `${index}`,
            content: msg.message,
            sender: msg.sender === persona.name ? 'persona' : 'user',
            timestamp: new Date(msg.timestamp),
          }));
          
          if (chatMessages.length === 0) {
            // No default welcome message - start with empty conversation
            setMessages([]);
            // Show sample prompts for new conversations
            setShowSamplePrompts(true);
            // Update message count - no real conversation yet
            if (onMessageCountUpdate) {
              onMessageCountUpdate(0);
            }
          } else {
            setMessages(chatMessages);
            // Hide sample prompts for existing conversations
            setShowSamplePrompts(false);
            // Update message count - real conversation exists
            if (onMessageCountUpdate) {
              onMessageCountUpdate(chatMessages.length);
            }
          }
        } else {
          setCurrentPersona(null);
          setTrainingMessageCount(0);
          setMessages([]);
          // Show sample prompts for new conversations
          setShowSamplePrompts(true);
          // Update message count - no real conversation
          if (onMessageCountUpdate) {
            onMessageCountUpdate(0);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setCurrentPersona(null);
        setTrainingMessageCount(0);
        setMessages([]);
        // Show sample prompts for new conversations
        setShowSamplePrompts(true);
        // Update message count - no real conversation
        if (onMessageCountUpdate) {
          onMessageCountUpdate(0);
        }
      }
    } else {
      setCurrentPersona(null);
      setTrainingMessageCount(0);
      setMessages([]);
      // Show sample prompts for new conversations
      setShowSamplePrompts(true);
      // Update message count - no real conversation
      if (onMessageCountUpdate) {
        onMessageCountUpdate(0);
      }
    }
  }, [personaId, onMessageCountUpdate]);

  // Save chat history to localStorage whenever messages change
  const saveChatHistory = (updatedMessages: ChatMessage[]) => {
    if (!currentPersona) return;
    
    try {
      const updatedPersonas = [...personas];
      const personaIndex = updatedPersonas.findIndex((p: StoredPersona) => p.id === personaId);
      if (personaIndex !== -1) {
        // Convert ChatMessage format back to Msg format for chatHistory
        // Skip the initial welcome message (it's not part of the real conversation)
        const realMessages = updatedMessages.filter(msg => 
          !(msg.sender === 'persona' && msg.content.includes("I'm here to help you practice"))
        );
        
        const chatHistory: Msg[] = realMessages.map(msg => ({
          sender: msg.sender === 'persona' ? currentPersona.name : 'user',
          message: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }));
        
        // Update chatHistory while preserving transcript
        updatedPersonas[personaIndex].chatHistory = chatHistory;
        setPersonas(updatedPersonas);
        localStorage.setItem('personas', JSON.stringify(updatedPersonas));
      }
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentPersona || isLoading) return;

    // Hide sample prompts when user sends a message
    setShowSamplePrompts(false);
    setError(''); // Clear any previous errors

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to chat immediately
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      // Prepare chat history in the format expected by the API
      // Exclude the current user message since it's sent separately
      const chatHistory: Msg[] = messages
        .filter(msg => !(msg.sender === 'persona' && msg.content.includes("I'm here to help you practice")))
        .map(msg => ({
          sender: msg.sender === 'persona' ? currentPersona.name : 'user',
          message: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }));
      console.log(chatHistory);

      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaName: currentPersona.name,
          transcript: currentPersona.transcript || [],
          chatHistory: chatHistory,
          userMessage: userMessage,
          styleProfile: currentPersona.styleProfile || {
            tone: "Neutral and professional",
            formality: "casual",
            pacing: "Varies with context",
            vocabulary: [],
            quirks: [],
            examples: []
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a quota exceeded error and redirect
        if (data.errorType === 'quota_exceeded' && data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        throw new Error(data.error || `Chat API error: ${response.status}`);
      }

      // Add persona response to chat
      const personaResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.twinReply,
        sender: 'persona',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, personaResponse];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      // Update message count - exclude welcome message
      const realMessages = finalMessages.filter(msg => 
        !(msg.sender === 'persona' && msg.content.includes("I'm here to help you practice"))
      );
      if (onMessageCountUpdate) {
        onMessageCountUpdate(realMessages.length);
      }

      // Update score and tips if available
      if (typeof data.score === 'number') {
        setCurrentScore(data.score);
      }
      if (Array.isArray(data.tips)) {
        setCurrentTips(data.tips);
      }
      
      // Update usage information if provided
      if (data.usage) {
        setUsageInfo(data.usage);
        // Save to centralized storage
        updateTotalMessagesUsed(data.usage.totalMessagesUsed);
        if (onUsageInfoUpdate) {
          onUsageInfoUpdate(data.usage);
        }
      }
      
      // Notify parent component of score/tips update
      if (onScoreUpdate) {
        onScoreUpdate(
          typeof data.score === 'number' ? data.score : currentScore,
          Array.isArray(data.tips) ? data.tips : currentTips
        );
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'persona',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      // Set error state for display
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
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
    
    // Hide sample prompts when user starts typing
    if (value.trim() && showSamplePrompts) {
      setShowSamplePrompts(false);
    }
    
    // Clear error when user starts typing
    if (value.trim() && error) {
      setError('');
    }
  };

  const handleSamplePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setShowSamplePrompts(false);
    setError(''); // Clear any errors when starting fresh
  };

  return (
    <div className="h-full relative bg-background">
      {/* Chat Header */}
      <div className="absolute top-0 left-0 right-0 p-4 border-b border-border bg-background z-10">
        <h2 className="text-lg font-semibold">Training Session</h2>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">
            Practice your sales skills with AI guidance
          </p>
          {trainingMessageCount > 0 && (
            <Badge variant="outline" className="text-xs">
              Trained on {trainingMessageCount} messages
            </Badge>
          )}
        </div>
        
        {/* Usage Information */}
        {usageInfo && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total Messages: {usageInfo.totalMessagesUsed}/{usageInfo.maxMessagesPerIP}</span>
          </div>
        )}
      </div>

      {/* Messages Area - Scrollable */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto p-4 space-y-4 scrollbar-hide" style={{ top: usageInfo ? '120px' : '90px', bottom: '90px' }}>
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

        {/* Sample Prompts at the top */}
        {showSamplePrompts && messages.length === 0 && (
          <div className="mb-6">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-sm mb-2">🎯 Practice with your digital twin</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Start a conversation with your AI digital twin. It responds exactly like the person you&apos;ve trained it on using real chat/email data. 
                Perfect for rehearsing sales pitches, practicing difficult conversations, or just chatting with an AI clone of anyone you know.
                Click any phrase below to begin, or type your own message.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSamplePromptClick(prompt)}
                  className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant={message.sender === 'user' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {message.sender === 'user' ? 'You' : 'AI Persona'}
                </Badge>
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background z-10">
        <div className="flex gap-2 items-end">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none overflow-y-auto scrollbar-hide"
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            style={{
              height: 'auto',
              minHeight: '40px',
              maxHeight: '120px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3 flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          <p className={`text-xs ${inputValue.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {inputValue.length}/{MAX_MESSAGE_LENGTH}
          </p>
        </div>
      </div>
    </div>
  );
}