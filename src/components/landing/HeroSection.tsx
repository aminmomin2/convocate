/**
 * HeroSection Component
 * 
 * Landing page hero section with animated background and main call-to-action.
 * 
 * @author [Your Name]
 * @version 1.0.0
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  isVisible: boolean;
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isVisible, onGetStarted }) => {
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
              <p className="text-sm text-gray-400">Practice conversations with AI-powered digital twins</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                <span>• Sales pitches</span>
                <span>• Difficult conversations</span>
                <span>• Interview prep</span>
                <span>• Relationship building</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className={`text-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
