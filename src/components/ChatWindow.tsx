import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import { ChatMessage, StoredPersona, Msg } from '@/types/persona';

interface ChatWindowProps {
  personaId: string;
  onScoreUpdate?: (score: number | null, tips: string[]) => void;
  onMessageCountUpdate?: (count: number) => void;
}

export default function ChatWindow({ personaId, onScoreUpdate, onMessageCountUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [trainingMessageCount, setTrainingMessageCount] = useState<number>(0);
  const [personas, setPersonas] = useState<StoredPersona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<StoredPersona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentTips, setCurrentTips] = useState<string[]>([]);

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
            // Set default welcome message if no chat history
            setMessages([{
              id: '1',
              content: `Hi! I'm ${persona.name}. I'm here to help you practice your sales skills. What scenario would you like to work on today?`,
              sender: 'persona',
              timestamp: new Date(),
            }]);
          } else {
            setMessages(chatMessages);
          }
          
          // Update message count
          if (onMessageCountUpdate) {
            onMessageCountUpdate(chatMessages.length);
          }
        } else {
          setCurrentPersona(null);
          setTrainingMessageCount(0);
          setMessages([{
            id: '1',
            content: "Hi! I'm here to help you practice your sales skills. What scenario would you like to work on today?",
            sender: 'persona',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setCurrentPersona(null);
        setTrainingMessageCount(0);
        setMessages([{
          id: '1',
          content: "Hi! I'm here to help you practice your sales skills. What scenario would you like to work on today?",
          sender: 'persona',
          timestamp: new Date(),
        }]);
      }
    } else {
      setCurrentPersona(null);
      setTrainingMessageCount(0);
      setMessages([{
        id: '1',
        content: "Hi! I'm here to help you practice your sales skills. What scenario would you like to work on today?",
        sender: 'persona',
        timestamp: new Date(),
      }]);
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

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();

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
      
      // Update message count
      if (onMessageCountUpdate) {
        onMessageCountUpdate(finalMessages.length);
      }

      // Update score and tips if available
      if (typeof data.score === 'number') {
        setCurrentScore(data.score);
      }
      if (Array.isArray(data.tips)) {
        setCurrentTips(data.tips);
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
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'persona',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}