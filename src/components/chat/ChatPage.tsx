/**
 * ChatPage Component
 * 
 * Main chat interface that orchestrates all chat-related components.
 * This component consolidates the chat functionality from the dashboard page.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  PersonaSelector, 
  ChatWindow, 
  ScorePanel 
} from './components';
import { StoredPersona } from '@/types/persona';
import { clearPersonaHistory } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';
import { Target, ArrowLeft, Lightbulb, Trash2, Palette } from 'lucide-react';

interface ChatPageProps {
  personaId: string;
}

interface PersonaData {
  name: string;
  description: string;
}

interface ScorePanelData {
  score: number | null;
  tips: string[];
  messageCount: number;
  usageInfo?: {
    totalMessagesUsed: number;
    maxMessagesPerIP: number;
  } | null;
}

export default function ChatPage({ personaId }: ChatPageProps) {
  const { showToast } = useToast();
  const [persona, setPersona] = useState<PersonaData>({ name: 'Loading...', description: 'Loading persona data...' });
  const [loading, setLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentTips, setCurrentTips] = useState<string[]>([]);
  const [isScoringLoading, setIsScoringLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [usageInfo, setUsageInfo] = useState<ScorePanelData['usageInfo']>(null);
  const [hasLoadedScorePanelData, setHasLoadedScorePanelData] = useState(false);
  const [hasTrainingHistory, setHasTrainingHistory] = useState(false);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const [showScorePanel, setShowScorePanel] = useState(false);
  const [showStyleProfile, setShowStyleProfile] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<StoredPersona | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  // Load score panel data from localStorage
  const loadScorePanelData = useCallback(() => {
    try {
      const dataKey = `scorePanel_${personaId}`;
      const savedData = localStorage.getItem(dataKey);
      
      if (savedData) {
        const panelData: ScorePanelData = JSON.parse(savedData);
    
        setCurrentScore(panelData.score);
        setCurrentTips(panelData.tips || []);
        setMessageCount(panelData.messageCount || 0);
        setUsageInfo(panelData.usageInfo || null);
      } else {
        // Reset state for new persona with no saved data
        setCurrentScore(null);
        setCurrentTips([]);
        setMessageCount(0);
        setUsageInfo(null);
      }
      setHasLoadedScorePanelData(true);
    } catch (error) {
      console.error('Failed to load score panel data:', error);
      // Reset state on error
      setCurrentScore(null);
      setCurrentTips([]);
      setMessageCount(0);
      setUsageInfo(null);
      setHasLoadedScorePanelData(true);
    }
  }, [personaId]);

  useEffect(() => {
    const loadPersonaFromStorage = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === personaId);
          
          if (currentPersona) {
            setPersona({
              name: currentPersona.name,
              description: `Chat persona with ${currentPersona.transcript?.length || 0} messages`,
            });
            setCurrentPersona(currentPersona);
          } else {
            // Persona not found
            setPersona({ name: 'Persona Not Found', description: 'This persona could not be found. Please upload chat data to create personas.' });
          }
        } else {
          // No localStorage data
          setPersona({ name: 'No Personas Found', description: 'No personas have been uploaded yet. Please upload chat data to create personas.' });
        }
      } catch (error) {
        console.error('Failed to load persona from localStorage:', error);
        setPersona({ name: 'Error Loading Persona', description: 'There was an error loading the persona data.' });
      } finally {
        setLoading(false);
      }
    };

    loadPersonaFromStorage();
  }, [personaId]);

  // Load ScorePanel data whenever persona changes
  useEffect(() => {
    setHasLoadedScorePanelData(false); // Reset loading flag when switching personas
    loadScorePanelData();
  }, [personaId, loadScorePanelData]);

  // Save score panel data to localStorage
  const saveScorePanelData = useCallback(() => {
    try {
      const dataKey = `scorePanel_${personaId}`;
      const panelData: ScorePanelData = {
        score: currentScore,
        tips: currentTips,
        messageCount: messageCount,
        usageInfo: usageInfo,
      };
      localStorage.setItem(dataKey, JSON.stringify(panelData));
    } catch (error) {
      console.error('Failed to save score panel data:', error);
    }
  }, [personaId, currentScore, currentTips, messageCount, usageInfo]);

  // Save score panel data whenever relevant state changes (but only after initial load)
  useEffect(() => {
    if (personaId && hasLoadedScorePanelData) {
      saveScorePanelData();
    }
  }, [saveScorePanelData, personaId, hasLoadedScorePanelData]);

  // Handle score and tips updates from ChatWindow
  const handleScoreUpdate = useCallback((score: number | null, tips: string[]) => {
    if (score !== null && currentScore !== null) {
      setPreviousScore(currentScore);
    }
    setCurrentScore(score);
    setCurrentTips(tips);
    setIsScoringLoading(false);
  }, [currentScore]);

  const handleScoringStart = useCallback(() => {
    setIsScoringLoading(true);
  }, []);

  // Handle message count updates from ChatWindow
  const handleMessageCountUpdate = useCallback((count: number) => {
    setMessageCount(count);
    // Update training history status based on message count
    // We consider it training history if there are more than 1 message (excluding the initial welcome message)
    setHasTrainingHistory(count > 1);
  }, []);

  // Handle usage info updates from ChatWindow
  const handleUsageInfoUpdate = useCallback((usage: ScorePanelData['usageInfo']) => {
    setUsageInfo(usage);
  }, []);

  // Handle clear training history
  const handleClearTrainingHistory = useCallback(() => {
    if (clearPersonaHistory(personaId)) {
      // Reset score panel data (but keep usage info since it's IP-based)
      setCurrentScore(null);
      setCurrentTips([]);
      setMessageCount(0);
      // Don't reset usageInfo - it's IP-based and should persist
      setHasTrainingHistory(false);
      
      // Clear score panel data from localStorage (but preserve usage info)
      const currentUsageInfo = usageInfo; // Save current usage info
      localStorage.removeItem(`scorePanel_${personaId}`);
      
      // Restore usage info after clearing localStorage
      if (currentUsageInfo) {
        setUsageInfo(currentUsageInfo);
      }
      
      // Trigger chat window refresh
      setChatRefreshKey(prev => prev + 1);
      
      // Show success toast
      showToast({
        type: 'success',
        title: 'Training History Cleared',
        message: 'Your training conversations have been cleared successfully.',
        duration: 4000
      });
    } else {
      // Show error toast
      showToast({
        type: 'error',
        title: 'Failed to Clear History',
        message: 'There was an error clearing your training history. Please try again.',
        duration: 5000
      });
    }
  }, [personaId, showToast, usageInfo]);

  // Helper function to get score color
  const getScoreColor = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return 'text-primary';
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-primary';
  };

  // Check for training history
  useEffect(() => {
    const checkTrainingHistory = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === personaId);
          if (currentPersona) {
            // Consider it training history if there are actual conversation messages (not just the welcome message)
            const hasRealConversation = (currentPersona.chatHistory?.length || 0) > 0;
            setHasTrainingHistory(hasRealConversation);
          }
        }
      } catch (error) {
        console.error('Failed to check training history:', error);
      }
    };
    
    checkTrainingHistory();
  }, [personaId, messageCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading persona...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop Layout: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr_300px] lg:h-full">
        {/* Left: Persona Selector */}
        <div className="border-r border-border bg-muted/30 p-6 overflow-y-auto">
          <PersonaSelector 
            personaId={personaId}
            name={persona.name}
            description={persona.description}
          />
        </div>

        {/* Center: Chat Window */}
        <div className="flex flex-col h-full">
          <ChatWindow 
            key={chatRefreshKey}
            personaId={personaId} 
            onScoreUpdate={handleScoreUpdate}
            onScoringStart={handleScoringStart}
            onMessageCountUpdate={handleMessageCountUpdate}
            onUsageInfoUpdate={handleUsageInfoUpdate}
          />
        </div>

        {/* Right: Score Panel */}
        <div className="border-l border-border bg-muted/30 p-6 overflow-y-auto">
          <ScorePanel 
            score={currentScore}
            previousScore={previousScore}
            tips={currentTips}
            onClearHistory={handleClearTrainingHistory}
            hasTrainingHistory={hasTrainingHistory}
            isLoading={isScoringLoading}
          />
        </div>
      </div>

      {/* Mobile-First Layout: Completely redesigned for mobile */}
      <div className="lg:hidden h-screen bg-background flex flex-col">
        {/* Mobile Header - Minimal and clean */}
        <div className="flex-shrink-0 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back button and persona name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href="/dashboard" className="flex-shrink-0">
                <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-sm leading-tight break-words">{persona.name}</h1>
                <p className="text-xs text-muted-foreground leading-tight break-words">{persona.description}</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex-shrink-0 ml-2 flex items-center gap-2">
              {/* Style Profile Button */}
              <button
                onClick={() => {
                  setShowStyleProfile(!showStyleProfile);
                  if (showScorePanel) setShowScorePanel(false);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium whitespace-nowrap"
              >
                <Palette className="w-3 h-3" />
                Style
              </button>
              
              {/* Score indicator - compact */}
              {currentScore !== null && currentScore !== 0 ? (
                <button
                  onClick={() => {
                    setShowScorePanel(!showScorePanel);
                    if (showStyleProfile) setShowStyleProfile(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    getScoreColor(currentScore, previousScore) === 'text-green-600' 
                      ? 'bg-green-100 text-green-700' 
                      : getScoreColor(currentScore, previousScore) === 'text-red-600'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  {Math.round(currentScore)}%
                </button>
              ) : isScoringLoading || currentScore === 0 ? (
                /* Loading indicator with bouncing dots */
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs font-medium whitespace-nowrap">
                  <Target className="w-3 h-3 text-primary" />
                  <div className="flex space-x-0.5">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Chat Area - Full screen */}
        <div className="flex-1 relative overflow-hidden">
          <ChatWindow 
            key={chatRefreshKey}
            personaId={personaId} 
            onScoreUpdate={handleScoreUpdate}
            onScoringStart={handleScoringStart}
            onMessageCountUpdate={handleMessageCountUpdate}
            onUsageInfoUpdate={handleUsageInfoUpdate}
            isMobile={true}
          />
        </div>

        {/* Mobile Score Panel - Full screen overlay */}
        {showScorePanel && (
          <div className="fixed inset-0 bg-background z-50 flex flex-col">
            {/* Score Panel Header */}
            <div className="flex-shrink-0 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Performance</h2>
                <button
                  onClick={() => setShowScorePanel(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Score Panel Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-6">
                {/* Score Display */}
                {currentScore !== null && currentScore !== 0 ? (
                  <div className="text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      getScoreColor(currentScore, previousScore) === 'text-green-600' 
                        ? 'bg-green-100' 
                        : getScoreColor(currentScore, previousScore) === 'text-red-600'
                        ? 'bg-red-100'
                        : 'bg-primary/10'
                    }`}>
                      <span className={`text-2xl font-bold ${
                        getScoreColor(currentScore, previousScore)
                      }`}>{Math.round(currentScore)}%</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 break-words">
                      {currentScore >= 80 ? 'Excellent!' : currentScore >= 60 ? 'Good Progress!' : currentScore >= 40 ? 'Keep Practicing!' : 'Getting Started'}
                    </h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {currentScore >= 80 ? 'Outstanding performance' : 'Keep practicing to improve'}
                    </p>
                    {previousScore !== null && (
                      <div className="mt-2 text-xs">
                        {currentScore > previousScore && (
                          <span className="text-green-600">↑ Improved from {Math.round(previousScore)}%</span>
                        )}
                        {currentScore < previousScore && (
                          <span className="text-red-600">↓ Decreased from {Math.round(previousScore)}%</span>
                        )}
                        {currentScore === previousScore && (
                          <span className="text-muted-foreground">→ No change from {Math.round(previousScore)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : currentScore === 0 ? (
                  /* Score Loading Skeleton for Mobile */
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/60 animate-pulse mx-auto mb-4 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted/80 to-muted/40 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gradient-to-r from-muted to-muted/60 rounded animate-pulse mx-auto"></div>
                      <div className="h-3 w-32 bg-gradient-to-r from-muted/80 to-muted/40 rounded animate-pulse mx-auto"></div>
                    </div>
                  </div>
                ) : (
                  /* No score yet */
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-muted/30">
                        <span className="text-2xl font-bold text-muted-foreground">--</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 break-words">Start Chatting</h3>
                    <p className="text-sm text-muted-foreground break-words">Your score will appear here</p>
                  </div>
                )}

                {/* Scoring Loading Indicator */}
                {isScoringLoading && (
                  <div className="flex justify-center my-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md w-full">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">Analyzing your response...</p>
                          <p className="text-xs text-blue-600">Getting personalized feedback and tips</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips Section */}
                {currentTips.length > 0 && !(currentTips.length === 1 && currentTips[0] === "Response generated. Scoring in progress.") ? (
                  <div>
                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Tips for Improvement
                    </h3>
                    <div className="space-y-3">
                      {currentTips.map((tip, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm leading-relaxed break-words">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : currentTips.length === 1 && currentTips[0] === "Response generated. Scoring in progress." ? (
                  /* Tips Loading Skeleton for Mobile */
                  <div>
                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse" />
                      Tips for Improvement
                      <div className="flex space-x-1 ml-2">
                        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                      </div>
                    </h3>
                    <div className="space-y-3">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted to-muted/60 animate-pulse flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="space-y-2">
                              <div
                                className="h-3 bg-gradient-to-r from-muted to-muted/60 rounded animate-pulse"
                                style={{
                                  width: `${Math.random() * 40 + 60}%`,
                                  animationDelay: `${index * 100}ms`
                                }}
                              />
                              <div
                                className="h-3 bg-gradient-to-r from-muted/80 to-muted/40 rounded animate-pulse"
                                style={{
                                  width: `${Math.random() * 30 + 40}%`,
                                  animationDelay: `${index * 150}ms`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Usage Info */}
                {usageInfo && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">Usage</h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {usageInfo.totalMessagesUsed} / {usageInfo.maxMessagesPerIP} messages used
                    </p>
                  </div>
                )}

                {/* Clear History Button */}
                {hasTrainingHistory && (
                  <div className="p-4 border border-red-200 bg-red-50/50 rounded-lg">
                    <h3 className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Training History
                    </h3>
                    <p className="text-sm text-red-600 mb-3 break-words">
                      Clear your training conversations to start fresh with this persona.
                    </p>
                    <button
                      onClick={handleClearTrainingHistory}
                      className="w-full py-2 px-3 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors break-words"
                    >
                      Clear Training History
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Style Profile Panel - Full screen overlay */}
        {showStyleProfile && currentPersona && (
          <div className="fixed inset-0 bg-background z-50 flex flex-col">
            {/* Style Profile Header */}
            <div className="flex-shrink-0 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Style Profile</h2>
                <button
                  onClick={() => setShowStyleProfile(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Style Profile Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-6">
                {/* Persona Info */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-semibold text-primary">
                      {currentPersona.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{currentPersona.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentPersona.messageCount} messages analyzed
                  </p>
                </div>

                {/* Style Profile Display would go here - simplified for now */}
                <div className="text-center text-muted-foreground">
                  <p>Style profile details would be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
