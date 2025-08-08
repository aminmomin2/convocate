"use client"
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PersonaNaming from './PersonaNaming';

import { Msg, StoredPersona } from '@/types/persona';
import { updateUsageFromUpload } from '@/utils/fetcher';

const MAX_FILE_SIZE_MB = 10;

interface FileUploadDropboxProps {
  onUploadSuccess?: (data: { sessionId: string; personas: StoredPersona[] }) => void;
}

export default function FileUploadDropbox({ onUploadSuccess }: FileUploadDropboxProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'naming'>('upload');
  const [uploadedPersonas, setUploadedPersonas] = useState<StoredPersona[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');



  const supportedTypes = [
    { ext: '.csv', desc: 'CSV with sender, message, timestamp columns' },
    { ext: '.json', desc: 'JSON array with sender/message objects' },
    { ext: '.txt', desc: 'WhatsApp chat export format' },
    { ext: '.xml', desc: 'SMS Backup & Restore format' }
  ];

  const isValidFile = (file: File) => {
    const validExtensions = ['.csv', '.json', '.txt', '.xml'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const isValidFileSize = (file: File) => {
    return file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(''); // Clear any previous errors
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(isValidFile);
    const invalidFiles = files.filter(f => !isValidFile(f));
    const oversizedFiles = files.filter(f => !isValidFileSize(f));
    
    if (invalidFiles.length > 0) {
      setError(`Unsupported file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only .csv, .json, .txt, and .xml files are accepted.`);
    } else if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum file size is ${MAX_FILE_SIZE_MB}MB.`);
    }
    
    setSelectedFiles(validFiles.filter(isValidFileSize));
    
    // Clear any existing file input value
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Clear any previous errors
    
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(isValidFile);
    const invalidFiles = files.filter(f => !isValidFile(f));
    const oversizedFiles = files.filter(f => !isValidFileSize(f));
    
    if (invalidFiles.length > 0) {
      setError(`Unsupported file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only .csv, .json, .txt, and .xml files are accepted.`);
    } else if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum file size is ${MAX_FILE_SIZE_MB}MB.`);
    }
    
    setSelectedFiles(validFiles.filter(isValidFileSize));
    
    // Clear the file input value after processing
    e.target.value = '';
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a quota exceeded error and redirect
        if (data.errorType === 'quota_exceeded' && data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        throw new Error(data.error || 'Upload failed');
      }
      
      // Store the uploaded data and transition to naming step
      setSessionId(data.sessionId || Date.now().toString());
      setUploadedPersonas(data.personas);
      
      // Update usage info with server response
      if (data.totalPersonasCreated) {
        updateUsageFromUpload(data.totalPersonasCreated);
      }
      
      // Show auto-selection info if provided
      if (data.autoSelectionInfo) {

        // You could show a toast or notification here about the auto-selection
      }
      
      setCurrentStep('naming');
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    setError(''); // Clear error when files change
    
    // Clear the file input value so the same file can be uploaded again
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handlePersonaNamingComplete = (namedPersonas: StoredPersona[]) => {
    // Store personas with full transcripts and empty chatHistory in localStorage
    const storedPersonas: StoredPersona[] = namedPersonas.map(persona => ({
      id: persona.id,
      name: persona.name,
      transcript: persona.transcript || [], // Full chronological history
      chatHistory: [] as Msg[], // Start empty for practice conversations
      styleProfile: persona.styleProfile || {
        tone: "Neutral and professional",
        formality: "casual", 
        pacing: "Varies with context",
        vocabulary: [],
        quirks: [],
        examples: []
      }, // Include styleProfile from uploaded data
    }));
    
    // Note: Server-side persona count is already updated in handleUpload
    // No need to update again here as the server tracks the permanent count
    
    localStorage.setItem('personas', JSON.stringify(storedPersonas));
    
    if (onUploadSuccess) {
      onUploadSuccess({ sessionId, personas: namedPersonas });
    } else {
      // Default behavior: redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handlePersonaNamingCancel = () => {
    // Reset to upload step
    setCurrentStep('upload');
    setUploadedPersonas([]);
    setSessionId('');
    setSelectedFiles([]);
    setError('');
  };



  // Render persona naming step if upload is complete
  if (currentStep === 'naming') {
    return (
      <PersonaNaming
        personas={uploadedPersonas}
        onComplete={handlePersonaNamingComplete}
        onCancel={handlePersonaNamingCancel}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Chat Files
        </CardTitle>
        <CardDescription className="text-xs">
          Upload your chat files to create AI personas for sales training
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">Upload Error</span>
            </div>
            <p className="text-red-700 text-xs mt-1">{error}</p>
          </div>
        )}

        {/* Compact Usage Limits Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">Usage Limits</span>
          </div>
          <div className="text-blue-700 text-xs space-y-1">
            <p>• <strong>2 personas total per IP</strong>: yourself + one other person</p>
            <p>• <strong>This limit is permanent</strong> - cannot be reset by deleting personas</p>
            <p>• 40 total messages per IP address</p>
            <p>• Maximum file size: {MAX_FILE_SIZE_MB}MB per file</p>
            <p>• Best results with 50-100 total chat lines per persona</p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="space-y-3">
            <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports CSV, JSON, TXT, and XML files
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".csv,.json,.txt,.xml"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted/50 hover:bg-muted/70 rounded-full px-2 py-1 text-xs transition-colors group">
                  <span className="truncate max-w-20">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-4 h-4 flex items-center justify-center transition-all duration-200 ml-1 cursor-pointer"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Supported Formats */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium">Supported Formats</h4>
          <div className="grid grid-cols-2 gap-2">
            {supportedTypes.map((type, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <Badge variant="secondary" className="font-mono text-xs">
                  {type.ext}
                </Badge>
                <span className="text-muted-foreground text-xs">{type.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}