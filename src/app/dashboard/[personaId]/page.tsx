"use client"
import React from 'react';
import { ChatPage } from '@/components/chat';

interface PersonaDetailPageProps {
  params: Promise<{
    personaId: string;
  }>;
}

export default function PersonaDetailPage({ params }: PersonaDetailPageProps) {
  const resolvedParams = React.use(params);
  
  return <ChatPage personaId={resolvedParams.personaId} />;
}