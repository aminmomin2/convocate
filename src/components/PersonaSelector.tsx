import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
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

  useEffect(() => {
    const loadPersonaStats = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === personaId);
          
          if (currentPersona) {
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

        <Link href="/dashboard">
          <Button 
            variant="outline" 
            className={`w-full ${isMobile ? 'h-8 text-sm' : ''}`}
          >
            <ArrowLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
            Back to Dashboard
          </Button>
        </Link>

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
  );
}