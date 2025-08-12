/**
 * useFileUpload Hook
 * 
 * Custom hook for managing file upload functionality including drag & drop,
 * file validation, upload progress, and persona creation.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { StoredPersona } from '@/types/persona';
import { apiService } from '@/services/api';
import { fileValidation } from '@/utils/validation';
import { FILE_CONFIG } from '@/constants';

interface UseFileUploadProps {
  onUploadSuccess?: (data: { sessionId: string; personas: StoredPersona[] }) => void;
}

interface UploadState {
  isDragOver: boolean;
  isUploading: boolean;
  selectedFiles: File[];
  currentStep: 'upload' | 'naming';
  uploadedPersonas: StoredPersona[];
  sessionId: string;
  error: string;
  uploadProgress: number;
  uploadStatus: string;
}

export const useFileUpload = ({ onUploadSuccess }: UseFileUploadProps) => {
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    selectedFiles: [],
    currentStep: 'upload',
    uploadedPersonas: [],
    sessionId: '',
    error: '',
    uploadProgress: 0,
    uploadStatus: '',
  });

  /**
   * Update state with partial updates
   */
  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    updateState({ isDragOver: true });
  }, [updateState]);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    updateState({ isDragOver: false });
  }, [updateState]);

  /**
   * Handle file drop event
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    updateState({ isDragOver: false, error: '' });
    
    const files = Array.from(e.dataTransfer.files);
    const validation = fileValidation.validateFiles(files);
    
    if (!validation.isValid) {
      updateState({ error: validation.errors[0] });
      return;
    }
    
    updateState({ selectedFiles: files });
    
    // Clear any existing file input value
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [updateState]);

  /**
   * Handle file selection from input
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ error: '' });
    
    const files = Array.from(e.target.files || []);
    const validation = fileValidation.validateFiles(files);
    
    if (!validation.isValid) {
      updateState({ error: validation.errors[0] });
      return;
    }
    
    updateState({ selectedFiles: files });
  }, [updateState]);

  /**
   * Remove a file from selection
   */
  const removeFile = useCallback((index: number) => {
    updateState({
      selectedFiles: state.selectedFiles.filter((_, i) => i !== index),
      error: '',
    });
  }, [state.selectedFiles, updateState]);

  /**
   * Clear all selected files
   */
  const clearFiles = useCallback(() => {
    updateState({
      selectedFiles: [],
      error: '',
    });
  }, [updateState]);

  /**
   * Upload files and create personas
   */
  const uploadFiles = useCallback(async () => {
    if (state.selectedFiles.length === 0) {
      updateState({ error: 'No files selected' });
      return;
    }

    updateState({
      isUploading: true,
      error: '',
      uploadProgress: 0,
      uploadStatus: 'Preparing upload...',
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        updateState(prev => ({
          uploadProgress: Math.min(prev.uploadProgress + 10, 90),
          uploadStatus: 'Processing files...',
        }));
      }, 200);

      // Upload files
      const result = await apiService.uploadFiles(state.selectedFiles);
      
      clearInterval(progressInterval);
      
      updateState({
        uploadProgress: 100,
        uploadStatus: 'Upload complete!',
        uploadedPersonas: result.personas,
        sessionId: result.sessionId,
        currentStep: 'naming',
      });

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Upload failed',
        isUploading: false,
        uploadProgress: 0,
        uploadStatus: '',
      });
    } finally {
      updateState({ isUploading: false });
    }
  }, [state.selectedFiles, onUploadSuccess, updateState]);

  /**
   * Update persona names
   */
  const updatePersonaNames = useCallback((updates: { [key: string]: string }) => {
    const updatedPersonas = state.uploadedPersonas.map(persona => ({
      ...persona,
      name: updates[persona.id] || persona.name,
    }));
    
    updateState({ uploadedPersonas: updatedPersonas });
  }, [state.uploadedPersonas, updateState]);

  /**
   * Save personas to localStorage
   */
  const savePersonas = useCallback(() => {
    try {
      const existingPersonas = JSON.parse(localStorage.getItem('personas') || '[]');
      const allPersonas = [...existingPersonas, ...state.uploadedPersonas];
      localStorage.setItem('personas', JSON.stringify(allPersonas));
      
      // Reset state
      updateState({
        selectedFiles: [],
        uploadedPersonas: [],
        sessionId: '',
        currentStep: 'upload',
        uploadProgress: 0,
        uploadStatus: '',
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save personas:', error);
      updateState({ error: 'Failed to save personas' });
      return false;
    }
  }, [state.uploadedPersonas, updateState]);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    updateState({
      isDragOver: false,
      isUploading: false,
      selectedFiles: [],
      currentStep: 'upload',
      uploadedPersonas: [],
      sessionId: '',
      error: '',
      uploadProgress: 0,
      uploadStatus: '',
    });
  }, [updateState]);

  return {
    // State
    ...state,
    
    // Actions
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeFile,
    clearFiles,
    uploadFiles,
    updatePersonaNames,
    savePersonas,
    reset,
  };
};
