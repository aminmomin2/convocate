/**
 * Error Handler Utilities
 * 
 * Centralized error handling for consistent error management,
 * user feedback, and logging across the application.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

import { ERROR_MESSAGES } from '@/constants';

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  API = 'api',
  STORAGE = 'storage',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error information structure
 */
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
}

/**
 * Error handler class
 */
class ErrorHandler {
  /**
   * Create a standardized error info object
   */
  createErrorInfo(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: any
  ): ErrorInfo {
    const message = typeof error === 'string' ? error : error.message;
    
    return {
      type,
      severity,
      message,
      userMessage: this.getUserFriendlyMessage(message, type),
      details,
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(message: string, type: ErrorType): string {
    const lowerMessage = message.toLowerCase();
    
    // Network errors
    if (type === ErrorType.NETWORK || lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    // API errors
    if (type === ErrorType.API) {
      if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
        return ERROR_MESSAGES.QUOTA_EXCEEDED;
      }
      if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
        return 'Authentication error. Please refresh the page and try again.';
      }
      if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
        return 'Resource not found. Please check your request and try again.';
      }
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    // Storage errors
    if (type === ErrorType.STORAGE || lowerMessage.includes('localstorage')) {
      return 'Unable to save data. Please check your browser settings and try again.';
    }
    
    // Validation errors
    if (type === ErrorType.VALIDATION) {
      return message; // Validation errors are usually user-friendly already
    }
    
    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error for debugging
   */
  logError(errorInfo: ErrorInfo, context?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      ...errorInfo,
    };
    
    console.error('Application Error:', logData);
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or your own error tracking endpoint
    if (process.env.NODE_ENV === 'production') {
      // this.sendToErrorTracking(logData);
    }
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(error: any): ErrorInfo {
    let type = ErrorType.API;
    let severity = ErrorSeverity.MEDIUM;
    
    if (error?.response?.status) {
      const status = error.response.status;
      
      if (status >= 500) {
        severity = ErrorSeverity.HIGH;
      } else if (status === 429) {
        type = ErrorType.VALIDATION;
        severity = ErrorSeverity.MEDIUM;
      } else if (status === 401 || status === 403) {
        severity = ErrorSeverity.HIGH;
      }
    }
    
    const errorInfo = this.createErrorInfo(
      error.message || 'API request failed',
      type,
      severity,
      error
    );
    
    this.logError(errorInfo, 'API');
    return errorInfo;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(message: string, details?: any): ErrorInfo {
    const errorInfo = this.createErrorInfo(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      details
    );
    
    this.logError(errorInfo, 'Validation');
    return errorInfo;
  }

  /**
   * Handle storage errors
   */
  handleStorageError(error: Error): ErrorInfo {
    const errorInfo = this.createErrorInfo(
      error,
      ErrorType.STORAGE,
      ErrorSeverity.MEDIUM
    );
    
    this.logError(errorInfo, 'Storage');
    return errorInfo;
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: Error): ErrorInfo {
    const errorInfo = this.createErrorInfo(
      error,
      ErrorType.NETWORK,
      ErrorSeverity.HIGH
    );
    
    this.logError(errorInfo, 'Network');
    return errorInfo;
  }

  /**
   * Handle unknown errors
   */
  handleUnknownError(error: Error | string): ErrorInfo {
    const errorInfo = this.createErrorInfo(
      error,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM
    );
    
    this.logError(errorInfo, 'Unknown');
    return errorInfo;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(errorInfo: ErrorInfo): boolean {
    return (
      errorInfo.type === ErrorType.NETWORK ||
      (errorInfo.type === ErrorType.API && errorInfo.severity !== ErrorSeverity.HIGH)
    );
  }

  /**
   * Get retry delay based on error type and severity
   */
  getRetryDelay(errorInfo: ErrorInfo): number {
    switch (errorInfo.severity) {
      case ErrorSeverity.LOW:
        return 1000; // 1 second
      case ErrorSeverity.MEDIUM:
        return 3000; // 3 seconds
      case ErrorSeverity.HIGH:
        return 5000; // 5 seconds
      case ErrorSeverity.CRITICAL:
        return 10000; // 10 seconds
      default:
        return 3000;
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience functions for common error handling patterns
 */
export const errorUtils = {
  /**
   * Wrap async function with error handling
   */
  async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<{ data: T | null; error: ErrorInfo | null }> {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error) {
      const errorInfo = errorHandler.handleUnknownError(error as Error);
      errorHandler.logError(errorInfo, context);
      return { data: null, error: errorInfo };
    }
  },

  /**
   * Create a user-friendly error message
   */
  getUserMessage: (error: Error | string, type?: ErrorType) => {
    const errorInfo = errorHandler.createErrorInfo(error, type);
    return errorInfo.userMessage;
  },

  /**
   * Check if error is a quota error
   */
  isQuotaError: (error: any): boolean => {
    const message = (error?.message || '').toLowerCase();
    return message.includes('quota') || message.includes('limit');
  },
};
