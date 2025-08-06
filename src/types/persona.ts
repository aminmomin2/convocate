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