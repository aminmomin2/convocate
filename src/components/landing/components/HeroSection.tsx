/**
 * HeroSection Component
 * 
 * Landing page hero section with animated background and main call-to-action.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FileUploadDropbox from './FileUploadDropbox';

interface HeroSectionProps {
  isVisible: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isVisible }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen flex items-center justify-center">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-48 h-48 md:w-72 md:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 md:w-96 md:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative w-full max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className={`text-center space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Convocate
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-normal">
                Create AI clones of anyone from your chat conversations
              </p>
            </div>
            
            {/* What You Can Do */}
            <div className="space-y-3">
              <p className="text-sm text-gray-400 font-medium">Practice sales pitches, difficult conversations, or chat with AI clones of friends, colleagues, or mentors</p>
              
              {/* Enhanced Key Benefits */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/10 backdrop-blur-sm px-3 py-2 md:py-1.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Digital twins of anyone</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/10 backdrop-blur-sm px-3 py-2 md:py-1.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Real chat data training</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/10 backdrop-blur-sm px-3 py-2 md:py-1.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Private practice arena</span>
                </div>
              </div>
            </div>
            
            {/* Message Requirements Info */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-lg mx-auto">
              <div className="text-sm text-gray-300 text-center space-y-1">
                <div className="font-semibold text-white">📊 How Much Data Do You Need?</div>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 flex-wrap">
                  <span><strong>Minimum:</strong> 50 messages</span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span><strong>Optimal:</strong> 100 messages</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Navigation Button */}
          <div className={`flex justify-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:border-white/50 transition-all duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Enhanced Upload Section */}
          <div className={`flex justify-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-full max-w-2xl">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl">
                <FileUploadDropbox />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
