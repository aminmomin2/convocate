"use client"
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PersonaNaming from './PersonaNaming';

import { Msg, StoredPersona } from '@/types/persona';

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

  const supportedTypes = [
    { ext: '.csv', desc: 'CSV with sender, message, timestamp columns' },
    { ext: '.json', desc: 'JSON array with sender/message objects' },
    { ext: '.txt', desc: 'WhatsApp chat export format' },
    { ext: '.xml', desc: 'SMS Backup & Restore format' }
  ];

  const isValidFile = (file: File) => {
    const name = file.name.toLowerCase();
    return name.endsWith('.csv') || name.endsWith('.json') || 
           name.endsWith('.txt') || name.endsWith('.xml');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(isValidFile);
    setSelectedFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(isValidFile);
    setSelectedFiles(files);
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Store the uploaded data and transition to naming step
      setSessionId(data.sessionId);
      setUploadedPersonas(data.personas);
      setCurrentStep('naming');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
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
      <CardHeader className="mb-2">
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Chat Files To Get Started
        </CardTitle>
        <CardDescription className="text-xs">
          Upload your chat files to create AI personas for sales training
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 mt-4">
        {/* Dropzone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted/50 hover:bg-muted/70 rounded-full px-2 py-1 text-xs transition-colors group">
                  <span className="truncate max-w-24">{file.name}</span>
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

        {/* Supported Formats */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Supported Formats</h4>
          <div className="grid gap-2">
            {supportedTypes.map((type, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <Badge variant="secondary" className="font-mono text-xs">
                  {type.ext}
                </Badge>
                <span className="text-muted-foreground">{type.desc}</span>
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