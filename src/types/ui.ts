/**
 * UI Component Types
 * 
 * Centralized type definitions for UI components to ensure
 * consistency and maintainability across the application.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

/**
 * FAQ item structure
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Toast notification structure
 */
export interface ToastNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

/**
 * Progress indicator structure
 */
export interface ProgressState {
  progress: number;
  status: string;
}

/**
 * File upload state
 */
export interface FileUploadState {
  isDragOver: boolean;
  isUploading: boolean;
  selectedFiles: File[];
  error: string;
  uploadProgress: number;
  uploadStatus: string;
}

/**
 * Persona selector props
 */
export interface PersonaSelectorProps {
  personaId: string;
  name: string;
  description: string;
  isMobile?: boolean;
}

/**
 * Score panel props
 */
export interface ScorePanelProps {
  score: number | null;
  tips: string[];
  isScoring: boolean;
  messageCount: number;
  usageInfo?: {
    totalMessagesUsed: number;
    maxMessagesPerIP: number;
  } | null;
}

import { StoredPersona } from './persona';

/**
 * File upload dropbox props
 */
export interface FileUploadDropboxProps {
  onUploadSuccess?: (data: { sessionId: string; personas: StoredPersona[] }) => void;
}

/**
 * Persona naming props
 */
export interface PersonaNamingProps {
  personas: StoredPersona[];
  onSave: (personas: StoredPersona[]) => void;
  onBack: () => void;
}
