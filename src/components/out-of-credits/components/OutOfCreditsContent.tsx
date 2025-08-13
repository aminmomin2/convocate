/**
 * OutOfCreditsContent Component
 * 
 * Main content section with explanation text and status list.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';

export function OutOfCreditsContent() {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-200 space-y-4 leading-relaxed">
      <p className="text-base">
        Hey there! I&apos;m a solo developer building this AI persona chat tool, and I&apos;m stoked that you want to try it out! 🚀
      </p>
      <p className="text-base">
        Unfortunately, my $10 monthly API budget got used up faster than I expected <span className="text-green-600 dark:text-green-400 font-medium">(which is actually pretty cool - means people are using it!)</span>.
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What&apos;s happening:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Chat is temporarily disabled <span className="text-gray-500 dark:text-gray-400">(I&apos;m just one person with a limited budget)</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Upload and persona creation are also disabled</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>I&apos;ll add more credits as soon as I can</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
