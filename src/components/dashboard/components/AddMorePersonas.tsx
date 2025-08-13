/**
 * AddMorePersonas Component
 * 
 * Displays when users can create additional personas.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface AddMorePersonasProps {
  maxPersonasPerIP: number;
}

export function AddMorePersonas({ maxPersonasPerIP }: AddMorePersonasProps) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        Create Another Persona
      </h3>
      <p className="text-muted-foreground mb-4">
        You can create up to {maxPersonasPerIP} personas: yourself and one other person you chat with. Upload more chat data to create additional training personas.
      </p>
      <Link href="/">
        <Button variant="outline" size="lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload More Data
        </Button>
      </Link>
    </div>
  );
}
