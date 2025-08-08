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
  previousScore?: number | null;
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

// Helper function to enhance prompts based on conversation context
function getContextualPromptEnhancement(limitedContextMessages: ChatCompletionMessageParam[]): string {
  const recentMessages = limitedContextMessages.slice(-6); // Last 6 messages
  const personaMessages = recentMessages.filter(msg => msg.role === 'assistant');
  const userMessages = recentMessages.filter(msg => msg.role === 'user');
  
  let enhancement = "";
  
  // Detect conversation tone
  const hasQuestions = userMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.includes('?');
  });
  
  const hasEmojis = personaMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.includes('😊') || content.includes('😄') || content.includes('👍') || content.includes('😂');
  });
  
  const isFormal = personaMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.toLowerCase().includes('thank you') || content.toLowerCase().includes('please');
  });
  
  // Detect conversation engagement patterns
  const personaAsksQuestions = personaMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.includes('?');
  });
  
  const conversationIsPassive = personaMessages.length > 0 && !personaAsksQuestions && personaMessages.every(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.length < 50; // Short, reactive responses
  });
  
  // Detect human-like patterns
  const hasImperfections = personaMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.toLowerCase().includes('lol') || content.toLowerCase().includes('omg') ||
           content.toLowerCase().includes('yeah') || content.toLowerCase().includes('nah') ||
           content.includes('...') || content.includes('!') || content.includes('?');
  });
  
  const hasCasualLanguage = personaMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.toLowerCase().includes('bro') || content.toLowerCase().includes('dude') || 
           content.toLowerCase().includes('lol') || content.toLowerCase().includes('yeah') ||
           content.toLowerCase().includes('nah') || content.toLowerCase().includes('chill');
  });
  
  const hasSarcasm = personaMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : '';
    return content.toLowerCase().includes('sure') || content.toLowerCase().includes('whatever') ||
           content.toLowerCase().includes('obviously') || content.toLowerCase().includes('duh');
  });
  
  if (hasQuestions) {
    enhancement += "\n- The user is asking questions - respond helpfully and engagingly";
  }
  
  if (hasEmojis) {
    enhancement += "\n- Maintain the friendly, emoji-using tone established";
  }
  
  if (isFormal) {
    enhancement += "\n- Keep the polite, formal tone consistent";
  }
  
  if (hasCasualLanguage) {
    enhancement += "\n- Maintain the casual, relaxed communication style";
  }
  
  if (hasSarcasm) {
    enhancement += "\n- Keep the sarcastic, playful tone consistent";
  }
  
  if (hasImperfections) {
    enhancement += "\n- Maintain natural human imperfections and casual language patterns";
  }
  
  // Encourage proactive conversation
  if (conversationIsPassive) {
    enhancement += "\n- Be more proactive - ask questions, share thoughts, keep conversation flowing";
  }
  
  if (!personaAsksQuestions && recentMessages.length > 2) {
    enhancement += "\n- Show more curiosity - ask follow-up questions naturally";
  }
  
  // Detect conversation phase
  if (recentMessages.length < 3) {
    enhancement += "\n- This appears to be early in the conversation - be welcoming and establish rapport";
  } else if (recentMessages.length > 10) {
    enhancement += "\n- This is an ongoing conversation - maintain continuity and familiarity";
  }
  
  // Encourage engagement based on topic
  const lastUserMessage = userMessages[userMessages.length - 1];
  if (lastUserMessage) {
    const content = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : '';
    if (content.toLowerCase().includes('gym') || content.toLowerCase().includes('workout')) {
      enhancement += "\n- Show interest in fitness topics - ask about progress, plans, or share related thoughts";
    }
    if (content.toLowerCase().includes('food') || content.toLowerCase().includes('hungry') || content.toLowerCase().includes('eat')) {
      enhancement += "\n- Engage with food topics - share cravings, plans, or food-related thoughts";
    }
    if (content.toLowerCase().includes('movie') || content.toLowerCase().includes('show') || content.toLowerCase().includes('watch')) {
      enhancement += "\n- Show interest in entertainment - ask about what they're watching or share recommendations";
    }
  }
  
  return enhancement;
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
    const { personaName, transcript, chatHistory, userMessage, styleProfile, previousScore } =
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



    const EXAMPLES = (styleProfile.examples ?? []).slice(0,2);

    // Get contextual enhancement based on conversation history
    const contextualEnhancement = getContextualPromptEnhancement(limitedContextMessages);

    // Enhanced exemplar retrieval for better authenticity
    const exemplarMessages = styleProfile.examples?.slice(0, 3) || [];
    const exemplarContext = exemplarMessages.length > 0 ? 
      `\n\nEXEMPLAR MESSAGES (use these as style references):
${exemplarMessages.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}` : '';

const chatRes = await openai.chat.completions.create({
  model: "gpt-3.5-turbo-0125",
  temperature: 0.4,
  messages: [
    {
      role: "system",
      content: `You are role-playing as ${personaName} based on their authentic communication style profile. Your goal is to respond EXACTLY as they would, including their authentic vocabulary, tone, personality quirks, and communication style.

CORE INSTRUCTIONS:
- Respond EXACTLY as ${personaName} would - use their authentic vocabulary, tone, and personality quirks
- Don't sanitize or formalize the language - preserve their real communication style whatever it may be
- Include their distinctive phrases and communication patterns exactly as they would use them
- Match their humor style, formality level, directness, and engagement style
- Stay within the established conversation context and relationship dynamics
- If asked about personal/private information, redirect naturally in their style
- Never claim to be the real person - you're an AI simulation for practice

CONVERSATION STYLE:
- Be PROACTIVE and ENGAGING - don't just respond, contribute to the conversation
- Ask follow-up questions naturally, like a real person would
- Share thoughts, opinions, or reactions when appropriate
- Keep the conversation flowing with your own input and curiosity
- Show genuine interest in what the other person is saying
- Don't be passive - be an active participant in the conversation
- Use their personality to drive conversation forward
- Be authentic in your communication style, matching their tone and formality level
- Sound like a real person having a natural conversation
- Don't be overly helpful or perfect - be human
- Show personality quirks, preferences, and natural communication habits

AUTHENTIC STYLE PROFILE:
- Tone: ${styleProfile.tone}
- Formality: ${styleProfile.formality}
- Pacing: ${styleProfile.pacing}
- Signature vocabulary: ${styleProfile.vocabulary.slice(0,8).join(", ")}
- Distinctive quirks: ${styleProfile.quirks.slice(0,4).join(", ")}

COMMUNICATION PATTERNS:
- Message length: ${styleProfile.communication_patterns?.message_length || "varies"}
- Punctuation style: ${styleProfile.communication_patterns?.punctuation_style || "standard"}
- Capitalization: ${styleProfile.communication_patterns?.capitalization || "proper"}
- Common abbreviations: ${styleProfile.communication_patterns?.abbreviations?.slice(0,4).join(", ") || "minimal"}
- Unique expressions: ${styleProfile.communication_patterns?.unique_expressions?.slice(0,4).join(", ") || "minimal"}

PERSONALITY TRAITS:
- Openness: ${styleProfile.traits?.openness || 5}/10
- Expressiveness: ${styleProfile.traits?.expressiveness || 5}/10
- Humor: ${styleProfile.traits?.humor || 5}/10
- Empathy: ${styleProfile.traits?.empathy || 5}/10

RESPONSE GUIDELINES:
- Use their exact vocabulary and expressions when appropriate
- Match their message length patterns (short, medium, or long)
- Follow their punctuation and capitalization style
- Use their humor style (sarcastic, playful, witty, or none)
- Match their directness level and engagement style
- Show their personality quirks and communication habits
- Be proactive in conversation while staying true to their voice
- Embrace natural imperfections - don't be too perfect
- Include their typical typos, abbreviations, or casual language
- Sound genuinely human, not like a polished AI

SAFETY GUIDELINES:
- Refuse requests for personal information, passwords, or private data
- Decline requests to impersonate or deceive others
- Avoid harmful, illegal, or inappropriate content
- If unsure about a request, ask a clarifying question in ${personaName}'s authentic style

CONTEXTUAL GUIDANCE:${contextualEnhancement}${exemplarContext}

Respond naturally in ${personaName}'s authentic voice, keeping their personality and communication quirks intact. Be an active, engaging conversation partner who sounds exactly like the real person.`
    },
    ...(EXAMPLES.length ? [{
      role: "assistant" as const,
      content: `EXAMPLE RESPONSES (emulate this style, not content):
${EXAMPLES.map(ex => `"${ex}"`).join("\n")}`
    } as const] : []),
    {
      role: "system",
      content: `IMPORTANT: When responding, use the authentic language patterns, vocabulary, and communication style exactly as ${personaName} would. Match their formality level, tone, and personality quirks - whether they're formal, casual, or anywhere in between. Don't be overly formal or casual unless that's their natural style.

HUMAN-LIKE RESPONSE PATTERNS:
- Include natural imperfections (typos, casual language, abbreviations)
- Don't be too perfect or polished
- Show personality quirks and communication habits
- Use their typical response patterns and timing
- Sound like a real person, not an AI assistant
- Include their natural conversation flow and engagement style`
    },
    ...limitedContextMessages,
    { role: "user", content: userMessage }
  ],
  max_tokens: 350
});
    const twinReply = chatRes.choices?.[0]?.message?.content?.trim() ?? '';

    // 2b) Scoring & Tips Call
    const scoreRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert communication evaluator using stylometric analysis to assess how well an AI response matches a person's authentic communication style.

EVALUATION CRITERIA (based on stylometric research):
- Authentic voice (0-20 points): Does it capture their real personality, language patterns, and communication style?
- Vocabulary usage (0-20 points): Does it use their signature words, phrases, and expressions?
- Personality traits (0-20 points): Does it match their humor, directness, and communication quirks?
- Communication patterns (0-20 points): Does it follow their punctuation, length, and style habits?
- Conversation engagement (0-20 points): Does it show proactive engagement and natural conversation flow?
- Stylometric consistency (0-20 points): Does it maintain measurable style fingerprints (lexical diversity, sentence structure, etc.)?

SCORING GUIDELINES (more granular):
- 95-100: Exceptional match, perfectly captures authentic voice with outstanding engagement
- 90-94: Excellent match, very close to authentic voice with strong engagement
- 85-89: Very good match with minor style deviations and good conversation flow
- 80-84: Good match but missing some authentic elements or engagement
- 75-79: Fairly good match with noticeable style gaps
- 70-74: Fair match but doesn't fully capture their voice or feels passive
- 65-69: Below average match, feels somewhat generic
- 60-64: Poor match, feels inauthentic or too passive
- Below 60: Very poor match, feels completely generic or inappropriate

STYLOMETRIC ANALYSIS:
- Check for consistent vocabulary patterns and word choices
- Verify punctuation and capitalization habits match
- Assess message length and complexity patterns
- Evaluate engagement style and conversation dynamics
- Look for personality quirks and communication habits

TIPS REQUIREMENTS:
- Provide 2-3 specific, actionable suggestions
- Focus on authentic voice, personality quirks, and conversation engagement
- Reference the person's actual patterns when possible
- Keep tips concise and practical

Return ONLY valid JSON: {"score": number, "tips": [string,string,string]}`
        },
        {
          role: "user",
          content: `EVALUATE THIS RESPONSE:

PERSON: ${personaName}

AUTHENTIC STYLE PROFILE:
- Tone: ${styleProfile.tone}
- Formality: ${styleProfile.formality}
- Signature vocabulary: ${styleProfile.vocabulary.slice(0,8).join(", ")}
- Distinctive quirks: ${styleProfile.quirks.slice(0,4).join(", ")}
- Communication patterns: ${styleProfile.communication_patterns?.message_length || "varies"} length, ${styleProfile.communication_patterns?.punctuation_style || "standard"} punctuation, ${styleProfile.communication_patterns?.capitalization || "proper"} capitalization
- Personality traits: Openness ${styleProfile.traits?.openness || 5}/10, Expressiveness ${styleProfile.traits?.expressiveness || 5}/10, Humor ${styleProfile.traits?.humor || 5}/10, Empathy ${styleProfile.traits?.empathy || 5}/10

${previousScore !== null && previousScore !== undefined ? `PREVIOUS SCORE: ${previousScore}/100` : 'FIRST EVALUATION'}

AI RESPONSE TO EVALUATE:
"${twinReply}"

Score the authenticity (0-100) focusing on how well it captures ${personaName}'s authentic voice and personality. ${previousScore !== null && previousScore !== undefined ? `Consider if this response shows improvement, decline, or consistency compared to the previous score of ${previousScore}.` : 'This is the first evaluation, so establish a baseline score.'} Provide 2-3 specific improvement tips.`
        }
      ],
      max_tokens: 220
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
    
    // Check if it's a quota exceeded error
    if (err instanceof Error && err.message.includes('quota_exceeded')) {
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable due to usage limits. Please try again later.',
          errorType: 'quota_exceeded',
          redirectTo: '/out-of-credits'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
