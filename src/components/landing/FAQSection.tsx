/**
 * FAQSection Component
 * 
 * Frequently Asked Questions section with expandable answers.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQItem } from '@/types/ui';

interface FAQSectionProps {
  faqData: FAQItem[];
  openFAQ: number | null;
  onToggleFAQ: (index: number) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ 
  faqData, 
  openFAQ, 
  onToggleFAQ 
}) => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about Convocate
          </p>
        </div>
        
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => onToggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{item.question}</span>
                {openFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {openFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
