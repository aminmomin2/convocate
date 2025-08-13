/**
 * PersonasGrid Component
 * 
 * Grid layout for displaying persona cards.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import { StoredPersona } from '@/types/persona';
import { CardGrid } from '@/components/layout';
import { PersonaCard } from './PersonaCard';

interface PersonasGridProps {
  personas: StoredPersona[];
  onDeletePersona: (personaId: string) => void;
}

export function PersonasGrid({ personas, onDeletePersona }: PersonasGridProps) {
  return (
    <CardGrid cols={4} gap="md">
      {personas.map((persona) => (
        <PersonaCard 
          key={persona.id} 
          persona={persona} 
          onDeletePersona={onDeletePersona} 
        />
      ))}
    </CardGrid>
  );
}
