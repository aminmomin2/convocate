/**
 * FileUploadDropbox Component
 * 
 * Handles file upload functionality including drag & drop, validation,
 * and persona creation. Uses the useFileUpload hook for state management.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PersonaNaming from '../PersonaNaming';
import { useFileUpload } from '@/hooks/useFileUpload';
import { StoredPersona } from '@/types/persona';

interface FileUploadDropboxProps {
  onUploadSuccess?: (data: { sessionId: string; personas: StoredPersona[] }) => void;
}

// Progress Bar Component
const ProgressBar = ({ progress, status }: { progress: number; status: string }) => (
  <div className="w-full space-y-2">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{status}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2">
      <div 
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default function FileUploadDropbox({ onUploadSuccess }: FileUploadDropboxProps) {
  const {
    isDragOver,
    isUploading,
    selectedFiles,
    currentStep,
    uploadedPersonas,
    sessionId,
    error,
    uploadProgress,
    uploadStatus,
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
  } = useFileUpload({ onUploadSuccess });

  const supportedTypes = [
    { ext: '.txt', desc: 'WhatsApp chat export (recommended - works best!)', recommended: true },
    { ext: '.csv', desc: 'CSV with sender, message, timestamp columns' },
    { ext: '.json', desc: 'JSON array with sender/message objects' },
    { ext: '.xml', desc: 'SMS Backup & Restore format' }
  ];

  if (currentStep === 'naming') {
    return (
      <PersonaNaming
        personas={uploadedPersonas}
        onSave={savePersonas}
        onBack={reset}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Upload Chat Data
        </CardTitle>
        <CardDescription className="text-center">
          Upload your chat exports to create AI personas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-lg font-medium">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            
            <input
              id="file-input"
              type="file"
              multiple
              accept=".csv,.json,.txt,.xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isUploading}
            >
              Choose Files
            </Button>
          </div>
        </div>

        {/* Supported File Types */}
        <div className="space-y-3">
          <h3 className="font-medium">Supported Formats:</h3>
          <div className="grid gap-2">
            {supportedTypes.map((type, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant={type.recommended ? "default" : "secondary"}>
                  {type.ext}
                </Badge>
                <span className="text-muted-foreground">{type.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
              <Button variant="ghost" size="sm" onClick={clearFiles}>
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📄</div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-3">
            <h3 className="font-medium">Processing Files...</h3>
            <ProgressBar progress={uploadProgress} status={uploadStatus} />
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && !isUploading && (
          <Button
            onClick={uploadFiles}
            className="w-full"
            size="lg"
          >
            Create AI Personas
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
