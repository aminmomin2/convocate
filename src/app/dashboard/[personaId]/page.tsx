"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PersonaSelector from '@/components/PersonaSelector';
import ChatWindow from '@/components/ChatWindow';
import ScorePanel from '@/components/ScorePanel';
import { StoredPersona, StyleProfile } from '@/types/persona';
import { clearPersonaHistory } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';
import { Target, ArrowLeft, Lightbulb, Trash2, Palette, ChevronDown, ChevronUp } from 'lucide-react';

interface PersonaDetailPageProps {
  params: Promise<{
    personaId: string;
  }>;
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

// Expandable list component for showing limited items with "show more" functionality
interface ExpandableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
  moreText?: string;
}

function ExpandableList<T>({ items, renderItem, initialCount = 8, moreText }: ExpandableListProps<T>) {
  const [showAll, setShowAll] = useState(false);
  
  if (items.length === 0) return null;
  
  const displayItems = showAll ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;
  const remainingCount = items.length - initialCount;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {displayItems.map(renderItem)}
      </div>
      
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          +{remainingCount} more{moreText ? ` ${moreText}` : ''}
        </button>
      )}
      
      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

// Collapsible section component (for mobile)
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-semibold text-base hover:text-primary transition-colors"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Responsive section wrapper - collapsible on mobile, always open on desktop
interface ResponsiveSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function ResponsiveSection({ title, defaultOpen = true, children }: ResponsiveSectionProps) {
  return (
    <>
      {/* Desktop version - always expanded */}
      <div className="hidden md:block space-y-4">
        <h3 className="font-semibold text-base">{title}</h3>
        <div className="space-y-3">
          {children}
        </div>
      </div>
      
      {/* Mobile version - collapsible */}
      <div className="block md:hidden">
        <CollapsibleSection title={title} defaultOpen={defaultOpen}>
          {children}
        </CollapsibleSection>
      </div>
    </>
  );
}

// Trait bar component
interface TraitBarProps {
  label: string;
  value: number;
}

function TraitBar({ label, value }: TraitBarProps) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <h4 className="font-medium text-sm mb-1">{label}</h4>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${value * 100}%` }}
          ></div>
        </div>
        <span className="text-xs text-muted-foreground">{value * 10}/10</span>
      </div>
    </div>
  );
}

// Enhanced style profile display component
interface StyleProfileDisplayProps {
  styleProfile: StyleProfile;
}

function StyleProfileDisplay({ styleProfile }: StyleProfileDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Communication Style */}
      <ResponsiveSection title="Communication Style" defaultOpen={true}>
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Tone</h4>
            <p className="text-sm text-muted-foreground break-words">{styleProfile.tone}</p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Formality</h4>
            <p className="text-sm text-muted-foreground capitalize">{styleProfile.formality}</p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Pacing</h4>
            <p className="text-sm text-muted-foreground break-words">{styleProfile.pacing}</p>
          </div>
        </div>
      </ResponsiveSection>

      {/* Personality Traits */}
      {styleProfile.traits && (
        <ResponsiveSection title="Personality Traits" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-3">
            <TraitBar label="Openness" value={styleProfile.traits.openness || 5} />
            <TraitBar label="Expressiveness" value={styleProfile.traits.expressiveness || 5} />
            <TraitBar label="Humor" value={styleProfile.traits.humor || 5} />
            <TraitBar label="Empathy" value={styleProfile.traits.empathy || 5} />
            <TraitBar label="Directness" value={styleProfile.traits.directness || 5} />
            <TraitBar label="Enthusiasm" value={styleProfile.traits.enthusiasm || 5} />
          </div>
        </ResponsiveSection>
      )}

      {/* Signature Vocabulary */}
      {styleProfile.vocabulary && styleProfile.vocabulary.length > 0 && (
        <ResponsiveSection title="Signature Vocabulary">
          <ExpandableList
            items={styleProfile.vocabulary}
            renderItem={(word, index) => (
              <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {word}
              </span>
            )}
            initialCount={10}
            moreText="words"
          />
        </ResponsiveSection>
      )}

      {/* Quirks */}
      {styleProfile.quirks && styleProfile.quirks.length > 0 && (
        <ResponsiveSection title="Communication Quirks">
          <ExpandableList
            items={styleProfile.quirks}
            renderItem={(quirk, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">{quirk}</p>
              </div>
            )}
            initialCount={5}
            moreText="quirks"
          />
        </ResponsiveSection>
      )}

      {/* Emotional Profile */}
      {styleProfile.emotions && (
        <ResponsiveSection title="Emotional Profile">
          <div className="space-y-3">
            {styleProfile.emotions.primary && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Primary Emotion</h4>
                <p className="text-sm text-muted-foreground capitalize">{styleProfile.emotions.primary}</p>
              </div>
            )}
            
            {styleProfile.emotions.secondary && styleProfile.emotions.secondary.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Secondary Emotions</h4>
                <ExpandableList
                  items={styleProfile.emotions.secondary}
                  renderItem={(emotion, index) => (
                    <span key={index} className="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded text-xs">
                      {emotion}
                    </span>
                  )}
                  initialCount={6}
                  moreText="emotions"
                />
              </div>
            )}

            {styleProfile.emotions.triggers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {styleProfile.emotions.triggers.positive && styleProfile.emotions.triggers.positive.length > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-1 text-green-700 dark:text-green-300">Positive Triggers</h4>
                    <ExpandableList
                      items={styleProfile.emotions.triggers.positive}
                      renderItem={(trigger, index) => (
                        <div key={index} className="text-xs text-green-600 dark:text-green-400">• {trigger}</div>
                      )}
                      initialCount={5}
                      moreText="triggers"
                    />
                  </div>
                )}
                
                {styleProfile.emotions.triggers.negative && styleProfile.emotions.triggers.negative.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-1 text-red-700 dark:text-red-300">Negative Triggers</h4>
                    <ExpandableList
                      items={styleProfile.emotions.triggers.negative}
                      renderItem={(trigger, index) => (
                        <div key={index} className="text-xs text-red-600 dark:text-red-400">• {trigger}</div>
                      )}
                      initialCount={5}
                      moreText="triggers"
                    />
                  </div>
                )}
              </div>
            )}

            {styleProfile.emotions.mood_patterns && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Mood Patterns</h4>
                <div className="space-y-2">
                  {styleProfile.emotions.mood_patterns.typical_mood && (
                    <div>
                      <span className="text-xs font-medium">Typical Mood: </span>
                      <span className="text-xs text-muted-foreground">{styleProfile.emotions.mood_patterns.typical_mood}</span>
                    </div>
                  )}
                  {styleProfile.emotions.mood_patterns.mood_indicators && styleProfile.emotions.mood_patterns.mood_indicators.length > 0 && (
                    <div>
                      <span className="text-xs font-medium">Mood Indicators: </span>
                      <ExpandableList
                        items={styleProfile.emotions.mood_patterns.mood_indicators}
                        renderItem={(indicator, index) => (
                          <span key={index} className="text-xs text-muted-foreground">{indicator}</span>
                        )}
                        initialCount={3}
                        moreText="indicators"
                      />
                    </div>
                  )}
                  {styleProfile.emotions.mood_patterns.stress_indicators && styleProfile.emotions.mood_patterns.stress_indicators.length > 0 && (
                    <div>
                      <span className="text-xs font-medium">Stress Indicators: </span>
                      <ExpandableList
                        items={styleProfile.emotions.mood_patterns.stress_indicators}
                        renderItem={(indicator, index) => (
                          <span key={index} className="text-xs text-muted-foreground">{indicator}</span>
                        )}
                        initialCount={3}
                        moreText="indicators"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResponsiveSection>
      )}

      {/* Communication Preferences */}
      {styleProfile.preferences && (
        <ResponsiveSection title="Communication Preferences">
          <div className="space-y-3">
            {styleProfile.preferences.topics && styleProfile.preferences.topics.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Preferred Topics</h4>
                <ExpandableList
                  items={styleProfile.preferences.topics}
                  renderItem={(topic, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {topic}
                    </span>
                  )}
                  initialCount={8}
                  moreText="topics"
                />
              </div>
            )}

            {styleProfile.preferences.avoids && styleProfile.preferences.avoids.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Topics to Avoid</h4>
                <ExpandableList
                  items={styleProfile.preferences.avoids}
                  renderItem={(avoid, index) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">
                      {avoid}
                    </span>
                  )}
                  initialCount={6}
                  moreText="topics"
                />
              </div>
            )}

            {styleProfile.preferences.engagement && styleProfile.preferences.engagement.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Engagement Style</h4>
                <ExpandableList
                  items={styleProfile.preferences.engagement}
                  renderItem={(style, index) => (
                    <div key={index} className="text-sm text-muted-foreground">• {style}</div>
                  )}
                  initialCount={5}
                  moreText="engagement patterns"
                />
              </div>
            )}

            {styleProfile.preferences.relationship_dynamics && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Relationship Dynamics</h4>
                <div className="space-y-2">
                  {styleProfile.preferences.relationship_dynamics.power_position && (
                    <div>
                      <span className="text-xs font-medium">Power Position: </span>
                      <span className="text-xs text-muted-foreground">{styleProfile.preferences.relationship_dynamics.power_position}</span>
                    </div>
                  )}
                  {styleProfile.preferences.relationship_dynamics.boundary_style && (
                    <div>
                      <span className="text-xs font-medium">Boundary Style: </span>
                      <span className="text-xs text-muted-foreground">{styleProfile.preferences.relationship_dynamics.boundary_style}</span>
                    </div>
                  )}
                  {styleProfile.preferences.relationship_dynamics.trust_indicators && styleProfile.preferences.relationship_dynamics.trust_indicators.length > 0 && (
                    <div>
                      <span className="text-xs font-medium">Trust Indicators: </span>
                      <ExpandableList
                        items={styleProfile.preferences.relationship_dynamics.trust_indicators}
                        renderItem={(indicator, index) => (
                          <span key={index} className="text-xs text-muted-foreground">{indicator}</span>
                        )}
                        initialCount={3}
                        moreText="indicators"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {styleProfile.preferences.context_preferences && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {styleProfile.preferences.context_preferences.formal_contexts && styleProfile.preferences.context_preferences.formal_contexts.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Formal Contexts</h4>
                    <ExpandableList
                      items={styleProfile.preferences.context_preferences.formal_contexts}
                      renderItem={(context, index) => (
                        <div key={index} className="text-xs text-muted-foreground">• {context}</div>
                      )}
                      initialCount={4}
                      moreText="contexts"
                    />
                  </div>
                )}
                
                {styleProfile.preferences.context_preferences.casual_contexts && styleProfile.preferences.context_preferences.casual_contexts.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Casual Contexts</h4>
                    <ExpandableList
                      items={styleProfile.preferences.context_preferences.casual_contexts}
                      renderItem={(context, index) => (
                        <div key={index} className="text-xs text-muted-foreground">• {context}</div>
                      )}
                      initialCount={4}
                      moreText="contexts"
                    />
                  </div>
                )}
                
                {styleProfile.preferences.context_preferences.work_contexts && styleProfile.preferences.context_preferences.work_contexts.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Work Contexts</h4>
                    <ExpandableList
                      items={styleProfile.preferences.context_preferences.work_contexts}
                      renderItem={(context, index) => (
                        <div key={index} className="text-xs text-muted-foreground">• {context}</div>
                      )}
                      initialCount={4}
                      moreText="contexts"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ResponsiveSection>
      )}

      {/* Communication Patterns */}
      {styleProfile.communication_patterns && (
        <ResponsiveSection title="Communication Patterns">
          <div className="grid grid-cols-1 gap-3">
            {styleProfile.communication_patterns.message_length && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Message Length</h4>
                <p className="text-sm text-muted-foreground capitalize">{styleProfile.communication_patterns.message_length}</p>
              </div>
            )}
            
            {styleProfile.communication_patterns.punctuation_style && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Punctuation Style</h4>
                <p className="text-sm text-muted-foreground capitalize">{styleProfile.communication_patterns.punctuation_style}</p>
              </div>
            )}
            
            {styleProfile.communication_patterns.capitalization && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Capitalization</h4>
                <p className="text-sm text-muted-foreground capitalize">{styleProfile.communication_patterns.capitalization}</p>
              </div>
            )}

            {styleProfile.communication_patterns.abbreviations && styleProfile.communication_patterns.abbreviations.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Common Abbreviations</h4>
                <ExpandableList
                  items={styleProfile.communication_patterns.abbreviations}
                  renderItem={(abbrev, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                      {abbrev}
                    </span>
                  )}
                  initialCount={8}
                  moreText="abbreviations"
                />
              </div>
            )}

            {styleProfile.communication_patterns.unique_expressions && styleProfile.communication_patterns.unique_expressions.length > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Unique Expressions</h4>
                <ExpandableList
                  items={styleProfile.communication_patterns.unique_expressions}
                  renderItem={(expression, index) => (
                    <span key={index} className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-xs">
                      {expression}
                    </span>
                  )}
                  initialCount={8}
                  moreText="expressions"
                />
              </div>
            )}
          </div>
        </ResponsiveSection>
      )}

      {/* Example Messages */}
      {styleProfile.examples && styleProfile.examples.length > 0 && (
        <ResponsiveSection title="Example Messages">
          <ExpandableList
            items={styleProfile.examples}
            renderItem={(example, index) => (
              <div key={index} className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm italic break-words">&ldquo;{example}&rdquo;</p>
              </div>
            )}
            initialCount={3}
            moreText="examples"
          />
        </ResponsiveSection>
      )}
    </div>
  );
}

export default function PersonaDetailPage({ params }: PersonaDetailPageProps) {
  const resolvedParams = React.use(params);
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
      const dataKey = `scorePanel_${resolvedParams.personaId}`;
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
  }, [resolvedParams.personaId]);

  useEffect(() => {
    const loadPersonaFromStorage = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === resolvedParams.personaId);
          
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
  }, [resolvedParams.personaId]);

  // Load ScorePanel data whenever persona changes
  useEffect(() => {
    setHasLoadedScorePanelData(false); // Reset loading flag when switching personas
    loadScorePanelData();
  }, [resolvedParams.personaId, loadScorePanelData]);

  // Save score panel data to localStorage
  const saveScorePanelData = useCallback(() => {
    try {
      const dataKey = `scorePanel_${resolvedParams.personaId}`;
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
  }, [resolvedParams.personaId, currentScore, currentTips, messageCount, usageInfo]);

  // Save score panel data whenever relevant state changes (but only after initial load)
  useEffect(() => {
    if (resolvedParams.personaId && hasLoadedScorePanelData) {
      
      saveScorePanelData();
    }
  }, [saveScorePanelData, resolvedParams.personaId, hasLoadedScorePanelData]);

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
    if (clearPersonaHistory(resolvedParams.personaId)) {
      // Reset score panel data (but keep usage info since it's IP-based)
      setCurrentScore(null);
      setCurrentTips([]);
      setMessageCount(0);
      // Don't reset usageInfo - it's IP-based and should persist
      setHasTrainingHistory(false);
      
      // Clear score panel data from localStorage (but preserve usage info)
      const currentUsageInfo = usageInfo; // Save current usage info
      localStorage.removeItem(`scorePanel_${resolvedParams.personaId}`);
      
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
  }, [resolvedParams.personaId, showToast, usageInfo]);

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
          const currentPersona = personas.find((p: StoredPersona) => p.id === resolvedParams.personaId);
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
  }, [resolvedParams.personaId, messageCount]);

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
            personaId={resolvedParams.personaId}
            name={persona.name}
            description={persona.description}
          />
        </div>

        {/* Center: Chat Window */}
        <div className="flex flex-col h-full">
          <ChatWindow 
            key={chatRefreshKey}
            personaId={resolvedParams.personaId} 
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
            personaId={resolvedParams.personaId} 
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

                {/* Enhanced Style Profile with Collapsible Sections */}
                <StyleProfileDisplay styleProfile={currentPersona.styleProfile} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}