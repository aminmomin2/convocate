// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Msg, StyleProfile } from "@/types/persona";

interface ChatRequestBody {
  personaName: string;
  transcript: Msg[];
  chatHistory: Msg[];
  userMessage: string;
  styleProfile: StyleProfile;
  previousScore?: number | null;
}

const MAX_MESSAGES_PER_IP = 40;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_MESSAGES = 20;

// Models & generation knobs
const MODEL_CHAT = "gpt-5-mini";   // generation
const MODEL_SCORE = "gpt-5-nano";   // using mini for scoring too (nano might not exist yet)
const CHAT_TEMP = 1;                // GPT-5 models only support temperature = 1
const SCORE_TEMP = 1;               // GPT-5 models only support temperature = 1

// Rough prompt-size guardrails
const MAX_TRANSCRIPT_WITHOUT_CHAT = 20;
const MIN_TRANSCRIPT_WITH_CHAT = 10;

const ipMessageCounts = new Map<string, number>();

// Clean up old IP entries every hour to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_IP_ENTRIES = 10000; // Prevent runaway growth

setInterval(() => {
  if (ipMessageCounts.size > MAX_IP_ENTRIES) {
    // Keep only the most recent entries
    const entries = Array.from(ipMessageCounts.entries());
    ipMessageCounts.clear();
    entries.slice(-MAX_IP_ENTRIES / 2).forEach(([ip, count]) => {
      ipMessageCounts.set(ip, count);
    });
    // Cleanup completed
  }
}, CLEANUP_INTERVAL);

/* ------------------------ Helpers ------------------------ */
function createMessageKey(message: Msg): string {
  return `${message.sender}:${message.message}`;
}

function deduplicateMessages(messages: Msg[]): Msg[] {
  const seen = new Set<string>();
  return messages.filter((msg) => {
    const key = createMessageKey(msg);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getContextualPromptEnhancement(limitedContextMessages: ChatCompletionMessageParam[]): string {
  const recent = limitedContextMessages.slice(-6);
  const persona = recent.filter((m) => m.role === "assistant");
  const user = recent.filter((m) => m.role === "user");
  let enhancement = "";

  // Conversation energy and rhythm analysis
  const conversationEnergy = user.length > 0 ? user[user.length - 1] : null;
  if (conversationEnergy && typeof conversationEnergy.content === "string") {
    const lastMsg = conversationEnergy.content;
    
    // Energy level matching
    if (lastMsg.includes("!") || /[😂😭💀]/.test(lastMsg)) enhancement += " Match their energy.";
    if (lastMsg.length < 20) enhancement += " Keep it brief.";
    if (lastMsg.length > 100) enhancement += " Give a thoughtful response.";
    
    // Emotional context
    if (/\b(excited|amazing|awesome|love)\b/i.test(lastMsg)) enhancement += " Share their excitement.";
    if (/\b(tired|stressed|busy|ugh)\b/i.test(lastMsg)) enhancement += " Be supportive.";
    if (/\b(bored|nothing|idk)\b/i.test(lastMsg)) enhancement += " Suggest something or relate.";
  }

  // Conversation patterns
  const uHasQ = user.some((m) => (typeof m.content === "string" ? m.content.includes("?") : false));
  const recentPersona = persona.slice(-2); // Last 2 responses
  
  if (uHasQ) enhancement += " Answer directly.";
  if (recentPersona.length > 1) {
    const wasLongResponse = recentPersona.some(m => typeof m.content === "string" && m.content.length > 80);
    if (wasLongResponse) enhancement += " Vary response length.";
  }

  // Relationship dynamics
  if (recent.length < 3) enhancement += " Build connection.";
  else if (recent.length > 8) enhancement += " Continue the natural flow.";

  // Topic-specific authenticity
  const lastUser = user[user.length - 1];
  if (lastUser && typeof lastUser.content === "string") {
    const c = lastUser.content.toLowerCase();
    if (/(work|job|boss)/.test(c)) enhancement += " Relate to work stuff.";
    if (/(weekend|plans|tonight)/.test(c)) enhancement += " Talk about plans.";
    if (/(family|mom|dad)/.test(c)) enhancement += " Be understanding about family.";
  }
  
  return enhancement;
}

function toChatRole(sender: string, personaName: string): "assistant" | "user" {
  return sender === personaName ? "assistant" : "user";
}

/** Schema for the nano scorer */
const SCORE_SCHEMA = {
  name: "style_score",
  schema: {
    type: "object",
    required: ["score", "tips"],
    additionalProperties: false,
    properties: {
      score: { type: "number", minimum: 0, maximum: 100 },
      tips: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: { type: "string", maxLength: 140 },
      },
    },
  },
} as const;

/** responses.create available? (SDKs differ) */
function hasResponses(client: unknown): client is typeof openai & { responses: { create: (...args: unknown[]) => Promise<unknown> } } {
  return !!(client as { responses?: { create?: unknown } })?.responses?.create;
}

/* ------------------------ Route ------------------------ */
export async function POST(req: Request) {
  const xff = req.headers.get("x-forwarded-for") || "unknown";
  const ip = xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

  // IP message quota
  const totalMessagesUsed = ipMessageCounts.get(ip) || 0;
  if (totalMessagesUsed >= MAX_MESSAGES_PER_IP) {
    return NextResponse.json(
      {
        error: `You've reached the maximum number of messages per IP (${MAX_MESSAGES_PER_IP} messages). This limit is permanent and cannot be reset.`,
      },
      { status: 429 }
    );
  }

  try {
    const { personaName, transcript, chatHistory, userMessage, styleProfile, previousScore } =
      (await req.json()) as ChatRequestBody;

    // Basic validation
    if (
      !personaName ||
      !Array.isArray(transcript) ||
      !Array.isArray(chatHistory) ||
      typeof userMessage !== "string" ||
      !styleProfile ||
      typeof styleProfile !== "object"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Dedup input sources
    const dTranscript = deduplicateMessages(transcript);
    const dHistory = deduplicateMessages(chatHistory);

    // Context sizing
    let transcriptSlice = 0;
    let chatHistorySlice = 0;
    if (dHistory.length === 0) {
      transcriptSlice = Math.min(dTranscript.length, MAX_TRANSCRIPT_WITHOUT_CHAT);
    } else {
      chatHistorySlice = Math.min(dHistory.length, MAX_CONTEXT_MESSAGES - MIN_TRANSCRIPT_WITH_CHAT);
      transcriptSlice = Math.min(dTranscript.length, Math.max(MIN_TRANSCRIPT_WITH_CHAT, MAX_CONTEXT_MESSAGES - chatHistorySlice));
    }

    const transcriptMessages: ChatCompletionMessageParam[] = dTranscript
      .slice(-transcriptSlice)
      .map((m) => ({ role: toChatRole(m.sender, personaName), content: m.message }));

    const chatHistoryMessages: ChatCompletionMessageParam[] = dHistory
      .slice(-chatHistorySlice)
      .map((m) => ({ role: toChatRole(m.sender, personaName), content: m.message }));

    // Merge + dedupe final context
    const seen = new Set<string>();
    const finalContextMessages: ChatCompletionMessageParam[] = [];
    for (const msg of [...transcriptMessages, ...chatHistoryMessages]) {
      const key = `${msg.role}:${msg.content}`;
      if (!seen.has(key)) {
        seen.add(key);
        finalContextMessages.push(msg);
      }
    }
    const limitedContextMessages = finalContextMessages.slice(-MAX_CONTEXT_MESSAGES);

    // Style exemplars / enhancement
    const EXAMPLES = (styleProfile.examples ?? []).slice(0, 2);
    const contextualEnhancement = getContextualPromptEnhancement(limitedContextMessages);

    // ---------- 1) GENERATION (gpt-5-mini) ----------
    // Advanced authenticity prompting with behavioral modeling
    const getBehavioralProfile = (styleProfile: StyleProfile) => {
      const traits = styleProfile.traits || {};
      const patterns = styleProfile.communication_patterns || {};
      
      let behavioral = "";
      
      // Response style based on personality
      if ((traits.openness ?? 5) > 7) behavioral += "Share personal thoughts openly. ";
      if ((traits.expressiveness ?? 5) > 7) behavioral += "Use expressive language and reactions. ";
      if ((traits.humor ?? 5) > 6) behavioral += "Make jokes or witty comments when natural. ";
      if ((traits.enthusiasm ?? 5) < 4) behavioral += "Stay measured and understated. ";
      if ((traits.directness ?? 5) > 7) behavioral += "Be direct and to-the-point. ";
      if ((traits.directness ?? 5) < 4) behavioral += "Be diplomatic and indirect. ";
      
      // Message structure preferences
      if (patterns.message_length === "short") behavioral += "Keep responses brief and punchy. ";
      if (patterns.message_length === "long") behavioral += "Give detailed, thoughtful responses. ";
      
      return behavioral.trim();
    };

    // Get formality-aware instructions
    const getFormalityInstructions = (context?: string) => {
      switch (context) {
        case "formal":
          return "This person communicates formally (emails, professional messages). Use proper structure, professional courtesy, and appropriate business etiquette. Responses should be well-structured and complete.";
        case "mixed":
          return "This person switches between formal and casual styles depending on context. Match the user's current formality level - be professional when they're professional, casual when they're casual.";
        default:
          return "This person communicates casually (texts, chats). Use natural, conversational language and keep responses authentic to casual communication.";
      }
    };

    const optimizedChatSystem = `You are ${personaName}. Embody their authentic communication personality:

COMMUNICATION CONTEXT:
${getFormalityInstructions(styleProfile.formality_context)}

STYLE PROFILE:
- Tone: ${styleProfile.tone}
- Formality preference: ${styleProfile.formality} 
- Typical vocab: ${(styleProfile.vocabulary ?? []).slice(0, 5).join(", ") || "natural"}
- Signature quirks: ${(styleProfile.quirks ?? []).slice(0, 3).join(", ") || "none"}

BEHAVIORAL PROFILE:
${getBehavioralProfile(styleProfile)}

RESPONSE GUIDELINES:
- Match their typical message length and rhythm
- ${styleProfile.communication_patterns?.punctuation_style === "emojis" ? "Use emojis naturally" : "Use punctuation like they do"}
- ${styleProfile.communication_patterns?.capitalization === "casual" ? "Use casual capitalization" : "Follow their caps style"}
- ${styleProfile.formality_context === "formal" ? "Include appropriate greetings/closings when natural" : "Keep responses conversational"}

${EXAMPLES.length > 0 ? `AUTHENTIC EXAMPLES:\n${EXAMPLES.slice(0, 2).map((ex) => `"${ex}"`).join("\n")}\n` : ""}CRITICAL: Don't just copy their style—BE them. Think like they think, react like they react.${contextualEnhancement}`;

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: optimizedChatSystem },
      ...limitedContextMessages,
      { role: "user", content: userMessage },
    ];

    // Prefer Responses API; fallback to Chat Completions
    let twinReply = "";
    try {
      if (hasResponses(openai)) {
        const res = await openai.responses.create({
          model: MODEL_CHAT,
          temperature: CHAT_TEMP,

          input: chatMessages,
        });
        // Try to read unified output_text first; fallback to content
        twinReply =
          (res as { output_text?: string }).output_text ??
          ((res as { output?: Array<{ content?: Array<{ text?: string }> }> }).output?.[0]?.content?.[0]?.text as string | undefined) ??
          "";
      } else {
        const res = await openai.chat.completions.create({
          model: MODEL_CHAT,
          temperature: CHAT_TEMP,

          messages: chatMessages,
        });
        twinReply = res.choices?.[0]?.message?.content?.trim() ?? "";
      }
    } catch (e) {
      console.error("[chat] generation error:", e);
      // For MVP: Return error instead of empty response
      return NextResponse.json(
        { error: "Unable to generate response. Please try again." },
        { status: 500 }
      );
    }

    // ---------- 2) SCORING (gpt-5-nano) ----------
    const scoringSystem = "Score how well this AI response matches the person's authentic messaging style. Return JSON only.";
    
    const scoringUser = `Score ${personaName}'s style match (0-100):

STYLE: ${styleProfile.tone}, ${styleProfile.formality}
VOCAB: ${(styleProfile.vocabulary ?? []).slice(0, 5).join(", ") || "natural"}
QUIRKS: ${(styleProfile.quirks ?? []).slice(0, 3).join(", ") || "none"}
${previousScore != null ? `PREVIOUS: ${previousScore}` : "FIRST EVAL"}

RESPONSE: "${twinReply}"

Rate: voice authenticity, vocabulary match, quirks/patterns, engagement. Give 2-3 tips (≤140 chars each).`;

    let score = 0;
    let tips: string[] = [];

    try {
      if (hasResponses(openai)) {
        const res = await openai.responses.create({
          model: MODEL_SCORE,
          temperature: SCORE_TEMP,

          input: [
            { role: "system", content: scoringSystem },
            { role: "user", content: scoringUser },
          ],
          text: {
            format: {
              type: "json_schema",
              name: SCORE_SCHEMA.name,
              schema: SCORE_SCHEMA.schema,
              strict: true,
            },
          },
        });
        
        const text =
          (res as { output_text?: string }).output_text ??
          ((res as { output?: Array<{ content?: Array<{ text?: string }> }> }).output?.[0]?.content?.[0]?.text as string | undefined) ??
          "{}";
        
        if (!text || text.trim() === "" || text === "{}") {
          score = 5; // Default score
          tips = ["Continue the conversation naturally"];
        } else {
          try {
            const parsed = JSON.parse(text);
            if (typeof parsed.score === "number") score = parsed.score;
            if (Array.isArray(parsed.tips)) tips = parsed.tips;
          } catch {
            // JSON parsing failed - use defaults
            score = 5; // Default score
            tips = ["Continue the conversation naturally"];
          }
        }
      } else {
        // Fallback to chat.completions w/ schema
        const res = await openai.chat.completions.create({
          model: MODEL_SCORE,
          temperature: SCORE_TEMP,

          response_format: {
            type: "json_schema",
            json_schema: { name: SCORE_SCHEMA.name, schema: SCORE_SCHEMA.schema, strict: true },
          } as const,
          messages: [
            { role: "system", content: scoringSystem },
            { role: "user", content: scoringUser },
          ],
        });
        const txt = res.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(txt);
        if (typeof parsed.score === "number") score = parsed.score;
        if (Array.isArray(parsed.tips)) tips = parsed.tips;
      }
    } catch {
      // Scoring failed - use defaults
      score = 5;
      tips = ["Continue the conversation naturally"];
    }

    // Response objects for client
    const nowIso = new Date().toISOString();
    const userMsg: Msg = { sender: "user", message: userMessage, timestamp: nowIso };
    const personaMsg: Msg = { sender: personaName, message: twinReply, timestamp: nowIso };

    ipMessageCounts.set(ip, totalMessagesUsed + 1);

    return NextResponse.json({
      twinReply,
      score,
      tips,
      userMessage: userMsg,
      personaMessage: personaMsg,
      usage: {
        totalMessagesUsed: totalMessagesUsed + 1,
        maxMessagesPerIP: MAX_MESSAGES_PER_IP,
        contextMessagesUsed: limitedContextMessages.length,
      },
    });
  } catch (err: unknown) {
    // Check for OpenAI quota/billing errors in multiple formats
    const isQuotaError = (error: unknown): boolean => {
      if (!(error instanceof Error)) return false;
      
      const message = error.message.toLowerCase();
      const quotaKeywords = [
        "quota_exceeded", 
        "insufficient_quota",
        "rate_limit_exceeded",
        "billing_hard_limit_reached",
        "monthly_limit_exceeded",
        "usage_limit_reached",
        "credit_limit_exceeded"
      ];
      
      return quotaKeywords.some(keyword => message.includes(keyword));
    };

    if (isQuotaError(err)) {
      return NextResponse.json(
        {
          error: "Service temporarily unavailable due to usage limits. Please try again later.",
          errorType: "quota_exceeded",
          redirectTo: "/out-of-credits",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
