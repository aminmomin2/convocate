"use client"
import React from 'react';
import FileUploadDropbox from '@/components/FileUploadDropbox';
// import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Sales Persona Chat
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Train with AI personas created from your chat conversations. Upload your chat files or connect Gmail to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* File Upload Option */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Upload Chat Files</h2>
              <p className="text-sm text-muted-foreground">
                Upload exported chat files to create training personas
              </p>
            </div>
            <FileUploadDropbox />
          </div>

          {/* Gmail Connect Option 
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Connect Gmail</h2>
              <p className="text-sm text-muted-foreground">
                Automatically import conversations from your Gmail
              </p>
            </div>
            <div className="bg-card border rounded-xl p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.908 1.528-1.147C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
              </div>
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement Gmail OAuth
                    // For now, just redirect to dashboard
                    window.location.href = '/dashboard';
                  }}
                >
                  Connect Gmail
                </Button>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll only access conversations you explicitly share
                </p>
              </div>
            </div>
          </div>
          */}
        </div>

        {/* Features Preview
        <div className="text-center space-y-4 pt-8 border-t">
          <h3 className="text-lg font-medium">What you&apos;ll get</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8V4l4 4z" />
                </svg>
              </div>
              <p className="font-medium">AI Personas</p>
              <p className="text-muted-foreground">Chat with AI versions of your contacts</p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="font-medium">Sales Training</p>
              <p className="text-muted-foreground">Practice your pitch with realistic responses</p>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="font-medium">Performance Insights</p>
              <p className="text-muted-foreground">Get scored feedback on your conversations</p>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
