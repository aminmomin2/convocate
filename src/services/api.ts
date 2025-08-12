/**
 * API Service Layer
 * 
 * Centralized service for all API calls to ensure consistency,
 * error handling, and maintainability across the application.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import { StoredPersona, Msg, StyleProfile } from '@/types/persona';

// API Response Types
interface ChatResponse {
  twinReply: string;
  score?: number;
  tips?: string[];
  scoringId?: string;
  usage?: {
    totalMessagesUsed: number;
    maxMessagesPerIP: number;
  };
}

interface UploadResponse {
  sessionId: string;
  personas: StoredPersona[];
}

interface ScoringResponse {
  status: 'complete' | 'processing' | 'not_found';
  score?: number;
  tips?: string[];
}

interface ErrorResponse {
  error: string;
  errorType?: string;
  redirectTo?: string;
}

/**
 * Base API client with common configuration
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  /**
   * Make a generic API request with error handling
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Upload files and create personas
   */
  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send a chat message to an AI persona
   */
  async sendChatMessage(params: {
    personaName: string;
    transcript: Msg[];
    chatHistory: Msg[];
    userMessage: string;
    previousScore?: number | null;
    styleProfile: StyleProfile;
  }): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get scoring results for a conversation
   */
  async getScoringResult(scoringId: string): Promise<ScoringResponse> {
    return this.request<ScoringResponse>(`/api/score?id=${scoringId}`);
  }

  /**
   * Poll for scoring results until complete
   */
  async pollForScoring(scoringId: string, maxAttempts = 30): Promise<ScoringResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.getScoringResult(scoringId);
        
        if (result.status === 'complete') {
          return result;
        }
        
        if (result.status === 'not_found') {
          throw new Error('Scoring result not found');
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Scoring poll attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('Scoring timeout - maximum attempts reached');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Convenience functions for common API operations
 */
export const apiService = {
  /**
   * Upload files and create personas
   */
  uploadFiles: (files: File[]) => apiClient.uploadFiles(files),

  /**
   * Send a chat message
   */
  sendChatMessage: (params: {
    personaName: string;
    transcript: Msg[];
    chatHistory: Msg[];
    userMessage: string;
    previousScore?: number | null;
    styleProfile: StyleProfile;
  }) => apiClient.sendChatMessage(params),

  /**
   * Get scoring results
   */
  getScoringResult: (scoringId: string) => apiClient.getScoringResult(scoringId),

  /**
   * Poll for scoring results
   */
  pollForScoring: (scoringId: string) => apiClient.pollForScoring(scoringId),
};
