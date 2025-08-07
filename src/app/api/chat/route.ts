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

const MAX_MESSAGES_PER_IP = 40; // 40 total messages per IP
const MAX_MESSAGE_LENGTH = 4000; // Prevent extremely long messages
const MAX_CONTEXT_MESSAGES = 20; // Total context messages limit

// In-memory throttle tracking
const ipMessageCounts = new Map<string, number>();

// Helper function to create a unique key for deduplication
function createMessageKey(message: Msg): string {
  return `${message.sender}:${message.message}`;
}

// Helper function to deduplicate messages
function deduplicateMessages(messages: Msg[]): Msg[] {
  const seen = new Set<string>();
  return messages.filter(msg => {
    const key = createMessageKey(msg);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function POST(req: Request) {
  const xff = req.headers.get("x-forwarded-for") || "unknown";
  const ip = xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

  // Check total message limit per IP
  const totalMessagesUsed = ipMessageCounts.get(ip) || 0;
  if (totalMessagesUsed >= MAX_MESSAGES_PER_IP) {
    return NextResponse.json({ 
      error: `You've reached the maximum number of messages per IP (${MAX_MESSAGES_PER_IP} messages). This limit is permanent and cannot be reset.` 
    }, { status: 429 });
  }

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

    // Validate message length to prevent expensive API calls
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ 
        error: `Message too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.` 
      }, { status: 400 });
    }

    // Deduplicate transcript and chat history separately first
    const deduplicatedTranscript = deduplicateMessages(transcript);
    const deduplicatedChatHistory = deduplicateMessages(chatHistory);

    // Build context messages with proportional split (20 turns total)
    const TRANSCRIPT_RESERVED = 10; // Reserve 10 turns for transcript examples
    const CHAT_HISTORY_RESERVED = 10; // Reserve 10 turns for chat history
    
    const transcriptMessages = deduplicatedTranscript
      .slice(-TRANSCRIPT_RESERVED)
      .map((m) => ({
        role: (m.sender === personaName ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.message
      }));
    
    const chatHistoryMessages = deduplicatedChatHistory
      .slice(-CHAT_HISTORY_RESERVED)
      .map((m) => ({
        role: (m.sender === personaName ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.message
      }));

    // Combine and deduplicate final context messages
    const allContextMessages = [...transcriptMessages, ...chatHistoryMessages];
    const seenContext = new Set<string>();
    const finalContextMessages: ChatCompletionMessageParam[] = [];
    
    for (const msg of allContextMessages) {
      const key = `${msg.role}:${msg.content}`;
      if (!seenContext.has(key)) {
        seenContext.add(key);
        finalContextMessages.push(msg);
      }
    }

    // Limit total context messages to prevent token overflow
    const limitedContextMessages = finalContextMessages.slice(-MAX_CONTEXT_MESSAGES);

    console.log('Context messages (deduplicated):', limitedContextMessages.length);

    // 2a) Main Conversation Call
    const chatRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
You are now acting as ${personaName}.
Use only the tone, wording, and style from this profile:
• Tone: ${styleProfile.tone}
• Formality: ${styleProfile.formality}
• Pacing: ${styleProfile.pacing}
• Vocabulary: ${styleProfile.vocabulary.join(", ")}
• Quirks: ${styleProfile.quirks.join(", ")}
Reply exactly as ${personaName} would—do not invent new info or break character.
      `.trim()
        },
        // Deduplicated context messages
        ...limitedContextMessages,
        { role: "user", content: userMessage }
      ]
    });
    const twinReply = chatRes.choices?.[0]?.message?.content?.trim() ?? '';

    // 2b) Scoring & Tips Call
    const scoreRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: `
You are an expert conversation coach.
Here is ${personaName}'s style profile:

Tone: ${styleProfile.tone}  
Formality: ${styleProfile.formality}  
Pacing: ${styleProfile.pacing}  
Vocabulary: ${styleProfile.vocabulary.join(", ")}  
Quirks: ${styleProfile.quirks.join(", ")}  
Examples: ${styleProfile.examples.join(" | ")}

Now evaluate the AI's last reply for positivity & style-match (0–100) and give exactly three concise tips for improvement.
Respond *only* with JSON in this form:
{"score": number, "tips": [string, string, string]}
      `.trim()
    },
    { role: "user", content: twinReply }
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

    // Update counter
    ipMessageCounts.set(ip, totalMessagesUsed + 1);

    return NextResponse.json({
      twinReply,
      score,
      tips,
      userMessage: userMsg,
      personaMessage: personaMsg,
      // Include usage information for frontend
      usage: {
        totalMessagesUsed: totalMessagesUsed + 1,
        maxMessagesPerIP: MAX_MESSAGES_PER_IP,
        contextMessagesUsed: limitedContextMessages.length
      }
    });
  } catch (err: unknown) {
    console.error('[chat/route] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
