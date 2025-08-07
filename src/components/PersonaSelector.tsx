import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Palette, Clock, BookOpen, Sparkles } from 'lucide-react';
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
            <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-primary/10 flex items-center justify-center`}>
              <span className="text-primary font-semibold text-lg">
                {name.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1">
              <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'}`}>
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
          
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      )}


    </div>
  );
}