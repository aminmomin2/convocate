/**
 * EmptyState Component
 * 
 * Displays when no personas exist, encouraging users to upload data.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        No Personas Yet
      </h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Upload your chat conversations to create AI personas for realistic sales training.
      </p>
      <Link href="/">
        <Button size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Chat Data
        </Button>
      </Link>
    </div>
  );
}
