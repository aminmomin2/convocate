/**
 * Application Constants
 * 
 * Centralized location for all application constants to ensure consistency
 * and make maintenance easier.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

// API Configuration
export const API_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_FILE_SIZE_MB: 1,
  MAX_PERSONAS_PER_IP: 2,
  MAX_MESSAGES_PER_IP: 40,
  MAX_STYLE_SAMPLE_LINES: 75,
  STYLE_CHARS_BUDGET: 8000,
  LIMIT_CONCURRENCY: 2,
  MIN_MESSAGES_PER_SENDER: 10,
} as const;

// File Upload Configuration
export const FILE_CONFIG = {
  SUPPORTED_FORMATS: ['.csv', '.json', '.txt', '.xml'],
  MAX_FILES: 10,
  MAX_FILE_SIZE: API_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert to bytes
} as const;

// UI Configuration
export const UI_CONFIG = {
  TYPING_SPEED_MS: 30,
  SCROLL_DELAY_MS: 100,
  TEXTAREA_MAX_HEIGHT: 120,
  TEXTAREA_MIN_HEIGHT: 40,
} as const;

// Sample Prompts
export const SAMPLE_PROMPTS = [
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
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: (filename: string, maxSize: number) => 
    `File ${filename} is too large. Maximum file size is ${maxSize}MB.`,
  UNSUPPORTED_FILE_TYPE: (filename: string) => 
    `Unsupported file type: ${filename}. Only .csv, .json, .txt, and .xml files are accepted.`,
  TOO_MANY_FILES: (maxFiles: number) => 
    `Too many files. Maximum ${maxFiles} files allowed.`,
  NO_FILES_PROVIDED: "No files provided",
  NO_VALID_MESSAGES: "No valid messages found in uploaded files",
  INSUFFICIENT_MESSAGES: (minMessages: number) => 
    `No participants have enough messages for analysis. Each person needs at least ${minMessages} messages to create a reliable personality profile.`,
  PERSONA_LIMIT_EXCEEDED: (maxPersonas: number, current: number) => 
    `You've exceeded the maximum number of personas per IP (${maxPersonas} personas: yourself + one other person). You have already created ${current} personas. This limit is permanent and cannot be reset by deleting personas.`,
  QUOTA_EXCEEDED: "Service temporarily unavailable due to usage limits. Please try again later.",
  CHAT_ERROR: "I'm sorry, I'm having trouble responding right now. Please try again.",
  FAILED_TO_SEND: "Failed to send message",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_CLEARED: "All personas and training data have been removed successfully.",
  PERSONAS_CREATED: (count: number) => `Successfully created ${count} persona${count !== 1 ? 's' : ''}.`,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: API_CONFIG.MAX_MESSAGE_LENGTH,
  PERSONA_NAME_MIN_LENGTH: 1,
  PERSONA_NAME_MAX_LENGTH: 50,
} as const;

// Animation Delays
export const ANIMATION_DELAYS = {
  TYPING_DOT_1: '0ms',
  TYPING_DOT_2: '150ms',
  TYPING_DOT_3: '300ms',
} as const;
