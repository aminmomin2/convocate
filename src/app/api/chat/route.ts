// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Msg, StyleProfile } from '@/types/persona';

interface ChatRequestBody {
  personaName: string;
  transcript: Msg[];
  chatHistory: Msg[];
  userMessage: string;
  styleProfile: StyleProfile;
}

export async function POST(req: Request) {
  try {
    const { personaName, transcript, chatHistory, userMessage, styleProfile } =
      (await req.json()) as ChatRequestBody;

    // Validate request
    if (
      !personaName ||
      !Array.isArray(transcript) ||
      !Array.isArray(chatHistory) ||
      typeof userMessage !== 'string' ||
      !styleProfile ||
      typeof styleProfile !== 'object'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Build context with strong “stay-in-character” framing
    const contextMessages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `
        You are now playing the role of ${personaName}. 
        Based solely on the conversation examples below, reply exactly as ${personaName} would—do not introduce any new information or break character.
        Only use the tone, wording, and style reflected in these examples.
        `.trim()
      },
      // last 15 transcript turns
      ...transcript
        .slice(-15)
        .map((m) => ({
          role: (m.sender === personaName ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.message
        })),
      // full session history
      ...chatHistory.map((m) => ({
        role: (m.sender === personaName ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.message
      }))
    ];

    // Append the new user query
    const fullChatMessages: ChatCompletionMessageParam[] = [
      ...contextMessages,
      { role: 'user', content: userMessage }
    ];

    console.log(fullChatMessages);

    // Main conversation call
    const chatRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: fullChatMessages
    });
    const twinReply = chatRes.choices?.[0]?.message?.content?.trim() ?? '';

    // Scoring & tips call with explicit JSON schema enforcement
    const scoreRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `
    You are an expert conversation evaluator.
    Here is ${personaName}'s style profile:
    
    Tone: ${styleProfile.tone}
    Formality: ${styleProfile.formality}
    Pacing: ${styleProfile.pacing}
    Common vocabulary: ${styleProfile.vocabulary.join(', ')}
    Quirks: ${styleProfile.quirks.join(', ')}
    Example messages: ${styleProfile.examples.join(' | ')}
    
    Now rate how well this reply matches that style and its overall positivity on a scale from 0–100, then give exactly three concise tips for improvement.
    Respond *only* with JSON in the form:
    {"score": number, "tips": [string, string, string]}
          `.trim()
        },
        { role: 'user', content: twinReply }
      ]
    });

    // Parse JSON safely
    let score = 0;
    let tips: string[] = [];
    try {
      const parsed = JSON.parse(scoreRes.choices[0]?.message?.content ?? '{}');
      if (typeof parsed.score === 'number') score = parsed.score;
      if (Array.isArray(parsed.tips)) tips = parsed.tips;
    } catch {
      // defaults retained
    }

    // Build messages for client
    const userMsg: Msg = {
      sender: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };
    const personaMsg: Msg = {
      sender: personaName,
      message: twinReply,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      twinReply,
      score,
      tips,
      userMessage: userMsg,
      personaMessage: personaMsg
    });
  } catch (err: unknown) {
    console.error('[chat/route] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
