/**
 * Validation Utilities
 * 
 * Centralized validation functions for consistent error handling
 * and user feedback across the application.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import { API_CONFIG, FILE_CONFIG, VALIDATION_RULES } from '@/constants';

/**
 * File validation utilities
 */
export const fileValidation = {
  /**
   * Validates file size
   */
  isValidSize: (file: File): boolean => {
    return file.size <= FILE_CONFIG.MAX_FILE_SIZE;
  },

  /**
   * Validates file type
   */
  isValidType: (file: File): boolean => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return FILE_CONFIG.SUPPORTED_FORMATS.includes(extension as '.csv' | '.json' | '.txt' | '.xml');
  },

  /**
   * Validates multiple files
   */
  validateFiles: (files: File[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push("No files provided");
      return { isValid: false, errors };
    }

    if (files.length > FILE_CONFIG.MAX_FILES) {
      errors.push(`Too many files. Maximum ${FILE_CONFIG.MAX_FILES} files allowed.`);
    }

    files.forEach(file => {
      if (!fileValidation.isValidType(file)) {
        errors.push(`Unsupported file type: ${file.name}. Only .csv, .json, .txt, and .xml files are accepted.`);
      }

      if (!fileValidation.isValidSize(file)) {
        errors.push(`File ${file.name} is too large. Maximum file size is ${API_CONFIG.MAX_FILE_SIZE_MB}MB.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Message validation utilities
 */
export const messageValidation = {
  /**
   * Validates message content
   */
  isValidMessage: (message: string): boolean => {
    const trimmed = message.trim();
    return trimmed.length >= VALIDATION_RULES.MESSAGE_MIN_LENGTH && 
           trimmed.length <= VALIDATION_RULES.MESSAGE_MAX_LENGTH;
  },

  /**
   * Gets validation error for message
   */
  getMessageError: (message: string): string | null => {
    const trimmed = message.trim();
    
    if (trimmed.length < VALIDATION_RULES.MESSAGE_MIN_LENGTH) {
      return "Message cannot be empty";
    }
    
    if (trimmed.length > VALIDATION_RULES.MESSAGE_MAX_LENGTH) {
      return `Message is too long. Maximum ${VALIDATION_RULES.MESSAGE_MAX_LENGTH} characters allowed.`;
    }
    
    return null;
  }
};

/**
 * Persona validation utilities
 */
export const personaValidation = {
  /**
   * Validates persona name
   */
  isValidName: (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.length >= VALIDATION_RULES.PERSONA_NAME_MIN_LENGTH && 
           trimmed.length <= VALIDATION_RULES.PERSONA_NAME_MAX_LENGTH;
  },

  /**
   * Gets validation error for persona name
   */
  getNameError: (name: string): string | null => {
    const trimmed = name.trim();
    
    if (trimmed.length < VALIDATION_RULES.PERSONA_NAME_MIN_LENGTH) {
      return "Persona name cannot be empty";
    }
    
    if (trimmed.length > VALIDATION_RULES.PERSONA_NAME_MAX_LENGTH) {
      return `Persona name is too long. Maximum ${VALIDATION_RULES.PERSONA_NAME_MAX_LENGTH} characters allowed.`;
    }
    
    return null;
  },

  /**
   * Validates persona count limit
   */
  isValidPersonaCount: (currentCount: number, newCount: number = 1): boolean => {
    return currentCount + newCount <= API_CONFIG.MAX_PERSONAS_PER_IP;
  }
};

/**
 * API response validation utilities
 */
export const apiValidation = {
  /**
   * Validates API response structure
   */
  isValidResponse: (response: unknown): boolean => {
    return Boolean(response && typeof response === 'object' && !(response as Record<string, unknown>).error);
  },

  /**
   * Checks if response is a quota error
   */
  isQuotaError: (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    
    const message = ((error as Record<string, unknown>).message || '') as string;
    const quotaKeywords = [
      'quota_exceeded', 
      'insufficient_quota',
      'rate_limit_exceeded',
      'billing_hard_limit_reached',
      'monthly_limit_exceeded',
      'usage_limit_reached',
      'credit_limit_exceeded'
    ];
    
    return quotaKeywords.some(keyword => message.includes(keyword));
  }
};

/**
 * General validation utilities
 */
export const generalValidation = {
  /**
   * Validates email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validates URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validates required field
   */
  isRequired: (value: unknown): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  }
};
