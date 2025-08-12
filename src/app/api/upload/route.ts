/**
 * Convocate - AI Digital Twin Platform
 * 
 * This file contains the core API route for uploading conversation files and creating
 * AI-powered digital twins. It implements a sophisticated personality analysis pipeline
 * that extracts communication patterns, behavioral traits, and writing styles from
 * real chat conversations.
 * 
 * Architecture Overview:
 * 1. File Upload & Validation - Multi-format support with size/type validation
 * 2. Message Parsing - Intelligent extraction from various chat export formats
 * 3. Participant Selection - Algorithm to identify the most active conversation participants
 * 4. Message Sampling - Token-aware selection for cost-efficient AI analysis
 * 5. Personality Analysis - GPT-5 powered style profiling with structured output
 * 6. Rate Limiting - IP-based protection against abuse
 * 
 * @author [Your Name]
 * @version 1.0.0
 * @license MIT
 */

import { NextResponse } from "next/server";
import Papa from "papaparse";
import { parseStringPromise } from "xml2js";
import { openai } from "@/lib/openai";
import type { Msg, StoredPersona, StyleProfile } from "@/types/persona";

/**
 * Configuration Constants
 * 
 * These constants control the behavior of the personality analysis pipeline.
 * They are carefully tuned for optimal performance, cost efficiency, and user experience.
 */
const MODEL = "gpt-5-mini"; // Target ChatGPT-5 mini for advanced personality analysis
const TEMPERATURE = 1; // GPT-5 mini only supports default temperature of 1

// Rate limiting and usage constraints
const MAX_PERSONAS_PER_IP = 2; // Limit to prevent abuse and ensure quality
const MAX_STYLE_SAMPLE_LINES = 75; // Legacy soft cap for message sampling
const MAX_FILE_SIZE_MB = 1; // 1MB file size limit for performance
const STYLE_CHARS_BUDGET = 8000; // ~2k tokens budget to keep costs stable
const LIMIT_CONCURRENCY = 2; // Parallel processing limit for OpenAI API calls
const MIN_MESSAGES_PER_SENDER = 10; // Minimum messages needed for reliable personality analysis

/**
 * In-Memory State Management
 * 
 * Note: In production, this should be replaced with Redis or a database
 * for persistence across server restarts and horizontal scaling.
 */
// Track usage per IP address for rate limiting
const ipUsage = new Map<string, number>();
// Store personas per IP to prevent deletion workarounds
const ipPersonas = new Map<string, StoredPersona[]>();

/**
 * Memory Management & Cleanup
 * 
 * Prevents memory leaks by periodically cleaning up old persona data.
 * This is especially important for serverless environments where memory
 * usage directly impacts costs.
 */
const PERSONA_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour cleanup interval
const MAX_PERSONA_IPS = 5000; // Maximum number of IPs to track

// Periodic cleanup of old persona data
setInterval(() => {
  if (ipPersonas.size > MAX_PERSONA_IPS) {
    // Keep only the most recent entries to prevent runaway growth
    const entries = Array.from(ipPersonas.entries());
    ipPersonas.clear();
    entries.slice(-MAX_PERSONA_IPS / 2).forEach(([ip, personas]) => {
      ipPersonas.set(ip, personas);
    });
    console.log(`Cleaned up ${MAX_PERSONA_IPS / 2} old persona entries`);
  }
}, PERSONA_CLEANUP_INTERVAL);

/**
 * Concurrency Control - Semaphore Implementation
 * 
 * This implements a semaphore pattern to limit concurrent OpenAI API calls.
 * This prevents overwhelming the API and helps manage costs by controlling
 * the rate of expensive operations.
 * 
 * @param max - Maximum number of concurrent operations
 * @returns A function that can wrap async operations with concurrency control
 */
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

// Create a concurrency limiter for OpenAI API calls
const limit = createLimiter(LIMIT_CONCURRENCY);

/**
 * IP Address Detection
 * 
 * Extracts the client's real IP address from various headers.
 * This is crucial for rate limiting and preventing abuse.
 * Falls back to cookie-based identification if headers are unavailable.
 * 
 * @param request - The incoming HTTP request
 * @returns The client's IP address or a fallback identifier
 */
function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const xff = request.headers.get("x-forwarded-for") || "";
  const realIP = request.headers.get("x-real-ip") || "";
  const cfConnectingIP = request.headers.get("cf-connecting-ip") || "";
  
  // Extract the first IP from X-Forwarded-For (handles proxy chains)
  const ip = xff?.split(",")[0]?.trim() || realIP || cfConnectingIP || "unknown";
  
  if (ip !== "unknown") return ip;

  // Fallback to cookie-based identification for edge cases
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/client_id=([^;]+)/);
  return match ? match[1] : `unknown_${Date.now()}`;
}

/**
 * Message Processing Utilities
 */

/**
 * Groups messages by sender to analyze individual communication patterns
 * 
 * @param msgs - Array of messages from the conversation
 * @returns Object mapping sender names to their message arrays
 */
function groupBySender(msgs: Msg[]): Record<string, Msg[]> {
  return msgs.reduce((acc, m) => {
    (acc[m.sender] ||= []).push(m);
    return acc;
  }, {} as Record<string, Msg[]>);
}

/**
 * Selects the top senders based on message count for persona creation
 * 
 * This algorithm prioritizes the most active participants in the conversation,
 * as they provide the richest data for personality analysis.
 * 
 * @param buckets - Object mapping senders to their message arrays
 * @returns Object containing only the top senders (up to MAX_PERSONAS_PER_IP)
 */
function selectTopSenders(buckets: Record<string, Msg[]>): Record<string, Msg[]> {
  const senderCounts = Object.entries(buckets).map(([sender, messages]) => ({
    sender,
    count: messages.length,
    messages,
  }));
  
  // Sort by message count (descending) to prioritize most active participants
  senderCounts.sort((a, b) => b.count - a.count);
  
  // Take only the top senders up to the persona limit
  const top = senderCounts.slice(0, MAX_PERSONAS_PER_IP);
  const out: Record<string, Msg[]> = {};
  for (const { sender, messages } of top) out[sender] = messages;
  return out;
}

/**
 * Multi-Format File Parsing
 * 
 * Supports various chat export formats with intelligent parsing:
 * - WhatsApp TXT exports (most common)
 * - CSV with structured headers
 * - JSON arrays of message objects
 * - SMS Backup & Restore XML format
 * 
 * @param files - Array of uploaded files
 * @returns Parsed and normalized message array
 */
async function parseFiles(files: File[]): Promise<Msg[]> {
  const all: Msg[] = [];

  for (const file of files) {
    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }
    
    const txt = await file.text();
    const name = file.name.toLowerCase();

    // Validate file type
    if (!name.endsWith(".csv") && !name.endsWith(".json") && !name.endsWith(".txt") && !name.endsWith(".xml")) {
      throw new Error(
        `Unsupported file type: ${file.name}. Only .csv, .json, .txt, and .xml files are accepted.`
      );
    }

    // Parse based on file type
    if (name.endsWith(".txt")) {
      // WhatsApp export format: [MM/DD/YY, HH:MM] Sender: Message
      txt.split("\n").forEach((line) => {
        const m = line.match(/^\[(.+?)\]\s(.+?):\s(.+)$/);
        if (m) {
          const [, ts, sender, message] = m;
          const timestamp = isNaN(Date.parse(ts)) ? new Date().toISOString() : new Date(ts).toISOString();
          all.push({ sender, message, timestamp });
        }
      });
    } else if (name.endsWith(".csv")) {
      // CSV format with headers: sender,message,timestamp
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
      // JSON array format: [{sender, message, timestamp}]
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
      // SMS Backup & Restore XML format
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

  // Sort messages chronologically to preserve conversation flow
  return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Advanced Message Sampling Algorithms
 * 
 * These algorithms intelligently select representative messages for AI analysis
 * while staying within token budgets and preserving conversation context.
 */

/**
 * Calculates a quality score for a message based on various factors
 * 
 * Higher quality messages provide better data for personality analysis.
 * Factors include length, question marks, emotional indicators, and vocabulary diversity.
 * 
 * @param msg - The message to score
 * @returns Quality score (higher is better)
 */
function calculateMessageQuality(msg: Msg): number {
  let score = 0;
  const length = msg.message.length;
  
  // Length scoring: optimal length is 10-200 characters
  if (length > 10 && length < 200) score += 3;
  else if (length >= 200) score += 2;
  else score += 1;
  
  // Engagement indicators
  if (msg.message.includes("?")) score += 2; // Questions show engagement
  if (msg.message.includes("!")) score += 1; // Exclamations show emotion
  if (msg.message.includes("...")) score += 1; // Ellipsis shows thoughtfulness

  // Vocabulary diversity scoring
  const words = msg.message.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const diversity = words.length ? uniqueWords.size / words.length : 0;
  score += diversity * 3; // Higher diversity = better personality data

  // Casual communication indicators
  const lower = msg.message.toLowerCase();
  if (lower.includes("lol") || lower.includes("omg")) score += 1;
  if (/[😊😂😭]/.test(msg.message)) score += 1; // Emojis show personality

  return score;
}

/**
 * Samples messages by conversation context to ensure diverse representation
 * 
 * This ensures we capture different types of communication patterns:
 * questions, statements, reactions, planning, and casual conversation.
 * 
 * @param messages - Array of messages to sample from
 * @param count - Number of messages to select
 * @returns Sampled message array
 */
function sampleByContext(messages: Msg[], count: number): Msg[] {
  const buckets: Record<string, Msg[]> = {
    question: [],
    statement: [],
    reaction: [],
    planning: [],
    casual: [],
  };
  
  // Categorize messages by context
  for (const msg of messages) {
    const t = msg.message.toLowerCase();
    if (msg.message.includes("?")) buckets.question.push(msg);
    else if (msg.message.length > 20) buckets.statement.push(msg);
    if (/[!😊😂]/.test(msg.message)) buckets.reaction.push(msg);
    if (t.includes("when") || t.includes("where") || t.includes("what time")) buckets.planning.push(msg);
    if (t.includes("lol") || t.includes("yeah") || t.includes("nah") || t.includes("bro") || t.includes("dude"))
      buckets.casual.push(msg);
  }
  
  // Take equal samples from each category
  const per = Math.max(1, Math.ceil(count / 5));
  return [
    ...buckets.question.slice(0, per),
    ...buckets.statement.slice(0, per),
    ...buckets.reaction.slice(0, per),
    ...buckets.planning.slice(0, per),
    ...buckets.casual.slice(0, per),
  ].slice(0, count);
}

/**
 * Samples messages by behavioral patterns to capture personality traits
 * 
 * Looks for specific behavioral indicators like proactivity, emotional expression,
 * analytical thinking, and casual communication style.
 * 
 * @param messages - Array of messages to sample from
 * @param count - Number of messages to select
 * @returns Sampled message array
 */
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

/**
 * Advanced message sampling that combines multiple strategies
 * 
 * This is the main sampling algorithm that:
 * 1. Prioritizes high-quality messages (40%)
 * 2. Ensures context diversity (30%)
 * 3. Captures behavioral patterns (20%)
 * 4. Includes recent messages (10%)
 * 
 * @param messages - Array of messages to sample from
 * @param maxSampleSize - Maximum number of messages to select
 * @returns Optimally sampled message array
 */
function advancedMessageSampling(messages: Msg[], maxSampleSize: number): Msg[] {
  if (messages.length <= maxSampleSize) return messages.slice().sort(byTime);
  
  // Score all messages by quality
  const scored = messages
    .map((m) => ({ m, s: calculateMessageQuality(m) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);

  const pick: Msg[] = [];
  
  // Take 40% high-quality messages
  const wantHQ = Math.floor(maxSampleSize * 0.4);
  pick.push(...scored.slice(0, wantHQ));

  // Take 30% context-diverse messages
  const remaining = messages.filter((m) => !pick.includes(m));
  pick.push(...sampleByContext(remaining, Math.floor(maxSampleSize * 0.3)));

  // Take 20% behavior-pattern messages
  const remaining2 = messages.filter((m) => !pick.includes(m));
  pick.push(...sampleByBehavior(remaining2, Math.floor(maxSampleSize * 0.2)));

  // Take 10% recent messages for current context
  const recent = messages.slice(-Math.floor(maxSampleSize * 0.1));
  for (const r of recent) if (!pick.includes(r)) pick.push(r);

  // Deduplicate and respect character budget
  const dedup = Array.from(new Set(pick));
  const trimmed = trimByCharsBudget(dedup, STYLE_CHARS_BUDGET);
  return trimmed.sort(byTime);
}

/**
 * Trims message array to fit within character budget
 * 
 * This ensures we stay within OpenAI API token limits while preserving
 * the most important messages for personality analysis.
 * 
 * @param msgs - Array of messages to trim
 * @param budget - Maximum character budget
 * @returns Trimmed message array
 */
function trimByCharsBudget(msgs: Msg[], budget: number): Msg[] {
  let used = 0;
  const out: Msg[] = [];
  for (const m of msgs) {
    const len = m.message.length + 8; // Small overhead for formatting
    if (used + len > budget) break;
    out.push(m);
    used += len;
  }
  // Ensure we don't exceed legacy line cap either
  return out.slice(0, MAX_STYLE_SAMPLE_LINES);
}

/**
 * Sorts messages by timestamp for chronological order
 */
function byTime(a: Msg, b: Msg) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

/**
 * Communication Formality Detection
 * 
 * Analyzes the overall formality level of a conversation to provide
 * context-aware personality analysis.
 * 
 * @param messages - Array of messages to analyze
 * @returns Formality level: "casual", "mixed", or "formal"
 */
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

/**
 * OpenAI JSON Schema for Structured Personality Analysis
 * 
 * This schema ensures consistent, structured output from GPT-5 for personality
 * analysis. It captures 15+ dimensions of communication style and personality traits.
 */
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

/**
 * API Route Configuration
 * 
 * Configure the API route to handle larger file uploads and set appropriate
 * body parser limits.
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Slightly higher than MAX_FILE_SIZE_MB for buffer
    },
  },
}

/**
 * Main Upload API Route Handler
 * 
 * This is the core endpoint that handles file uploads and creates AI personas.
 * It implements a complete pipeline from file validation to personality analysis.
 * 
 * @param request - The incoming HTTP request with FormData
 * @returns JSON response with created personas and metadata
 */
export async function POST(request: Request) {
  const ip = getClientIP(request);

  // Check persona limit before processing
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
    // Parse form data and validate files
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Additional validation for MVP safety
    if (files.length > 10) {
      return NextResponse.json({ error: "Too many files. Maximum 10 files allowed." }, { status: 400 });
    }

    // Validate each file individually
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

    // Parse all files and extract messages
    const allMsgs = await parseFiles(files);
    
    if (allMsgs.length === 0) {
      return NextResponse.json({ error: "No valid messages found in uploaded files" }, { status: 400 });
    }

    // Group messages by sender and select top participants
    const senderBuckets = groupBySender(allMsgs);
    
    // Filter out senders with insufficient messages for reliable analysis
    const validSenders = Object.entries(senderBuckets).filter(([, messages]) => {
      return messages.length >= MIN_MESSAGES_PER_SENDER;
    });
    
    if (validSenders.length === 0) {
      return NextResponse.json(
        {
          error: `No participants have enough messages for analysis. Each person needs at least ${MIN_MESSAGES_PER_SENDER} messages to create a reliable personality profile. For example, if you have a conversation with 2 people, both people need to have sent at least ${MIN_MESSAGES_PER_SENDER} messages each.`,
        },
        { status: 400 }
      );
    }
    
    // Create buckets only for valid senders and select top participants
    const validBuckets = Object.fromEntries(validSenders);
    const selectedBuckets = selectTopSenders(validBuckets);
    const selectedParticipants = Object.keys(selectedBuckets);
    
    // Log excluded senders for debugging
    const excludedSenders = Object.entries(senderBuckets).filter(([, messages]) => {
      return messages.length < MIN_MESSAGES_PER_SENDER;
    });
    
    if (excludedSenders.length > 0) {
      console.log(`Excluded ${excludedSenders.length} senders with insufficient messages:`, 
        excludedSenders.map(([sender, messages]) => `${sender} (${messages.length} messages)`));
    }

    // Check if new personas would exceed the limit
    if (used + selectedParticipants.length > MAX_PERSONAS_PER_IP) {
      return NextResponse.json(
        {
          error: `Upload would create ${selectedParticipants.length} personas, but you can only have ${MAX_PERSONAS_PER_IP} total (yourself + one other person). You have already created ${used} personas. This limit is permanent and cannot be reset by deleting personas.`,
        },
        { status: 429 }
      );
    }

    // Filter messages to only include selected participants and sort chronologically
    const filteredMsgs = allMsgs.filter((m) => selectedParticipants.includes(m.sender)).sort(byTime);

    // Group messages into conversation threads for better context
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

      // Group messages within 10 minutes of each other
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

    // Analyze participants with limited parallelism to control API costs
    const personas: StoredPersona[] = [];
    let processed = 0;
    
    await Promise.all(
      participants.map((participant) => {
        return limit(async () => {
          // Respect persona cap mid-flight
          if (used + processed >= MAX_PERSONAS_PER_IP) {
            return;
          }

          // Get messages for this participant
          const participantMessages = conversation.filter((m) => m.sender === participant);
          
          // Sample messages intelligently for cost-efficient analysis
          const styleSample = advancedMessageSampling(participantMessages, MAX_STYLE_SAMPLE_LINES);
          
          // Detect communication formality for context-aware analysis
          const formalityLevel = detectCommunicationFormality(participantMessages);

          // Build contextual analysis prompt based on formality level
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

          // Create system prompt for personality analysis
          const system = `You are an expert in authentic communication analysis. Create a detailed personality profile that captures how this person ACTUALLY communicates. ${getContextualAnalysis(formalityLevel)}` as const;

          // Create user prompt with sampled messages
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

          // Call OpenAI API with structured output schema
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
            // Fall back to safe defaults if API call fails
            json = null;
          }

          // Create default style profile with formality context
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

          // Create the persona object
          const persona: StoredPersona = {
            id: participant,
            name: participant,
            messageCount: participantMessages.length,
            transcript: conversation, // Full conversation for context
            chatHistory: [],
            styleProfile,
          };

          personas.push(persona);
          processed++;
        });
      })
    );

    // Update stored personas and usage tracking
    const updatedPersonas = [...existingPersonas, ...personas].slice(0, MAX_PERSONAS_PER_IP);
    ipPersonas.set(ip, updatedPersonas);
    ipUsage.set(ip, updatedPersonas.length);

    // Generate response metadata
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

    const excludedInfo = excludedSenders.length > 0
      ? {
          message: `Excluded ${excludedSenders.length} participants with insufficient messages. Each person needs at least ${MIN_MESSAGES_PER_SENDER} messages to create a persona.`,
          excludedCount: excludedSenders.length,
          excludedParticipants: excludedSenders.map(([sender, messages]) => ({ 
            sender, 
            messageCount: messages.length,
            needed: MIN_MESSAGES_PER_SENDER - messages.length
          })),
        }
      : null;

    // Return successful response with created personas
    return NextResponse.json({
      sessionId,
      personas,
      autoSelectionInfo: null,
      totalPersonasCreated: updatedPersonas.length,
      limitInfo,
      excludedInfo,
    });
  } catch (error) {
    // Handle OpenAI quota/billing errors specifically
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
    
    // Return generic error response
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
