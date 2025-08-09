// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { parseStringPromise } from "xml2js";
import { openai } from "@/lib/openai";
import type { Msg, StoredPersona, StyleProfile } from "@/types/persona";

/**
 * Optimization knobs
 */
const MODEL = "gpt-5-mini"; // 👈 target ChatGPT-5 mini
const TEMPERATURE = 1; // GPT-5 mini only supports default temperature of 1

const MAX_PERSONAS_PER_IP = 2;
const MAX_STYLE_SAMPLE_LINES = 75; // legacy soft cap (still used as a guard)
const MAX_FILE_SIZE_MB = 1; // 1MB file size limit
const STYLE_CHARS_BUDGET = 8000; // ~2k tokens rough budget (keeps costs stable)
const LIMIT_CONCURRENCY = 2;

// In-memory throttle tracking
const ipUsage = new Map<string, number>();
// Server-side persona storage to prevent deletion workaround
const ipPersonas = new Map<string, StoredPersona[]>();

// Clean up old persona data to prevent memory leaks
const PERSONA_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_PERSONA_IPS = 5000; // Prevent runaway growth

setInterval(() => {
  if (ipPersonas.size > MAX_PERSONA_IPS) {
    // Keep only the most recent entries
    const entries = Array.from(ipPersonas.entries());
    ipPersonas.clear();
    entries.slice(-MAX_PERSONA_IPS / 2).forEach(([ip, personas]) => {
      ipPersonas.set(ip, personas);
    });
    // Cleanup completed
  }
}, PERSONA_CLEANUP_INTERVAL);

/** ---------- Small semaphore for safe parallelization ---------- */
function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const runNext = () => {
    if (active >= max) return;
    const next = queue.shift();
    if (!next) return;
    active++;
    next();
  };
  return async <T>(fn: () => Promise<T>) => {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          active--;
          runNext();
        }
      });
      runNext();
    });
  };
}
const limit = createLimiter(LIMIT_CONCURRENCY);

/** ---------- IP helpers ---------- */
function getClientIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  const realIP = request.headers.get("x-real-ip") || "";
  const cfConnectingIP = request.headers.get("cf-connecting-ip") || "";
  const ip = xff?.split(",")[0]?.trim() || realIP || cfConnectingIP || "unknown";
  if (ip !== "unknown") return ip;

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/client_id=([^;]+)/);
  return match ? match[1] : `unknown_${Date.now()}`;
}

/** ---------- Data utils ---------- */
function groupBySender(msgs: Msg[]): Record<string, Msg[]> {
  return msgs.reduce((acc, m) => {
    (acc[m.sender] ||= []).push(m);
    return acc;
  }, {} as Record<string, Msg[]>);
}

function selectTopSenders(buckets: Record<string, Msg[]>): Record<string, Msg[]> {
  const senderCounts = Object.entries(buckets).map(([sender, messages]) => ({
    sender,
    count: messages.length,
    messages,
  }));
  senderCounts.sort((a, b) => b.count - a.count);
  const top = senderCounts.slice(0, MAX_PERSONAS_PER_IP);
  const out: Record<string, Msg[]> = {};
  for (const { sender, messages } of top) out[sender] = messages;
  return out;
}

/** ---------- Parsing multiple input formats ---------- */
async function parseFiles(files: File[]): Promise<Msg[]> {
  const all: Msg[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }
    const txt = await file.text();
    const name = file.name.toLowerCase();

    if (!name.endsWith(".csv") && !name.endsWith(".json") && !name.endsWith(".txt") && !name.endsWith(".xml")) {
      throw new Error(
        `Unsupported file type: ${file.name}. Only .csv, .json, .txt, and .xml files are accepted.`
      );
    }

    if (name.endsWith(".txt")) {
      // WhatsApp export: [MM/DD/YY, HH:MM] Sender: Message
      txt.split("\n").forEach((line) => {
        const m = line.match(/^\[(.+?)\]\s(.+?):\s(.+)$/);
        if (m) {
          const [, ts, sender, message] = m;
          const timestamp = isNaN(Date.parse(ts)) ? new Date().toISOString() : new Date(ts).toISOString();
          all.push({ sender, message, timestamp });
        }
      });
    } else if (name.endsWith(".csv")) {
      const parsed = Papa.parse<{ sender: string; message: string; timestamp?: string }>(txt, {
        header: true,
        skipEmptyLines: true,
      });
      parsed.data.forEach((r) => {
        if (r.sender && r.message) {
          const timestamp = r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString();
          all.push({ sender: r.sender, message: r.message, timestamp });
        }
      });
    } else if (name.endsWith(".json")) {
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) {
        arr.forEach((item: { sender: string; message: string; timestamp?: string }) => {
          if (item.sender && item.message) {
            const timestamp = item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString();
            all.push({ sender: item.sender, message: item.message, timestamp });
          }
        });
      }
    } else if (name.endsWith(".xml")) {
      const xml = await parseStringPromise(txt);
      const smses = xml?.smses?.sms || [];
      smses.forEach((sms: { $: { address: string; body: string; date?: string } }) => {
        const { address, body, date } = sms.$;
        if (address && body) {
          const timestamp = date ? new Date(+date).toISOString() : new Date().toISOString();
          all.push({ sender: address, message: body, timestamp });
        }
      });
    }
  }

  return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/** ---------- Sampling (token-aware-ish, preserves chronology) ---------- */
function calculateMessageQuality(msg: Msg): number {
  let score = 0;
  const length = msg.message.length;
  if (length > 10 && length < 200) score += 3;
  else if (length >= 200) score += 2;
  else score += 1;
  if (msg.message.includes("?")) score += 2;
  if (msg.message.includes("!")) score += 1;
  if (msg.message.includes("...")) score += 1;

  const words = msg.message.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const diversity = words.length ? uniqueWords.size / words.length : 0;
  score += diversity * 3;

  const lower = msg.message.toLowerCase();
  if (lower.includes("lol") || lower.includes("omg")) score += 1;
  if (/[😊😂😭]/.test(msg.message)) score += 1;

  return score;
}

function sampleByContext(messages: Msg[], count: number): Msg[] {
  const buckets: Record<string, Msg[]> = {
    question: [],
    statement: [],
    reaction: [],
    planning: [],
    casual: [],
  };
  for (const msg of messages) {
    const t = msg.message.toLowerCase();
    if (msg.message.includes("?")) buckets.question.push(msg);
    else if (msg.message.length > 20) buckets.statement.push(msg);
    if (/[!😊😂]/.test(msg.message)) buckets.reaction.push(msg);
    if (t.includes("when") || t.includes("where") || t.includes("what time")) buckets.planning.push(msg);
    if (t.includes("lol") || t.includes("yeah") || t.includes("nah") || t.includes("bro") || t.includes("dude"))
      buckets.casual.push(msg);
  }
  const per = Math.max(1, Math.ceil(count / 5));
  return [
    ...buckets.question.slice(0, per),
    ...buckets.statement.slice(0, per),
    ...buckets.reaction.slice(0, per),
    ...buckets.planning.slice(0, per),
    ...buckets.casual.slice(0, per),
  ].slice(0, count);
}

function sampleByBehavior(messages: Msg[], count: number): Msg[] {
  const tests: Array<(m: Msg) => boolean> = [
    (m) => m.message.includes("?") || /(?:\b|^)let's\b|\bwe should\b/i.test(m.message), // proactive
    (m) => m.message.length < 20 && !m.message.includes("?"), // reactive
    (m) => /[!😊😂😭]/.test(m.message), // emotional
    (m) => m.message.length > 50 && /\./.test(m.message) && !m.message.includes("!"), // analytical
    (m) => /\b(bro|dude|lol)\b/i.test(m.message), // casual
  ];
  const per = Math.max(1, Math.ceil(count / tests.length));
  const out: Msg[] = [];
  for (const test of tests) {
    out.push(...messages.filter(test).slice(0, per));
  }
  return out.slice(0, count);
}

function advancedMessageSampling(messages: Msg[], maxSampleSize: number): Msg[] {
  if (messages.length <= maxSampleSize) return messages.slice().sort(byTime);
  const scored = messages
    .map((m) => ({ m, s: calculateMessageQuality(m) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);

  const pick: Msg[] = [];
  const wantHQ = Math.floor(maxSampleSize * 0.4);
  pick.push(...scored.slice(0, wantHQ));

  const remaining = messages.filter((m) => !pick.includes(m));
  pick.push(...sampleByContext(remaining, Math.floor(maxSampleSize * 0.3)));

  const remaining2 = messages.filter((m) => !pick.includes(m));
  pick.push(...sampleByBehavior(remaining2, Math.floor(maxSampleSize * 0.2)));

  // Recent 10%
  const recent = messages.slice(-Math.floor(maxSampleSize * 0.1));
  for (const r of recent) if (!pick.includes(r)) pick.push(r);

  // Deduplicate and respect char budget; then sort by time to preserve flow
  const dedup = Array.from(new Set(pick));
  const trimmed = trimByCharsBudget(dedup, STYLE_CHARS_BUDGET);
  return trimmed.sort(byTime);
}

function trimByCharsBudget(msgs: Msg[], budget: number): Msg[] {
  let used = 0;
  const out: Msg[] = [];
  for (const m of msgs) {
    const len = m.message.length + 8; // small overhead
    if (used + len > budget) break;
    out.push(m);
    used += len;
  }
  // Ensure we don't exceed legacy line cap either
  return out.slice(0, MAX_STYLE_SAMPLE_LINES);
}

function byTime(a: Msg, b: Msg) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

/** ---------- Formality Detection ---------- */
function detectCommunicationFormality(messages: Msg[]): "casual" | "mixed" | "formal" {
  let formalityScore = 0;
  const totalMessages = messages.length;
  
  if (totalMessages === 0) return "casual";
  
  for (const msg of messages) {
    const text = msg.message.toLowerCase();
    let msgScore = 0;
    
    // Formal indicators (+1 each)
    if (text.includes("dear ") || text.includes("sincerely") || text.includes("best regards")) msgScore += 3;
    if (text.includes("thank you") || text.includes("please") || text.includes("appreciate")) msgScore += 1;
    if (text.includes("meeting") || text.includes("schedule") || text.includes("regarding")) msgScore += 1;
    if (/^(hello|good morning|good afternoon)/i.test(text)) msgScore += 1;
    if (text.length > 100) msgScore += 1; // Longer messages tend to be more formal
    
    // Casual indicators (-1 each)
    if (/\b(lol|omg|btw|tbh|nah|yeah|bro|dude)\b/.test(text)) msgScore -= 2;
    if (/[😂😭💀😊]/.test(msg.message)) msgScore -= 1; // Emojis
    if (text.length < 30) msgScore -= 1; // Very short messages
    if (!/[.!?]$/.test(text.trim())) msgScore -= 1; // No ending punctuation
    if (/^(hey|hi|sup|yo)\b/i.test(text)) msgScore -= 1;
    
    formalityScore += msgScore;
  }
  
  const avgFormality = formalityScore / totalMessages;
  
  if (avgFormality > 1.5) return "formal";
  if (avgFormality < -0.5) return "casual";
  return "mixed";
}

/** ---------- JSON Schema once (re-used) ---------- */
const STYLE_SCHEMA = {
  name: "create_style_profile",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["tone", "formality", "pacing", "vocabulary", "quirks", "examples", "traits", "emotions", "preferences", "communication_patterns"],
    properties: {
      tone: { type: "string", maxLength: 400 },
      formality: { type: "string", enum: ["formal", "casual", "mixed"] },
      pacing: { type: "string", maxLength: 300 },
      vocabulary: { type: "array", items: { type: "string", maxLength: 80 }, minItems: 3, maxItems: 15 },
      quirks: { type: "array", items: { type: "string", maxLength: 120 }, minItems: 1, maxItems: 12 },
      examples: { type: "array", items: { type: "string", maxLength: 140 }, minItems: 2, maxItems: 8 },
      traits: {
        type: "object",
        additionalProperties: false,
        required: ["openness", "expressiveness", "humor", "empathy", "directness", "enthusiasm"],
        properties: {
          openness: { type: "number", minimum: 1, maximum: 10 },
          expressiveness: { type: "number", minimum: 1, maximum: 10 },
          humor: { type: "number", minimum: 1, maximum: 10 },
          empathy: { type: "number", minimum: 1, maximum: 10 },
          directness: { type: "number", minimum: 1, maximum: 10 },
          enthusiasm: { type: "number", minimum: 1, maximum: 10 },
        },
      },
      emotions: {
        type: "object",
        additionalProperties: false,
        required: ["primary", "secondary", "triggers", "mood_patterns"],
        properties: {
          primary: { type: "string" },
          secondary: { type: "array", items: { type: "string" } },
          triggers: {
            type: "object",
            additionalProperties: false,
            required: ["positive", "negative"],
            properties: {
              positive: { type: "array", items: { type: "string" } },
              negative: { type: "array", items: { type: "string" } },
            },
          },
          mood_patterns: {
            type: "object",
            additionalProperties: false,
            required: ["typical_mood", "mood_indicators", "stress_indicators"],
            properties: {
              typical_mood: { type: "string" },
              mood_indicators: { type: "array", items: { type: "string" } },
              stress_indicators: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      preferences: {
        type: "object",
        additionalProperties: false,
        required: ["topics", "avoids", "engagement", "relationship_dynamics", "context_preferences"],
        properties: {
          topics: { type: "array", items: { type: "string" } },
          avoids: { type: "array", items: { type: "string" } },
          engagement: { type: "array", items: { type: "string" } },
          relationship_dynamics: {
            type: "object",
            additionalProperties: false,
            required: ["power_position", "trust_indicators", "boundary_style"],
            properties: {
              power_position: { type: "string" },
              trust_indicators: { type: "array", items: { type: "string" } },
              boundary_style: { type: "string" },
            },
          },
          context_preferences: {
            type: "object",
            additionalProperties: false,
            required: ["formal_contexts", "casual_contexts", "work_contexts"],
            properties: {
              formal_contexts: { type: "array", items: { type: "string" } },
              casual_contexts: { type: "array", items: { type: "string" } },
              work_contexts: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      communication_patterns: {
        type: "object",
        additionalProperties: false,
        required: ["message_length", "punctuation_style", "capitalization", "abbreviations", "unique_expressions"],
        properties: {
          message_length: { type: "string", enum: ["short", "medium", "long"] },
          punctuation_style: { type: "string", enum: ["standard", "emojis", "abbreviations", "formal", "casual"] },
          capitalization: { type: "string", enum: ["proper", "all caps", "mixed", "formal", "casual"] },
          abbreviations: { type: "array", items: { type: "string" } },
          unique_expressions: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

/** ---------- Core route ---------- */
// Configure API route - Match application logic
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Slightly higher than MAX_FILE_SIZE_MB for buffer
    },
  },
}

export async function POST(request: Request) {
  const ip = getClientIP(request);

  // Persona limit (bugfix: >= instead of >)
  const existingPersonas = ipPersonas.get(ip) || [];
  const used = existingPersonas.length;
  if (used >= MAX_PERSONAS_PER_IP) {
    return NextResponse.json(
      {
        error: `You've exceeded the maximum number of personas per IP (${MAX_PERSONAS_PER_IP} personas: yourself + one other person). You have already created ${used} personas. This limit is permanent and cannot be reset by deleting personas.`,
      },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Additional validation for MVP safety
    if (files.length > 10) {
      return NextResponse.json({ error: "Too many files. Maximum 10 files allowed." }, { status: 400 });
    }

    for (const file of files) {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".csv") && !name.endsWith(".json") && !name.endsWith(".txt") && !name.endsWith(".xml")) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.name}. Only .csv, .json, .txt, and .xml files are accepted.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum file size is ${MAX_FILE_SIZE_MB}MB.` },
          { status: 400 }
        );
      }
    }

    const allMsgs = await parseFiles(files);
    
    if (allMsgs.length === 0) {
      return NextResponse.json({ error: "No valid messages found in uploaded files" }, { status: 400 });
    }

    const senderBuckets = groupBySender(allMsgs);
    const selectedBuckets = selectTopSenders(senderBuckets);
    const selectedParticipants = Object.keys(selectedBuckets);

    if (used + selectedParticipants.length > MAX_PERSONAS_PER_IP) {
      return NextResponse.json(
        {
          error: `Upload would create ${selectedParticipants.length} personas, but you can only have ${MAX_PERSONAS_PER_IP} total (yourself + one other person). You have already created ${used} personas. This limit is permanent and cannot be reset by deleting personas.`,
        },
        { status: 429 }
      );
    }

    const filteredMsgs = allMsgs.filter((m) => selectedParticipants.includes(m.sender)).sort(byTime);

    // Thread grouping (unchanged logic, light tidy)
    const conversationThreads: Msg[][] = [];
    let currentThread: Msg[] = [];
    for (let i = 0; i < filteredMsgs.length; i++) {
      const msg = filteredMsgs[i];
      const nextMsg = filteredMsgs[i + 1];
      if (currentThread.length === 0) {
        currentThread = [msg];
        continue;
      }
      const last = currentThread[currentThread.length - 1];
      const dt = Math.abs(new Date(msg.timestamp).getTime() - new Date(last.timestamp).getTime());
      const closeNext =
        nextMsg && Math.abs(new Date(nextMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5 * 60 * 1000;

      if (dt < 10 * 60 * 1000 && (msg.sender !== last.sender || closeNext)) {
        currentThread.push(msg);
      } else {
        const participantsInThread = new Set(currentThread.map((m) => m.sender));
        if (participantsInThread.size >= 2) conversationThreads.push([...currentThread]);
        currentThread = [msg];
      }
    }
    if (currentThread.length) {
      const participantsInThread = new Set(currentThread.map((m) => m.sender));
      if (participantsInThread.size >= 2) conversationThreads.push(currentThread);
    }

    const conversation = conversationThreads.flat();
    const participants = selectedParticipants;

    // Analyze participants with limited parallelism
    const personas: StoredPersona[] = [];
    let processed = 0;
    
    await Promise.all(
      participants.map((participant) => {
        return limit(async () => {
          // respect persona cap mid-flight
          if (used + processed >= MAX_PERSONAS_PER_IP) {
            return;
          }

          const participantMessages = conversation.filter((m) => m.sender === participant);
          const styleSample = advancedMessageSampling(participantMessages, MAX_STYLE_SAMPLE_LINES);
          const formalityLevel = detectCommunicationFormality(participantMessages);

          // Build enhanced style extraction prompt with formality awareness
          const getContextualAnalysis = (formality: string) => {
            switch (formality) {
              case "formal":
                return "This appears to be formal communication (emails, professional messages). Focus on professional tone, structured responses, and appropriate business etiquette.";
              case "casual":
                return "This appears to be casual communication (texts, chats). Focus on natural speech patterns, informal expressions, and personal communication style.";
              default:
                return "This appears to be mixed communication styles. Note when they switch between formal and casual, and what triggers these changes.";
            }
          };

          const system = `You are an expert in authentic communication analysis. Create a detailed personality profile that captures how this person ACTUALLY communicates. ${getContextualAnalysis(formalityLevel)}` as const;

          const user = `Analyze ${participant}'s authentic communication style from these ${styleSample.length} messages (${formalityLevel} context):

${styleSample.map((m, i) => `${i + 1}. ${m.message}`).join("\n")}

ANALYSIS FOCUS:
- HOW do they express emotions? (word choice, punctuation, emojis)
- WHAT is their typical response length and structure?
- HOW do they handle different topics? (enthusiasm levels, depth)  
- WHAT makes their voice unique? (specific phrases, habits, quirks)
- HOW do they build relationships through communication? (supportive, playful, direct)
${formalityLevel === "formal" ? "- WHEN do they use professional vs personal language?" : ""}
${formalityLevel === "mixed" ? "- WHEN do they switch between formal and casual styles?" : ""}

Extract behavioral patterns that match their communication context. Return JSON with authentic personality insights.`;

          // Use Chat Completions API with JSON schema for reliable structured output
          let json: StyleProfile | null = null;
          try {
            
            const res = await openai.chat.completions.create({
              model: MODEL,
              temperature: TEMPERATURE,
              response_format: {
                type: "json_schema",
                json_schema: { name: STYLE_SCHEMA.name, schema: STYLE_SCHEMA.schema, strict: false },
              } as const,
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
            });
            
            const txt = res.choices?.[0]?.message?.content ?? "{}";
            
            if (!txt || txt.trim() === "" || txt === "{}") {
              json = null;
            } else {
              try {
                json = JSON.parse(txt) as StyleProfile;
              } catch {
                json = null;
              }
            }
          } catch {
            // If schema gen fails for any reason, fall back to safe defaults
            json = null;
          }

          // Defaulting/normalization with formality context
          const styleProfile: StyleProfile =
            json ?? ({
              tone: "Neutral and professional",
              formality: "casual",
              pacing: "Varies with context",
              vocabulary: [],
              quirks: [],
              examples: [],
              formality_context: formalityLevel, // Store detected formality
              traits: { openness: 5, expressiveness: 5, humor: 5, empathy: 5, directness: 5, enthusiasm: 5 },
              emotions: {
                primary: "neutral",
                secondary: ["calm"],
                triggers: { positive: ["friendly interaction"], negative: ["disrespect"] },
                mood_patterns: { typical_mood: "neutral", mood_indicators: [], stress_indicators: [] },
              },
              preferences: {
                topics: ["general conversation"],
                avoids: ["controversial topics"],
                engagement: ["responds thoughtfully"],
                relationship_dynamics: { power_position: "equal", trust_indicators: [], boundary_style: "mixed" },
                context_preferences: { formal_contexts: [], casual_contexts: [], work_contexts: [] },
              },
              communication_patterns: {
                message_length: "medium",
                punctuation_style: "standard",
                capitalization: "proper",
                abbreviations: [],
                unique_expressions: [],
              },
            } as StyleProfile);

          // Ensure formality_context is always set
          if (json && !json.formality_context) {
            styleProfile.formality_context = formalityLevel;
          }

          const persona: StoredPersona = {
            id: participant,
            name: participant,
            messageCount: participantMessages.length,
            transcript: conversation, // full convo
            chatHistory: [],
            styleProfile,
          };

          personas.push(persona);
          processed++;
        });
      })
    );

    const updatedPersonas = [...existingPersonas, ...personas].slice(0, MAX_PERSONAS_PER_IP);
    ipPersonas.set(ip, updatedPersonas);
    ipUsage.set(ip, updatedPersonas.length);

    const sessionId = Date.now().toString();
    const skippedCount = selectedParticipants.length - personas.length;
    const limitInfo =
      skippedCount > 0
        ? {
            message: `Processed ${personas.length} out of ${selectedParticipants.length} participants due to persona limit`,
            skippedCount,
            totalParticipants: selectedParticipants.length,
          }
        : null;

    return NextResponse.json({
      sessionId,
      personas,
      autoSelectionInfo: null,
      totalPersonasCreated: updatedPersonas.length,
      limitInfo,
    });
  } catch (error) {
    // Check for OpenAI quota/billing errors in multiple formats
    const isQuotaError = (err: unknown): boolean => {
      if (!(err instanceof Error)) return false;
      
      const message = err.message.toLowerCase();
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

    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          error: "Service temporarily unavailable due to usage limits. Please try again later.",
          errorType: "quota_exceeded",
          redirectTo: "/out-of-credits",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
