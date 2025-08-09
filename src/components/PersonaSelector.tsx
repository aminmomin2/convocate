import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Palette, Clock, BookOpen, Sparkles, Heart, Brain, Users, Zap, Target, MessageSquare, BarChart3, Smile, AlertTriangle, Lightbulb, Shield } from 'lucide-react';
import { StoredPersona } from '@/types/persona';

interface PersonaSelectorProps {
  personaId: string;
  name: string;
  description: string;
  isMobile?: boolean;
}

export default function PersonaSelector({ 
  personaId, 
  name, 
  description, 
  isMobile = false 
}: PersonaSelectorProps) {
  const [messageCount, setMessageCount] = useState<number>(0);
  const [lastMessageTime, setLastMessageTime] = useState<string>('');
  const [currentPersona, setCurrentPersona] = useState<StoredPersona | null>(null);

  useEffect(() => {
    const loadPersonaStats = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === personaId);
          
          if (currentPersona) {
            setCurrentPersona(currentPersona);
            // Use transcript for total message count (training data)
            const totalMessages = (currentPersona.transcript?.length || 0) + (currentPersona.chatHistory?.length || 0);
            setMessageCount(totalMessages);
            
            // Get the most recent message timestamp from chatHistory first, then transcript
            const allMessages = [...(currentPersona.chatHistory || []), ...(currentPersona.transcript || [])];
            if (allMessages.length > 0) {
              const lastMessage = allMessages[allMessages.length - 1];
              if (lastMessage.timestamp) {
                const date = new Date(lastMessage.timestamp);
                setLastMessageTime(date.toLocaleDateString());
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load persona stats:', error);
      }
    };

    loadPersonaStats();
  }, [personaId]);

  return (
    <div className="space-y-4">
      {/* Main Persona Card */}
      <Card className={`${isMobile ? 'shadow-none border-none' : ''}`}>
        <CardHeader className={`${isMobile ? 'pb-2' : ''}`}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`${isMobile ? 'w-10 h-10' : 'w-16 h-16'} rounded-full bg-primary/10 flex items-center justify-center`}>
              <span className={`text-primary font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                {name.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className={`${isMobile ? 'text-base' : 'text-xl'} truncate`}>
                {name}
              </CardTitle>
              {!isMobile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Mobile message count display */}
          {isMobile && messageCount > 0 && (
            <div className="mb-3 flex items-center text-xs text-muted-foreground">
              <MessageCircle className="w-3 h-3 mr-1" />
              <span>{messageCount} messages</span>
              {lastMessageTime && (
                <>
                  <span className="mx-2">•</span>
                  <span>Last: {lastMessageTime}</span>
                </>
              )}
            </div>
          )}

          <div className="space-y-2 mt-4">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className={`w-full ${isMobile ? 'h-8 text-sm' : ''} cursor-pointer`}
              >
                <ArrowLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {!isMobile && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Persona Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">ID:</span>
                  <span className="ml-2 text-muted-foreground">{personaId}</span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="ml-2 text-green-600">Active</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="font-medium">Messages:</span>
                  <span className="ml-2 text-muted-foreground">{messageCount}</span>
                </div>
                {lastMessageTime && (
                  <div>
                    <span className="font-medium">Last Activity:</span>
                    <span className="ml-2 text-muted-foreground">{lastMessageTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Profile Card */}
      {currentPersona?.styleProfile && (
        <Card className={`${isMobile ? 'shadow-none border-none' : ''}`}>
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center`}>
              <Palette className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-2`} />
              Style Profile
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Basic Style Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                Basic Style
              </h4>
              
              {/* Tone */}
              <div className="space-y-1">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <Palette className="w-3 h-3 mr-1" />
                  Tone
                </div>
                <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.tone}</p>
              </div>

              {/* Formality */}
              <div className="space-y-1">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Formality
                </div>
                <p className="text-xs bg-muted/50 rounded px-2 py-1 capitalize">{currentPersona.styleProfile.formality}</p>
              </div>

              {/* Pacing */}
              <div className="space-y-1">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Pacing
                </div>
                <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.pacing}</p>
              </div>
            </div>

            {/* Personality Traits Section */}
            {currentPersona.styleProfile.traits && Object.keys(currentPersona.styleProfile.traits).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Personality Traits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentPersona.styleProfile.traits.openness && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Openness
                      </div>
                      <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.traits.openness * 10}/10</p>
                    </div>
                  )}
                  
                  {currentPersona.styleProfile.traits.expressiveness && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Heart className="w-3 h-3 mr-1" />
                        Expressiveness
                      </div>
                      <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.traits.expressiveness * 10}/10</p>
                    </div>
                  )}
                  
                  {currentPersona.styleProfile.traits.humor && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Smile className="w-3 h-3 mr-1" />
                        Humor
                      </div>
                      <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.traits.humor * 10}/10</p>
                    </div>
                  )}
                  
                  {currentPersona.styleProfile.traits.empathy && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Heart className="w-3 h-3 mr-1" />
                        Empathy
                      </div>
                      <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.traits.empathy * 10}/10</p>
                    </div>
                  )}
                  
                  {currentPersona.styleProfile.traits.directness && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Target className="w-3 h-3 mr-1" />
                        Directness
                      </div>
                      <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.traits.directness * 10}/10</p>
                    </div>
                  )}
                  
                  {currentPersona.styleProfile.traits.enthusiasm && (
                    <div className="space-y-1">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Zap className="w-3 h-3 mr-1" />
                        Enthusiasm
                      </div>
                      <p className="text-xs bg-muted/50 rounded px-2 py-1">{currentPersona.styleProfile.traits.enthusiasm * 10}/10</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emotions Section */}
            {currentPersona.styleProfile.emotions && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Emotional Profile
                </h4>
                
                {currentPersona.styleProfile.emotions.primary && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Smile className="w-3 h-3 mr-1" />
                      Primary Emotion
                    </div>
                    <p className="text-xs bg-muted/50 rounded px-2 py-1 capitalize">{currentPersona.styleProfile.emotions.primary}</p>
                  </div>
                )}

                {currentPersona.styleProfile.emotions.secondary && currentPersona.styleProfile.emotions.secondary.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Heart className="w-3 h-3 mr-1" />
                      Secondary Emotions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.emotions.secondary.map((emotion, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1 capitalize">
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentPersona.styleProfile.emotions.triggers?.positive && currentPersona.styleProfile.emotions.triggers.positive.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Positive Triggers
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.emotions.triggers.positive.slice(0, 4).map((trigger, index) => (
                        <span key={index} className="text-xs bg-green-100 text-green-700 rounded px-2 py-1">
                          {trigger}
                        </span>
                      ))}
                      {currentPersona.styleProfile.emotions.triggers.positive.length > 4 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.emotions.triggers.positive.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {currentPersona.styleProfile.emotions.triggers?.negative && currentPersona.styleProfile.emotions.triggers.negative.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Negative Triggers
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.emotions.triggers.negative.slice(0, 4).map((trigger, index) => (
                        <span key={index} className="text-xs bg-red-100 text-red-700 rounded px-2 py-1">
                          {trigger}
                        </span>
                      ))}
                      {currentPersona.styleProfile.emotions.triggers.negative.length > 4 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.emotions.triggers.negative.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Section */}
            {currentPersona.styleProfile.preferences && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Communication Preferences
                </h4>
                
                {currentPersona.styleProfile.preferences.topics && currentPersona.styleProfile.preferences.topics.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Preferred Topics
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.preferences.topics.slice(0, 5).map((topic, index) => (
                        <span key={index} className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-1">
                          {topic}
                        </span>
                      ))}
                      {currentPersona.styleProfile.preferences.topics.length > 5 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.preferences.topics.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {currentPersona.styleProfile.preferences.avoids && currentPersona.styleProfile.preferences.avoids.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Shield className="w-3 h-3 mr-1" />
                      Avoids
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.preferences.avoids.slice(0, 4).map((avoid, index) => (
                        <span key={index} className="text-xs bg-orange-100 text-orange-700 rounded px-2 py-1">
                          {avoid}
                        </span>
                      ))}
                      {currentPersona.styleProfile.preferences.avoids.length > 4 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.preferences.avoids.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {currentPersona.styleProfile.preferences.engagement && currentPersona.styleProfile.preferences.engagement.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Users className="w-3 h-3 mr-1" />
                      Engagement Style
                    </div>
                    <div className="space-y-1">
                      {currentPersona.styleProfile.preferences.engagement.slice(0, 3).map((style, index) => (
                        <p key={index} className="text-xs bg-muted/50 rounded px-2 py-1">• {style}</p>
                      ))}
                      {currentPersona.styleProfile.preferences.engagement.length > 3 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.preferences.engagement.length - 3} more styles
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Communication Patterns Section */}
            {currentPersona.styleProfile.communication_patterns && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  Communication Patterns
                </h4>
                
                {currentPersona.styleProfile.communication_patterns.message_length && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Message Length
                    </div>
                    <p className="text-xs bg-muted/50 rounded px-2 py-1 capitalize">{currentPersona.styleProfile.communication_patterns.message_length}</p>
                  </div>
                )}

                {currentPersona.styleProfile.communication_patterns.punctuation_style && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Punctuation Style
                    </div>
                    <p className="text-xs bg-muted/50 rounded px-2 py-1 capitalize">{currentPersona.styleProfile.communication_patterns.punctuation_style}</p>
                  </div>
                )}

                {currentPersona.styleProfile.communication_patterns.capitalization && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Capitalization
                    </div>
                    <p className="text-xs bg-muted/50 rounded px-2 py-1 capitalize">{currentPersona.styleProfile.communication_patterns.capitalization}</p>
                  </div>
                )}

                {currentPersona.styleProfile.communication_patterns.abbreviations && currentPersona.styleProfile.communication_patterns.abbreviations.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Common Abbreviations
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.communication_patterns.abbreviations.slice(0, 6).map((abbrev, index) => (
                        <span key={index} className="text-xs bg-indigo-100 text-indigo-700 rounded px-2 py-1">
                          {abbrev}
                        </span>
                      ))}
                      {currentPersona.styleProfile.communication_patterns.abbreviations.length > 6 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.communication_patterns.abbreviations.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {currentPersona.styleProfile.communication_patterns.unique_expressions && currentPersona.styleProfile.communication_patterns.unique_expressions.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <Brain className="w-3 h-3 mr-1" />
                      Unique Expressions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentPersona.styleProfile.communication_patterns.unique_expressions.slice(0, 6).map((expr, index) => (
                        <span key={index} className="text-xs bg-teal-100 text-teal-700 rounded px-2 py-1">
                          {expr}
                        </span>
                      ))}
                      {currentPersona.styleProfile.communication_patterns.unique_expressions.length > 6 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{currentPersona.styleProfile.communication_patterns.unique_expressions.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Original sections at the end */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                Language & Examples
              </h4>
              
              {/* Vocabulary */}
              {currentPersona.styleProfile.vocabulary && currentPersona.styleProfile.vocabulary.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center text-xs font-medium text-muted-foreground">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Key Vocabulary
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentPersona.styleProfile.vocabulary.slice(0, 6).map((word, index) => (
                      <span key={index} className="text-xs bg-primary/10 text-primary rounded px-2 py-1">
                        {word}
                      </span>
                    ))}
                    {currentPersona.styleProfile.vocabulary.length > 6 && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        +{currentPersona.styleProfile.vocabulary.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Quirks */}
              {currentPersona.styleProfile.quirks && currentPersona.styleProfile.quirks.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center text-xs font-medium text-muted-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Communication Quirks
                  </div>
                  <div className="space-y-1">
                    {currentPersona.styleProfile.quirks.slice(0, 3).map((quirk, index) => (
                      <p key={index} className="text-xs bg-muted/50 rounded px-2 py-1">• {quirk}</p>
                    ))}
                    {currentPersona.styleProfile.quirks.length > 3 && (
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        +{currentPersona.styleProfile.quirks.length - 3} more quirks
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Examples */}
              {currentPersona.styleProfile.examples && currentPersona.styleProfile.examples.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center text-xs font-medium text-muted-foreground">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Example Messages
                  </div>
                  <div className="space-y-1">
                    {currentPersona.styleProfile.examples.slice(0, 2).map((example, index) => (
                      <p key={index} className="text-xs bg-muted/50 rounded px-2 py-1 italic">&ldquo;{example}&rdquo;</p>
                    ))}
                    {currentPersona.styleProfile.examples.length > 2 && (
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        +{currentPersona.styleProfile.examples.length - 2} more examples
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}