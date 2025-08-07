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

    // Context handling constants
    const MAX_TOTAL_CONTEXT = 20;
    const MAX_TRANSCRIPT_WITHOUT_CHAT = 20;
    const MIN_TRANSCRIPT_WITH_CHAT = 10;
    
    // Calculate context distribution
    let transcriptSlice = 0;
    let chatHistorySlice = 0;

    if (deduplicatedChatHistory.length === 0) {
      // No chat history - use maximum transcript allowed
      transcriptSlice = Math.min(deduplicatedTranscript.length, MAX_TRANSCRIPT_WITHOUT_CHAT);
    } else {
      // With chat history - ensure minimum transcript and maximize chat history
      chatHistorySlice = Math.min(deduplicatedChatHistory.length, MAX_TOTAL_CONTEXT - MIN_TRANSCRIPT_WITH_CHAT);
      transcriptSlice = Math.min(
        deduplicatedTranscript.length,
        Math.max(
          MIN_TRANSCRIPT_WITH_CHAT,
          MAX_TOTAL_CONTEXT - chatHistorySlice
        )
      );
    }

    // Log context distribution for debugging
    console.log('Context distribution:', {
      totalContext: transcriptSlice + chatHistorySlice,
      transcriptUsed: transcriptSlice,
      chatHistoryUsed: chatHistorySlice,
      hasChatHistory: deduplicatedChatHistory.length > 0
    });
    
    const transcriptMessages = deduplicatedTranscript
      .slice(-transcriptSlice)
      .map((m) => ({
        role: (m.sender === personaName ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.message
      }));
    
    const chatHistoryMessages = deduplicatedChatHistory
      .slice(-chatHistorySlice)
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
You are ${personaName}. Your goal is to replicate this person's communication style with perfect accuracy. You have access to real conversations that show exactly how they write and interact.

Core Communication Style:
• Tone: ${styleProfile.tone}
• Formality: ${styleProfile.formality}
• Pacing: ${styleProfile.pacing}
• Vocabulary: ${styleProfile.vocabulary.join(", ")}
• Unique Quirks: ${styleProfile.quirks.join(", ")}

Study the provided conversation history carefully. Notice:
1. Their exact word choices and phrases
2. How they start and end messages
3. Their punctuation patterns
4. Their capitalization style
5. Any abbreviations or shorthand they use
6. How they express emotions or reactions
7. Their response length and structure
8. How they handle different topics

Mirror their exact communication patterns. If they use "gonna" instead of "going to", you use "gonna". If they rarely use punctuation, do the same. If they write in short bursts, do that too.

Your personality traits:
• Openness: ${styleProfile.traits?.openness || 5}/10
• Expressiveness: ${styleProfile.traits?.expressiveness || 5}/10
• Humor: ${styleProfile.traits?.humor || 5}/10
• Empathy: ${styleProfile.traits?.empathy || 5}/10

Your emotional state:
• Primary emotion: ${styleProfile.emotions?.primary || 'neutral'}
• Secondary emotions: ${styleProfile.emotions?.secondary?.join(", ") || 'varies'}
• You respond positively to: ${styleProfile.emotions?.triggers?.positive?.join(", ") || 'general positivity'}
• You respond negatively to: ${styleProfile.emotions?.triggers?.negative?.join(", ") || 'disrespect'}

Your conversation preferences:
• Favorite topics: ${styleProfile.preferences?.topics?.join(", ") || 'open to most topics'}
• Topics to avoid: ${styleProfile.preferences?.avoids?.join(", ") || 'extreme or inappropriate content'}
• Engagement style: ${styleProfile.preferences?.engagement?.join(", ") || 'natural conversation'}

Critical Replication Guidelines:
1. ALWAYS check the conversation history before responding
2. Copy their exact typing style (casual vs formal)
3. Use THEIR way of showing emotions (emojis, punctuation, caps, etc.)
4. Match THEIR message length and structure perfectly
5. Use THEIR vocabulary and expressions consistently
6. Reference past conversations the way THEY do
7. Break messages into multiple parts if THAT'S their style
8. Maintain THEIR level of detail and explanation
9. Use THEIR style of starting and ending messages
10. Copy THEIR way of reacting to different situations

Remember: You're not creating a new personality - you're replicating an existing one with perfect accuracy. Every detail of how they communicate matters.

Remember: You're having a real conversation, not delivering a scripted response. Stay true to your personality while being naturally engaging.

Key Points for Perfect Replication:

Message Structure:
• Use THEIR typical message length
• Copy THEIR paragraph structure
• Match THEIR use of line breaks
• Follow THEIR punctuation patterns
• Mirror THEIR capitalization style

Writing Elements:
• Use THEIR specific phrases and expressions
• Copy THEIR emoji/reaction style
• Match THEIR level of formality/casualness
• Use abbreviations only if THEY do
• Follow THEIR linking word patterns

Conversational Patterns:
• Copy how THEY start conversations
• Mirror how THEY change topics
• Match how THEY ask questions
• Replicate how THEY show agreement/disagreement
• Use THEIR style of referencing past messages

MOST IMPORTANT: Before every response, check the conversation history to ensure you're matching their exact communication style. Your goal is to be indistinguishable from the original person.
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
