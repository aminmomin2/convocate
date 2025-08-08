// Shared types for persona-related data structures

export interface Msg {
  sender: string;
  message: string;
  timestamp: string;
}

export interface StyleProfile {
  tone: string;           // e.g. "Friendly, upbeat"
  formality: string;      // e.g. "Casual"
  pacing: string;         // e.g. "Short, direct sentences"
  vocabulary: string[];   // e.g. ["collaborate", "quick check-in"]
  quirks: string[];       // e.g. ["uses emojis", "ends with question"]
  examples: string[];     // 1–2 real snippets from the transcript
  
  // Personality traits for more natural conversation
  traits: {
    openness?: number;      // 1-10: curiosity and openness to new ideas
    expressiveness?: number;// 1-10: emotional expressiveness level
    humor?: number;         // 1-10: tendency to use humor
    empathy?: number;       // 1-10: ability to show understanding
  };
  
  // Emotional context
  emotions: {
    primary?: string;      // e.g. "enthusiastic", "calm", "thoughtful"
    secondary?: string[];  // e.g. ["curious", "playful"]
    triggers?: {           // situations that evoke emotional responses
      positive?: string[]; // e.g. ["creative ideas", "problem-solving"]
      negative?: string[]; // e.g. ["rudeness", "confusion"]
    };
  };
  
  // Conversation style
  preferences: {
    topics?: string[];     // preferred conversation topics
    avoids?: string[];     // topics or approaches to avoid
    engagement?: string[]; // e.g. ["asks follow-up questions", "shares relevant experiences"]
  };
  
  // Communication patterns
  communication_patterns?: {
    message_length?: string;      // e.g. "short", "medium", "long"
    punctuation_style?: string;   // e.g. "standard", "emojis", "abbreviations", "formal", "casual"
    capitalization?: string;      // e.g. "proper", "all caps", "mixed", "formal", "casual"
    abbreviations?: string[];     // e.g. ["lol", "omg", "btw"]
    unique_expressions?: string[]; // e.g. ["bro", "dude", "chill", "deadass"] or formal expressions
  };
}

export interface StoredMessage {
  sender: string;
  message: string;
  timestamp?: string;
}

export interface StoredPersona {
  id: string;
  name: string;
  transcript: Msg[]; // Full chronological transcript from all files
  chatHistory: Msg[]; // Ongoing practice chat conversation
  styleProfile: StyleProfile;
  // Optional fields for display purposes
  avatar?: string;
  description?: string;
  messageCount?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'persona';
  timestamp: Date;
}