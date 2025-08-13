"use client"
import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  Spinner,
  Alert
} from '@/components/ui';
import { ErrorMessage } from '@/components/ui/error-message';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');


  const supportedTypes = [
    { ext: '.txt', desc: 'WhatsApp chat export (recommended - works best!)', recommended: true },
    { ext: '.csv', desc: 'CSV with sender, message, timestamp columns' },
    { ext: '.json', desc: 'JSON array with sender/message objects' },
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
    setUploadProgress(0);
    setUploadStatus('Preparing files...');
    
    try {
      console.log('Starting upload with files:', selectedFiles.map(f => f.name));
      
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
        console.log(`Added file: ${file.name} (${file.size} bytes, ${file.type})`);
      });

      setUploadProgress(5);
      setUploadStatus('Uploading files...');

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadPercent = Math.round((event.loaded / event.total) * 80); // Upload is 80% of total process
          setUploadProgress(5 + uploadPercent);
          setUploadStatus('Uploading files...');
        }
      });

      // Create a promise-based wrapper for XMLHttpRequest
      const uploadPromise = new Promise<{ sessionId: string; personas: StoredPersona[]; errorType?: string; redirectTo?: string; totalPersonasCreated?: number; autoSelectionInfo?: unknown }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });
      });

      // Start the upload
      xhr.open('POST', '/api/upload');
      xhr.send(formData);

      // Wait for upload to complete
      const data = await uploadPromise;
      console.log('Response data:', data);

      // Check for quota exceeded error
      if (data.errorType === 'quota_exceeded' && data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }

      setUploadProgress(85);
      setUploadStatus('Processing files...');

      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadProgress(95);
      setUploadStatus('Creating personas...');

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
      
      setUploadProgress(100);
      setUploadStatus('Complete!');
      
      // Small delay to show completion
      setTimeout(() => {
        setCurrentStep('naming');
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      setUploadProgress(0);
      setUploadStatus('');
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
          <ErrorMessage 
            title="Upload Error" 
            message={error}
            variant="compact"
          />
        )}

        {/* Compact Usage Limits Info */}
        <Alert variant="info" title="Usage Limits">
          <div className="space-y-1">
            <p>• <strong>2 personas total per IP</strong>: yourself + one other person</p>
            <p>• <strong>This limit is permanent</strong> - cannot be reset by deleting personas</p>
            <p>• 40 total messages per IP address</p>
            <p>• Maximum file size: {MAX_FILE_SIZE_MB}MB per file</p>
            <p>• Best results with 50-100 total chat lines per persona</p>
          </div>
        </Alert>

        {/* Dropzone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
                Supports CSV, JSON, TXT, and XML files • <span className="text-green-600 font-medium">TXT works best</span>
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
            <h4 className="text-xs font-medium">Selected Files</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </Badge>
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Supported Formats */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium">Supported Formats</h4>
          <div className="grid grid-cols-1 gap-2">
            {supportedTypes.map((type, index) => (
              <div key={index} className={`flex items-start gap-2 text-xs ${type.recommended ? 'bg-green-50 border border-green-200 rounded-md p-2' : ''}`}>
                <Badge 
                  variant={type.recommended ? "default" : "secondary"} 
                  className={`font-mono text-xs ${type.recommended ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {type.ext}
                  {type.recommended && <span className="ml-1">⭐</span>}
                </Badge>
                <span className={`text-xs ${type.recommended ? 'text-green-800 font-medium' : 'text-muted-foreground'}`}>
                  {type.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar - Show during upload */}
        {isUploading && (
          <div className="space-y-3">
            <Progress progress={uploadProgress} status={uploadStatus} />
            <div className="text-center text-xs text-muted-foreground">
              This may take 10-30 seconds depending on file size and conversation length
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <Spinner size="sm" className="-ml-1 mr-3" />
              Please wait...
            </>
          ) : (
            `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
