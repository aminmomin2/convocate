"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FileUploadDropbox from '@/components/FileUploadDropbox';
import { Button } from '@/components/ui/button';
import { clearAllData } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';

interface FAQItem {
  question: string;
  answer: string;
}

export default function Home() {
  const { showToast } = useToast();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const faqData: FAQItem[] = [
    {
      "question": "How does the AI create personas?",
      "answer": "After you upload your chat exports, our system parses and groups messages by contact, then runs a one-time LLM analysis on each person’s last 15–20 turns to extract their tone, vocabulary, and quirks. That distilled style profile plus the recent history becomes the “digital twin” you practice against."
    },
    {
      "question": "Is my data secure?",
      "answer": "Yes. All processing happens in your browser or serverless functions—your chat files are never stored long-term. For the MVP, persona data lives only in your localStorage, and you can clear it at any time."
    },
    {
      "question": "Can I practice with multiple personas?",
      "answer": "Absolutely. Each unique contact you upload becomes its own persona. You can pick any of them on the dashboard and practice conversations tailored to that individual’s style."
    },
    {
      "question": "What kind of feedback do I get?",
      "answer": "After every reply, you’ll see a positivity score from 0–100 and exactly three actionable tips on how to improve tone, clarity, or phrasing—based directly on the persona’s style profile."
    },
    {
      "question": "How accurate are the AI responses?",
      "answer": "The AI replies mimic the exact wording patterns and tone distilled from your real conversations. While it won’t remember every single detail, it uses the extracted style profile plus recent context to stay highly relevant and in-character."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleClearAllData = () => {
    if (clearAllData()) {
      setShowClearConfirm(false);
      showToast({
        type: 'success',
        title: 'All Data Cleared',
        message: 'All personas and training data have been removed successfully.',
        duration: 4000
      });
    } else {
      showToast({
        type: 'error',
        title: 'Failed to Clear Data',
        message: 'There was an error clearing your data. Please try again.',
        duration: 5000
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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

      {/* Section Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
              What You Can Do
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Create digital twins of anyone for realistic practice and rehearsal
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8V4l4 4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Create Digital Twins</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Upload real chat conversations and our AI creates lifelike digital twins that match the person&apos;s communication style, tone, and personality.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Practice Any Scenario</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Role-play with digital twins that respond like the real person. Practice sales pitches, difficult conversations, or just chat with AI clones of friends and colleagues.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Get Performance Insights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Receive detailed feedback on your conversations including style matching, tone analysis, and actionable improvement tips.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/50 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">Private & Secure</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All processing happens in your browser. No sign-ups, no cloud databases—just private, data-driven rehearsal that&apos;s as versatile as it is powerful.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* Supported Formats Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
              Supported File Formats
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We support multiple chat export formats from popular platforms
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-8 text-center space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">CSV</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">CSV Export</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                WhatsApp, Telegram, and other platforms that export to CSV format with sender, message, and timestamp columns.
              </p>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 rounded-2xl p-8 text-center space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">JSON</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">JSON Format</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Structured data format with sender and message objects. Common in API exports and custom chat applications.
              </p>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl p-8 text-center space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative">
              {/* Best Format Badge */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                RECOMMENDED
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">TXT</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Text Export ⭐</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-green-600 dark:text-green-400">Works best!</strong> WhatsApp chat export format (.txt files) with timestamps and sender names. Supports multiline messages and various date formats.
              </p>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/50 rounded-2xl p-8 text-center space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">XML</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">SMS Backup</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SMS Backup & Restore format for Android devices. Perfect for importing SMS conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
              Perfect For
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Anyone looking to practice conversations with realistic AI clones
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-8 space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Sales Professionals</h3>
              <p className="text-muted-foreground leading-relaxed">
                Practice your pitch with AI clones of your toughest prospects. Rehearse objection handling and closing techniques with realistic responses.
              </p>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 rounded-2xl p-8 space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Personal Conversations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Practice difficult conversations with AI clones of friends, family, or colleagues. Rehearse important discussions in a safe, private environment.
              </p>
            </div>
            
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl p-8 space-y-4 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Teams & Organizations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Train entire teams with consistent scenarios. Create digital twins from real interactions and share them across your organization for standardized practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Common questions about our AI-powered digital twin platform
            </p>
            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All My Data
              </Button>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <button
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                    onClick={() => toggleFAQ(index)}
                  >
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{faq.question}</h3>
                    <svg
                      className={`w-6 h-6 text-purple-600 dark:text-purple-400 transition-transform duration-300 ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-8 pb-6">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* Future Roadmap Section */}
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

      {/* Section Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Clear All Data?
            </h3>
            <p className="text-muted-foreground mb-6">
              This will permanently delete all your personas and training history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAllData}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
