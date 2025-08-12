/**
 * FeaturesSection Component
 * 
 * Features showcase section highlighting key capabilities.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { MessageCircle, Brain, Shield, Zap, Target, Users } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced LLM analysis extracts personality traits, communication style, and behavioral patterns from your chat data.'
  },
  {
    icon: MessageCircle,
    title: 'Realistic Conversations',
    description: 'Practice with AI clones that respond exactly like the real person, using their actual vocabulary and tone.'
  },
  {
    icon: Target,
    title: 'Performance Scoring',
    description: 'Get instant feedback with positivity scores and actionable tips to improve your communication skills.'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'All processing happens locally or in secure serverless functions. Your data never leaves your control.'
  },
  {
    icon: Zap,
    title: 'Multiple Formats',
    description: 'Support for WhatsApp, CSV, JSON, and XML exports. Upload any chat format and get started instantly.'
  },
  {
    icon: Users,
    title: 'Multiple Personas',
    description: 'Create AI clones of multiple people and practice different conversation scenarios with each one.'
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Everything you need to create realistic AI personas and improve your communication skills
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
