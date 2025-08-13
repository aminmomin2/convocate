/**
 * PersonaCard Component
 * 
 * Individual persona card displaying persona information and actions.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { PersonaAvatar } from '@/components/ui/avatar';
import { IconLabel } from '@/components/ui/icon-label';
import { HStack } from '@/components/ui/stack';
import { MessageCircle, CheckCircle, Trash2 } from 'lucide-react';
import { StoredPersona } from '@/types/persona';

interface PersonaCardProps {
  persona: StoredPersona;
  onDeletePersona: (personaId: string) => void;
}

export function PersonaCard({ persona, onDeletePersona }: PersonaCardProps) {
  return (
    <Card className="group hover:shadow-lg hover:scale-102 transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
          <PersonaAvatar 
            src={persona.avatar} 
            name={persona.name} 
            size="xl"
          />
        </div>
        <CardTitle className="text-xl text-slate-900 dark:text-white">{persona.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {persona.description}
        </p>
        
        {/* Stats */}
        <HStack justify="center" spacing="md" className="text-xs text-muted-foreground">
          <IconLabel icon={<MessageCircle className="w-3 h-3" />} size="sm" variant="muted">
            {persona.transcript?.length || 0} messages
          </IconLabel>
          {persona.chatHistory?.length > 0 && (
            <IconLabel icon={<CheckCircle className="w-3 h-3" />} size="sm" variant="primary" className="text-green-600 dark:text-green-400">
              {persona.chatHistory.length} training
            </IconLabel>
          )}
        </HStack>
        
        <div className="flex gap-2">
          <Link href={`/dashboard/${persona.id}`} className="flex-1">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer">
              {persona.chatHistory?.length > 0 ? 'Continue' : 'Start Training'}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeletePersona(persona.id)}
            className="px-3 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
            title="Delete persona"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
