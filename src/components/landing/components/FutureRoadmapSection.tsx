/**
 * FutureRoadmapSection Component
 * 
 * Section showcasing future roadmap and vision for the platform.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';

export const FutureRoadmapSection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            The Future: AI Sales Playbook Generator
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Our vision for the ultimate startup sales tool - analyzing real data to create complete, data-driven sales playbooks
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group bg-white/10 backdrop-blur-sm border border-purple-200/30 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Complete Sales Playbook</h3>
                <p className="text-gray-300 leading-relaxed">
                  AI analyzes your sales calls, CRM data, and email history to generate a comprehensive playbook with scripts, objection handling, and best practices.
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm border border-blue-200/30 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Data-Driven Insights</h3>
                <p className="text-gray-300 leading-relaxed">
                  Identify winning patterns, common objections, and conversion triggers from your actual sales data to optimize your entire sales process.
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm border border-purple-200/30 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8V4l4 4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">CRM Integration</h3>
                <p className="text-gray-300 leading-relaxed">
                  Seamlessly connect with HubSpot, Salesforce, and other CRMs to automatically analyze your sales pipeline and customer interactions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm border border-orange-200/30 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Call Recording Analysis</h3>
                <p className="text-gray-300 leading-relaxed">
                  Upload recorded sales calls to extract key moments, successful tactics, and objection handling patterns for your playbook.
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm border border-green-200/30 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Team Onboarding</h3>
                <p className="text-gray-300 leading-relaxed">
                  Automatically generate training materials and scripts for new sales hires based on your proven successful interactions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-sm border border-pink-200/30 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Performance Optimization</h3>
                <p className="text-gray-300 leading-relaxed">
                  Continuously improve your sales playbook by analyzing conversion rates, A/B testing different approaches, and identifying what works best.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
