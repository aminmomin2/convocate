/**
 * SocialMediaInfo Component
 * 
 * Social media information section with update notifications.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';

export function SocialMediaInfo() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold mb-1">Want to know when it&apos;s back up?</p>
          <p className="text-blue-600 dark:text-blue-300 mb-2">Follow me on social media - I&apos;ll post updates there!</p>
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg px-3 py-2 inline-block">
            <span className="font-mono text-blue-700 dark:text-blue-300 font-semibold">@aminmomin312</span>
          </div>
        </div>
      </div>
    </div>
  );
}
