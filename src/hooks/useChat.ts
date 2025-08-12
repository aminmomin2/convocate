/**
 * Custom hook for managing chat functionality
 * 
 * This hook encapsulates all chat-related state and logic, making components
 * cleaner and more focused on UI rendering.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, StoredPersona, Msg } from '@/types/persona';
import { updateTotalMessagesUsed } from '@/utils/fetcher';

interface UseChatProps {
  personaId: string;
  onScoreUpdate?: (score: number | null, tips: string[]) => void;
  onScoringStart?: () => void;
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

export const useChat = ({
  personaId,
  onScoreUpdate,
  onScoringStart,
  onMessageCountUpdate,
  onUsageInfoUpdate,
}: UseChatProps) => {
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPersona, setCurrentPersona] = useState<StoredPersona | null>(null);
  const [trainingMessageCount, setTrainingMessageCount] = useState<number>(0);
  const [personas, setPersonas] = useState<StoredPersona[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSamplePrompts, setShowSamplePrompts] = useState(true);

  // Performance state
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentTips, setCurrentTips] = useState<string[]>([]);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  /**
   * Load personas and chat history from localStorage
   */
  useEffect(() => {
    const loadChatHistory = () => {
      const storedPersonas = localStorage.getItem('personas');
      if (!storedPersonas) {
        setCurrentPersona(null);
        setTrainingMessageCount(0);
        setMessages([]);
        setShowSamplePrompts(true);
        if (onMessageCountUpdate) onMessageCountUpdate(0);
        return;
      }

      try {
        const parsedPersonas: StoredPersona[] = JSON.parse(storedPersonas);
        setPersonas(parsedPersonas);
        
        const persona = parsedPersonas.find((p: StoredPersona) => p.id === personaId);
        if (!persona) {
          setCurrentPersona(null);
          setTrainingMessageCount(0);
          setMessages([]);
          setShowSamplePrompts(true);
          if (onMessageCountUpdate) onMessageCountUpdate(0);
          return;
        }

        setCurrentPersona(persona);
        setTrainingMessageCount(persona.transcript?.length || 0);
        
        const chatHistory = persona.chatHistory || [];
        const chatMessages: ChatMessage[] = chatHistory.map((msg: Msg, index: number) => ({
          id: `${index}`,
          content: msg.message,
          sender: msg.sender === persona.name ? 'persona' : 'user',
          timestamp: new Date(msg.timestamp),
        }));
        
        if (chatMessages.length === 0) {
          setMessages([]);
          setShowSamplePrompts(true);
          if (onMessageCountUpdate) onMessageCountUpdate(0);
        } else {
          setMessages(chatMessages);
          setShowSamplePrompts(false);
          if (onMessageCountUpdate) onMessageCountUpdate(chatMessages.length);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setCurrentPersona(null);
        setTrainingMessageCount(0);
        setMessages([]);
        setShowSamplePrompts(true);
        if (onMessageCountUpdate) onMessageCountUpdate(0);
      }
    };

    loadChatHistory();
  }, [personaId, onMessageCountUpdate]);

  /**
   * Save chat history to localStorage
   */
  const saveChatHistory = useCallback((updatedMessages: ChatMessage[]) => {
    if (!currentPersona) return;
    
    try {
      const updatedPersonas = [...personas];
      const personaIndex = updatedPersonas.findIndex((p: StoredPersona) => p.id === personaId);
      if (personaIndex !== -1) {
        const realMessages = updatedMessages.filter(msg => 
          !(msg.sender === 'persona' && msg.content.includes("I'm here to help you practice"))
        );
        
        const chatHistory: Msg[] = realMessages.map(msg => ({
          sender: msg.sender === 'persona' ? currentPersona.name : 'user',
          message: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }));
        
        updatedPersonas[personaIndex].chatHistory = chatHistory;
        setPersonas(updatedPersonas);
        localStorage.setItem('personas', JSON.stringify(updatedPersonas));
      }
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [currentPersona, personas, personaId]);

  /**
   * Send a message to the AI persona
   */
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || !currentPersona || isLoading) return;

    setShowSamplePrompts(false);
    setError('');

    setIsLoading(true);

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setNewMessageIds(prev => new Set([...prev, newUserMessage.id]));
    setIsTyping(true);

    try {
      const chatHistory: Msg[] = messages
        .filter(msg => !(msg.sender === 'persona' && msg.content.includes("I'm here to help you practice")))
        .map(msg => ({
          sender: msg.sender === 'persona' ? currentPersona.name : 'user',
          message: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaName: currentPersona.name,
          transcript: currentPersona.transcript || [],
          chatHistory: chatHistory,
          userMessage: userMessage.trim(),
          previousScore: currentScore,
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
        if (data.errorType === 'quota_exceeded' && data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        throw new Error(data.error || `Chat API error: ${response.status}`);
      }

      setIsTyping(false);

      const personaResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.twinReply,
        sender: 'persona',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, personaResponse];
      setMessages(finalMessages);
      setNewMessageIds(prev => new Set([...prev, personaResponse.id]));
      saveChatHistory(finalMessages);
      
      const realMessages = finalMessages.filter(msg => 
        !(msg.sender === 'persona' && msg.content.includes("I'm here to help you practice"))
      );
      if (onMessageCountUpdate) {
        onMessageCountUpdate(realMessages.length);
      }

      if (typeof data.score === 'number') {
        setCurrentScore(data.score);
      }
      if (Array.isArray(data.tips)) {
        setCurrentTips(data.tips);
      }

      if (data.scoringId) {
        if (onScoringStart) {
          onScoringStart();
        }
        
        const pollForScoring = async () => {
          try {
            const response = await fetch(`/api/score?id=${data.scoringId}`);
            if (response.ok) {
              const scoringData = await response.json();
              if (scoringData.status === 'complete') {
                setCurrentScore(scoringData.score);
                setCurrentTips(scoringData.tips);
                
                if (onScoreUpdate) {
                  onScoreUpdate(scoringData.score, scoringData.tips);
                }
              } else if (scoringData.status === 'not_found') {
                return;
              } else {
                setTimeout(pollForScoring, 1000);
              }
            } else {
              setTimeout(pollForScoring, 1000);
            }
          } catch (error) {
            console.error('Failed to poll for scoring:', error);
            setTimeout(pollForScoring, 1000);
          }
        };

        setTimeout(pollForScoring, 1000);
      }
      
      if (data.usage) {
        setUsageInfo(data.usage);
        updateTotalMessagesUsed(data.usage.totalMessagesUsed);
        if (onUsageInfoUpdate) {
          onUsageInfoUpdate(data.usage);
        }
      }
      
      if (onScoreUpdate) {
        onScoreUpdate(
          typeof data.score === 'number' ? data.score : currentScore,
          Array.isArray(data.tips) ? data.tips : currentTips
        );
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      setIsTyping(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'persona',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [currentPersona, messages, currentScore, isLoading, saveChatHistory, onScoreUpdate, onScoringStart, onMessageCountUpdate, onUsageInfoUpdate]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * Hide sample prompts
   */
  const hideSamplePrompts = useCallback(() => {
    setShowSamplePrompts(false);
  }, []);

  return {
    // State
    messages,
    currentPersona,
    trainingMessageCount,
    isLoading,
    isTyping,
    error,
    showSamplePrompts,
    currentScore,
    currentTips,
    usageInfo,
    newMessageIds,

    // Actions
    sendMessage,
    clearError,
    hideSamplePrompts,
  };
};
