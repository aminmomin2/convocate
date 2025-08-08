// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { parseStringPromise } from "xml2js";
import { openai } from "@/lib/openai";
import type { Msg, StoredPersona, StyleProfile } from "@/types/persona";

const MAX_PERSONAS_PER_IP = 2;
const MAX_STYLE_SAMPLE_LINES = 75;
const MAX_FILE_SIZE_MB = 1; // 1MB file size limit

// In-memory throttle tracking
const ipUsage = new Map<string, number>();
// Server-side persona storage to prevent deletion workaround
const ipPersonas = new Map<string, StoredPersona[]>();

// Helper function to get IP with better fallback
function getClientIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  const realIP = request.headers.get("x-real-ip") || "";
  const cfConnectingIP = request.headers.get("cf-connecting-ip") || "";
  
  // Try multiple headers in order of reliability
  const ip = xff?.split(",")[0]?.trim() || 
             realIP || 
             cfConnectingIP || 
             "unknown";
  
  // If we still can't determine IP, use a cookie-based approach
  if (ip === "unknown") {
    const cookie = request.headers.get("cookie") || "";
    const match = cookie.match(/client_id=([^;]+)/);
    return match ? match[1] : `unknown_${Date.now()}`;
  }
  
  return ip;
}

// Helper function to select top 2 senders by message count
function selectTopSenders(buckets: Record<string, Msg[]>): Record<string, Msg[]> {
  const senderCounts = Object.entries(buckets).map(([sender, messages]) => ({
    sender,
    count: messages.length,
    messages
  }));
  
  // Sort by message count (descending)
  senderCounts.sort((a, b) => b.count - a.count);
  
  // Take top 2 senders
  const topSenders = senderCounts.slice(0, MAX_PERSONAS_PER_IP);
  
  // Convert back to buckets format
  const selectedBuckets: Record<string, Msg[]> = {};
  topSenders.forEach(({ sender, messages }) => {
    selectedBuckets[sender] = messages;
  });
  
  return selectedBuckets;
}

// 1) Parse a variety of chat-export files into a flat, timestamp-sorted Msg[]
async function parseFiles(files: File[]): Promise<Msg[]> {
  const all: Msg[] = [];

  for (const file of files) {
    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    const txt = await file.text();
    const name = file.name.toLowerCase();

    // Validate file type
    if (!name.endsWith('.csv') && !name.endsWith('.json') && 
        !name.endsWith('.txt') && !name.endsWith('.xml')) {
      throw new Error(`Unsupported file type: ${file.name}. Only .csv, .json, .txt, and .xml files are accepted.`);
    }

    if (name.endsWith(".txt")) {
      // WhatsApp export: [MM/DD/YY, HH:MM] Sender: Message
      txt.split("\n").forEach(line => {
        const m = line.match(/^\[(.+?)\]\s(.+?):\s(.+)$/);
        if (m) {
          const [, ts, sender, message] = m;
          const timestamp = isNaN(Date.parse(ts))
            ? new Date().toISOString()
            : new Date(ts).toISOString();
          all.push({ sender, message, timestamp });
        }
      });
    } else if (name.endsWith(".csv")) {
      // CSV with headers sender,message,timestamp
      const parsed = Papa.parse<{ sender: string; message: string; timestamp?: string }>(txt, {
        header: true,
        skipEmptyLines: true
      });
      parsed.data.forEach(r => {
        if (r.sender && r.message) {
          const timestamp = r.timestamp
            ? new Date(r.timestamp).toISOString()
            : new Date().toISOString();
          all.push({ sender: r.sender, message: r.message, timestamp });
        }
      });
    } else if (name.endsWith(".json")) {
      // JSON array [{sender,message,timestamp},…]
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) {
        arr.forEach((item: { sender: string; message: string; timestamp: string }) => {
          if (item.sender && item.message) {
            const timestamp = item.timestamp
              ? new Date(item.timestamp).toISOString()
              : new Date().toISOString();
            all.push({ sender: item.sender, message: item.message, timestamp });
          }
        });
      }
    } else if (name.endsWith(".xml")) {
      // SMS Backup & Restore XML
      const xml = await parseStringPromise(txt);
      const smses = xml?.smses?.sms || [];
      smses.forEach((sms: { $: { address: string; body: string; date: string } }) => {
        const { address, body, date } = sms.$;
        if (address && body) {
          const timestamp = date
            ? new Date(+date).toISOString()
            : new Date().toISOString();
          all.push({ sender: address, message: body, timestamp });
        }
      });
    }
  }

  return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// 2) Group by sender into chronological transcript arrays
function groupBySender(msgs: Msg[]): Record<string, Msg[]> {
  return msgs.reduce((acc, m) => {
    (acc[m.sender] ||= []).push(m);
    return acc;
  }, {} as Record<string, Msg[]>);
}

// Advanced sampling strategies for better persona accuracy
function advancedMessageSampling(messages: Msg[], maxSampleSize: number): Msg[] {
  if (messages.length <= maxSampleSize) return messages;
  
  // Quality scoring for messages
  const scoredMessages = messages.map(msg => ({
    message: msg,
    score: calculateMessageQuality(msg)
  }));
  
  // Sort by quality score
  scoredMessages.sort((a, b) => b.score - a.score);
  
  // Multi-criteria sampling
  const samples: Msg[] = [];
  
  // 1. High-quality messages (40%)
  const highQualityCount = Math.floor(maxSampleSize * 0.4);
  samples.push(...scoredMessages.slice(0, highQualityCount).map(s => s.message));
  
  // 2. Diverse context sampling (30%)
  const contextSamples = sampleByContext(messages.filter(msg => 
    !samples.some(sample => sample.message === msg.message)
  ), Math.floor(maxSampleSize * 0.3));
  samples.push(...contextSamples);
  
  // 3. Behavioral pattern sampling (20%)
  const behaviorSamples = sampleByBehavior(messages.filter(msg => 
    !samples.some(sample => sample.message === msg.message)
  ), Math.floor(maxSampleSize * 0.2));
  samples.push(...behaviorSamples);
  
  // 4. Recent messages (10%)
  const recentSamples = messages.slice(-Math.floor(maxSampleSize * 0.1)).filter(msg => 
    !samples.some(sample => sample.message === msg.message)
  );
  samples.push(...recentSamples);
  
  return samples.slice(0, maxSampleSize);
}

// Calculate message quality based on multiple factors
function calculateMessageQuality(msg: Msg): number {
  let score = 0;
  
  // Length factor (moderate length is better)
  const length = msg.message.length;
  if (length > 10 && length < 200) score += 3;
  else if (length >= 200) score += 2;
  else score += 1;
  
  // Engagement factor
  if (msg.message.includes('?')) score += 2; // Questions
  if (msg.message.includes('!')) score += 1; // Exclamations
  if (msg.message.includes('...')) score += 1; // Thoughtful pauses
  
  // Vocabulary richness
  const words = msg.message.split(' ');
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversity = uniqueWords.size / words.length;
  score += diversity * 3;
  
  // Personality indicators
  if (msg.message.toLowerCase().includes('lol') || msg.message.toLowerCase().includes('omg')) score += 1;
  if (msg.message.includes('😊') || msg.message.includes('😂')) score += 1;
  
  return score;
}

// Sample messages by context diversity
function sampleByContext(messages: Msg[], count: number): Msg[] {
  const contexts = ['question', 'statement', 'reaction', 'planning', 'casual'];
  const samples: Msg[] = [];
  
  for (const context of contexts) {
    const contextMessages = messages.filter(msg => {
      switch (context) {
        case 'question': return msg.message.includes('?');
        case 'statement': return msg.message.length > 20 && !msg.message.includes('?');
        case 'reaction': return msg.message.includes('!') || msg.message.includes('😊') || msg.message.includes('😂');
        case 'planning': return msg.message.toLowerCase().includes('when') || msg.message.toLowerCase().includes('where') || msg.message.toLowerCase().includes('what time');
        case 'casual': return msg.message.toLowerCase().includes('lol') || msg.message.toLowerCase().includes('yeah') || msg.message.toLowerCase().includes('nah');
        default: return false;
      }
    });
    
    const contextSample = contextMessages.slice(0, Math.ceil(count / contexts.length));
    samples.push(...contextSample);
  }
  
  return samples.slice(0, count);
}

// Sample messages by behavioral patterns
function sampleByBehavior(messages: Msg[], count: number): Msg[] {
  const behaviors = ['proactive', 'reactive', 'emotional', 'analytical', 'casual'];
  const samples: Msg[] = [];
  
  for (const behavior of behaviors) {
    const behaviorMessages = messages.filter(msg => {
      switch (behavior) {
        case 'proactive': return msg.message.includes('?') || msg.message.toLowerCase().includes('let\'s') || msg.message.toLowerCase().includes('we should');
        case 'reactive': return msg.message.length < 20 && !msg.message.includes('?');
        case 'emotional': return msg.message.includes('!') || msg.message.includes('😊') || msg.message.includes('😂') || msg.message.includes('😭');
        case 'analytical': return msg.message.length > 50 && msg.message.includes('.') && !msg.message.includes('!');
        case 'casual': return msg.message.toLowerCase().includes('bro') || msg.message.toLowerCase().includes('dude') || msg.message.toLowerCase().includes('lol');
        default: return false;
      }
    });
    
    const behaviorSample = behaviorMessages.slice(0, Math.ceil(count / behaviors.length));
    samples.push(...behaviorSample);
  }
  
  return samples.slice(0, count);
}

export async function POST(request: Request) {
  const ip = getClientIP(request);

  // Check persona limit per IP using server-side storage - DO THIS FIRST!
  const existingPersonas = ipPersonas.get(ip) || [];
  const used = existingPersonas.length;
  if (used > MAX_PERSONAS_PER_IP) {
    return NextResponse.json({ 
      error: `You've exceeded the maximum number of personas per IP (${MAX_PERSONAS_PER_IP} personas: yourself + one other person). You have already created ${used} personas. This limit is permanent and cannot be reset by deleting personas.` 
    }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate file types and sizes
    for (const file of files) {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.csv') && !name.endsWith('.json') && 
          !name.endsWith('.txt') && !name.endsWith('.xml')) {
        return NextResponse.json({ 
          error: `Unsupported file type: ${file.name}. Only .csv, .json, .txt, and .xml files are accepted.` 
        }, { status: 400 });
      }
      
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json({ 
          error: `File ${file.name} is too large. Maximum file size is ${MAX_FILE_SIZE_MB}MB.` 
        }, { status: 400 });
      }
    }

    // parse & create conversation
    const allMsgs = await parseFiles(files);
    
    if (allMsgs.length === 0) {
      return NextResponse.json({ error: "No valid messages found in uploaded files" }, { status: 400 });
    }

    // Group messages by sender
    const senderBuckets = groupBySender(allMsgs);
    
    // Select top 2 senders by message count
    const selectedBuckets = selectTopSenders(senderBuckets);
    const selectedParticipants = Object.keys(selectedBuckets);
    
    // Check if adding these personas would exceed the limit - DO THIS BEFORE EXPENSIVE API CALLS!
    if (used + selectedParticipants.length > MAX_PERSONAS_PER_IP) {
      return NextResponse.json({ 
        error: `Upload would create ${selectedParticipants.length} personas, but you can only have ${MAX_PERSONAS_PER_IP} total (yourself + one other person). You have already created ${used} personas. This limit is permanent and cannot be reset by deleting personas.` 
      }, { status: 429 });
    }
    
    // Create conversation with only the top 2 senders
    const filteredMsgs = allMsgs.filter(msg => selectedParticipants.includes(msg.sender));
    
    // Sort messages chronologically
    const sortedMsgs = filteredMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Find conversation threads between the selected participants
    const conversationThreads: Msg[][] = [];
    let currentThread: Msg[] = [];
    
    for (let i = 0; i < sortedMsgs.length; i++) {
      const msg = sortedMsgs[i];
      const nextMsg = sortedMsgs[i + 1];
      
      // Start a new thread if this is the first message
      if (currentThread.length === 0) {
        currentThread = [msg];
        continue;
      }
      
      // Check if this message is part of the current conversation thread
      const lastMsgInThread = currentThread[currentThread.length - 1];
      const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date(lastMsgInThread.timestamp).getTime());
      
      // If messages are close in time (within 10 minutes) and involve both participants, continue the thread
      if (timeDiff < 10 * 60 * 1000 && 
          (msg.sender !== lastMsgInThread.sender || 
           (nextMsg && Math.abs(new Date(nextMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5 * 60 * 1000))) {
        currentThread.push(msg);
      } else {
        // End current thread if it has messages from both participants
        const participantsInThread = [...new Set(currentThread.map(m => m.sender))];
        if (participantsInThread.length >= 2) {
          conversationThreads.push([...currentThread]);
        }
        currentThread = [msg];
      }
    }
    
    // Add the last thread if it has both participants
    if (currentThread.length > 0) {
      const participantsInThread = [...new Set(currentThread.map(m => m.sender))];
      if (participantsInThread.length >= 2) {
        conversationThreads.push(currentThread);
      }
    }
    
    // Combine all conversation threads into one chronological conversation
    const conversation = conversationThreads.flat();
    const participants = selectedParticipants;



    // Create personas for each participant with the full conversation as transcript
    const personas: StoredPersona[] = [];
    for (const participant of participants) {
      // Check if adding this participant would exceed the limit - DO THIS BEFORE EXPENSIVE API CALL!
      if (used + personas.length >= MAX_PERSONAS_PER_IP) {

        break; // Stop processing more participants
      }
      
      // Get messages for this participant (cheap operation)
      const participantMessages = conversation.filter(m => m.sender === participant);
      
      // Sample messages from this participant for style analysis (do this before expensive API call)
      const styleSample = advancedMessageSampling(participantMessages, MAX_STYLE_SAMPLE_LINES);
      
      // style analysis with structured JSON output using function calling
      let raw = "{}";
      try {
        const analysisRes = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-0125",
          temperature: 0.1,
          // remove response_format here
          messages: [
            {
              role: "system",
              content: `You are an expert communication analyst specializing in authentic text message style profiling. Your task is to analyze message samples and extract the precise, evidence-based communication patterns that make each person unique.

ANALYSIS FRAMEWORK:

1. VOCABULARY & LANGUAGE PATTERNS:
   - Identify signature words, phrases, and expressions unique to this person
   - Note recurring vocabulary choices and word preferences
   - Analyze formality level and language complexity
   - Look for distinctive abbreviations, slang, or specialized terms
   - Measure lexical diversity and word frequency patterns
   - Context-dependent vocabulary (formal vs casual, work vs personal)

2. COMMUNICATION STYLE:
   - Message length patterns (short, medium, long, or mixed)
   - Punctuation habits (standard, minimal, excessive, unique patterns)
   - Capitalization style (proper, all caps, mixed, or unique patterns)
   - Emoji usage patterns and frequency
   - Response timing and pacing indicators
   - Common typos, abbreviations, or casual language patterns
   - Natural imperfections and communication quirks
   - Sentence structure and complexity patterns
   - Context-dependent style variations

3. PERSONALITY TRAITS THROUGH COMMUNICATION:
   - Humor style (sarcastic, playful, witty, dry, or none)
   - Directness level (very direct, diplomatic, evasive, or mixed)
   - Emotional expressiveness (high, moderate, low, or context-dependent)
   - Engagement style (proactive, reactive, curious, or passive)
   - Formality preferences (formal, casual, mixed, or context-dependent)
   - Communication confidence and assertiveness
   - Relationship dynamics and social positioning

4. CONVERSATION DYNAMICS:
   - How they ask questions (direct, indirect, curious, or rare)
   - How they respond to different topics (enthusiastic, neutral, dismissive)
   - How they handle disagreements or conflicts
   - How they show interest or disinterest
   - How they maintain or change conversation topics
   - Turn-taking patterns and response timing
   - Emotional state indicators and triggers
   - Context switching behavior (work vs personal)

5. DISTINCTIVE QUIRKS:
   - Unique catchphrases or expressions
   - Recurring themes or topics they bring up
   - Communication habits that make them recognizable
   - Emotional triggers or patterns
   - Relationship dynamics they establish
   - Stylometric fingerprints (measurable style signals)
   - Context-specific behaviors and preferences

6. RELATIONSHIP & CONTEXT ANALYSIS:
   - How their communication style varies by relationship type
   - Professional vs personal communication patterns
   - Emotional state indicators and mood patterns
   - Power dynamics and social positioning
   - Trust levels and intimacy indicators
   - Cultural and background influences

CRITICAL GUIDELINES:
- Base ALL analysis on actual message content - cite specific examples
- Don't sanitize or formalize - preserve their real voice exactly as it appears
- Focus on patterns that would help recreate their authentic communication
- If insufficient data exists for a trait, mark it as "insufficient data"
- Prioritize distinctive patterns over generic observations
- Consider context and relationship dynamics in analysis
- Look for patterns across different situations and emotional states

Return ONLY via function call with precise, evidence-backed analysis.`
            },
            {
              role: "user",
              content: `Analyze ${styleSample.length} messages from ${participant} to create a comprehensive communication style profile.

MESSAGE SAMPLE:
<<<
${styleSample.map((m, i)=>`[${i+1}] ${m.message}`).join("\n")}
>>>

ANALYSIS INSTRUCTIONS:

1. VOCABULARY ANALYSIS:
   - Extract signature words, phrases, and expressions
   - Note formality level and language complexity
   - Identify recurring vocabulary patterns

2. COMMUNICATION PATTERNS:
   - Analyze message length, punctuation, capitalization
   - Note emoji usage and response patterns
   - Identify unique communication habits

3. PERSONALITY EXTRACTION:
   - Determine humor style, directness, expressiveness
   - Assess engagement style and formality preferences
   - Identify emotional patterns and triggers

4. CONVERSATION DYNAMICS:
   - How they ask questions and show interest
   - How they respond to different topics
   - How they maintain conversation flow

5. DISTINCTIVE QUIRKS:
   - Find unique catchphrases or expressions
   - Note recurring themes or communication habits
   - Identify what makes their voice recognizable

Provide evidence-based analysis with specific examples from the messages. Return a detailed style profile via function call.`
            }
          ],
          functions: [
            {
              name: "create_style_profile",
              description: "Create a comprehensive communication style profile",
              parameters: {
                type: "object",
                additionalProperties: false,
                required: [
                  "tone","formality","pacing","vocabulary","quirks",
                  "examples","traits","emotions","preferences","communication_patterns"
                ],
                properties: {
                  tone: { 
                    type: "string", 
                    maxLength: 400,
                    description: "Overall communication tone and emotional style (e.g., friendly, direct, sarcastic, formal, casual)"
                  },
                  formality: { 
                    type: "string", 
                    enum: ["formal","casual","mixed"],
                    description: "Formality level in communication"
                  },
                  pacing: { 
                    type: "string", 
                    maxLength: 300,
                    description: "Communication pacing and response patterns (e.g., quick responses, thoughtful, varied)"
                  },
                  vocabulary: {
                    type: "array",
                    items: { type: "string", maxLength: 80 },
                    minItems: 3, maxItems: 15,
                    description: "Signature words, phrases, and expressions unique to this person"
                  },
                  quirks: {
                    type: "array",
                    items: { type: "string", maxLength: 120 },
                    minItems: 1, maxItems: 12,
                    description: "Distinctive communication habits, catchphrases, or personality quirks"
                  },
                  examples: {
                    type: "array",
                    items: { type: "string", maxLength: 140 },
                    minItems: 2, maxItems: 8,
                    description: "Real message examples that showcase their communication style"
                  },
                  traits: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      openness: { type: "number", minimum: 1, maximum: 10 },
                      expressiveness: { type: "number", minimum: 1, maximum: 10 },
                      humor: { type: "number", minimum: 1, maximum: 10 },
                      empathy: { type: "number", minimum: 1, maximum: 10 },
                      directness: { type: "number", minimum: 1, maximum: 10 },
                      enthusiasm: { type: "number", minimum: 1, maximum: 10 }
                    }
                  },
                  emotions: {
                    type: "object",
                    description: "Emotional context and triggers",
                    properties: {
                      primary: {
                        type: "string",
                        description: "Primary emotional state (e.g., enthusiastic, calm, thoughtful)"
                      },
                      secondary: {
                        type: "array",
                        items: { type: "string" },
                        description: "Secondary emotions (e.g., curious, playful)"
                      },
                      triggers: {
                        type: "object",
                        properties: {
                          positive: {
                            type: "array",
                            items: { type: "string" },
                            description: "Situations that evoke positive responses"
                          },
                          negative: {
                            type: "array",
                            items: { type: "string" },
                            description: "Situations that evoke negative responses"
                          }
                        }
                      },
                      mood_patterns: {
                        type: "object",
                        properties: {
                          typical_mood: {
                            type: "string",
                            description: "Their typical emotional state in conversations"
                          },
                          mood_indicators: {
                            type: "array",
                            items: { type: "string" },
                            description: "Words or phrases that indicate their mood"
                          },
                          stress_indicators: {
                            type: "array",
                            items: { type: "string" },
                            description: "How they communicate when stressed or upset"
                          }
                        }
                      }
                    }
                  },
                  preferences: {
                    type: "object",
                    description: "Conversation preferences and style",
                    properties: {
                      topics: {
                        type: "array",
                        items: { type: "string" },
                        description: "Preferred conversation topics"
                      },
                      avoids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Topics or approaches to avoid"
                      },
                      engagement: {
                        type: "array",
                        items: { type: "string" },
                        description: "Engagement patterns (e.g., asks follow-up questions)"
                      },
                      relationship_dynamics: {
                        type: "object",
                        properties: {
                          power_position: {
                            type: "string",
                            description: "How they position themselves in relationships (dominant, submissive, equal)"
                          },
                          trust_indicators: {
                            type: "array",
                            items: { type: "string" },
                            description: "How they show trust or intimacy"
                          },
                          boundary_style: {
                            type: "string",
                            description: "How they set or respect boundaries"
                          }
                        }
                      },
                      context_preferences: {
                        type: "object",
                        properties: {
                          formal_contexts: {
                            type: "array",
                            items: { type: "string" },
                            description: "How they communicate in formal situations"
                          },
                          casual_contexts: {
                            type: "array",
                            items: { type: "string" },
                            description: "How they communicate in casual situations"
                          },
                          work_contexts: {
                            type: "array",
                            items: { type: "string" },
                            description: "How they communicate in work situations"
                          }
                        }
                      }
                    }
                  },
                  communication_patterns: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      message_length: { type: "string", enum: ["short", "medium", "long"] },
                      punctuation_style: { type: "string", enum: ["standard", "emojis", "abbreviations", "formal", "casual"] },
                      capitalization: { type: "string", enum: ["proper", "all caps", "mixed", "formal", "casual"] },
                      abbreviations: {
                        type: "array",
                        items: { type: "string" },
                        description: "Common abbreviations and expressions used"
                      },
                      unique_expressions: {
                        type: "array",
                        items: { type: "string" },
                        description: "Unique expressions, phrases, or language patterns specific to this person"
                      }
                    }
                  }
                }
              }
            }
          ],
          function_call: { name: "create_style_profile" },
          max_tokens: 1500
          });

          raw = analysisRes.choices[0]?.message?.function_call?.arguments || "{}";
  
        } catch (error) {
          console.warn(`Failed to generate style profile for ${participant}:`, error);
          raw = JSON.stringify({
            tone: "Neutral and professional",
            formality: "casual",
            pacing: "Varies with context",
            vocabulary: [],
            quirks: [],
            examples: [],
            traits: {
              openness: 5,
              expressiveness: 5,
              humor: 5,
              empathy: 5
            },
            emotions: {
              primary: "neutral",
              secondary: ["calm"],
              triggers: {
                positive: ["friendly interaction"],
                negative: ["disrespect"]
              }
            },
            preferences: {
              topics: ["general conversation"],
              avoids: ["controversial topics"],
              engagement: ["responds thoughtfully"]
            },
            communication_patterns: {
              message_length: "medium",
              punctuation_style: "standard",
              capitalization: "proper",
              abbreviations: [],
              unique_expressions: []
            }
          });
        }
      
      let styleProfile: StyleProfile;
      try {
        // Clean and validate the JSON response
        let cleanedRaw = raw.trim();
        
        // Check if JSON is complete (has matching braces)
        let braceCount = 0;
        for (let i = 0; i < cleanedRaw.length; i++) {
          if (cleanedRaw[i] === '{') braceCount++;
          if (cleanedRaw[i] === '}') braceCount--;
        }
        
        // If braces don't match, try to fix truncated JSON
        if (braceCount > 0) {
          // Add missing closing braces
          for (let i = 0; i < braceCount; i++) {
            cleanedRaw += '}';
          }
        }
        
        // Validate that the response starts with { and ends with }
        if (!cleanedRaw.startsWith("{") || !cleanedRaw.endsWith("}")) {
          throw new Error("Response is not a JSON object");
        }
        
        styleProfile = JSON.parse(cleanedRaw) as StyleProfile;
        

        
        // Set default values for optional fields FIRST
        styleProfile.traits = {
          openness: 5,
          expressiveness: 5,
          humor: 5,
          empathy: 5,
          ...styleProfile.traits
        };

        styleProfile.emotions = {
          primary: "neutral",
          secondary: [],
          ...styleProfile.emotions,
          triggers: {
            positive: [],
            negative: [],
            ...(styleProfile.emotions?.triggers || {})
          }
        };

        styleProfile.preferences = {
          topics: [],
          avoids: [],
          engagement: [],
          ...styleProfile.preferences
        };

        styleProfile.communication_patterns = {
          message_length: "medium",
          punctuation_style: "standard",
          capitalization: "proper",
          abbreviations: [],
          unique_expressions: [],
          ...styleProfile.communication_patterns
        };
        
        // Validate required fields and types AFTER setting defaults
        if (typeof styleProfile.tone !== "string" || !styleProfile.tone) {
          throw new Error("Missing or invalid tone");
        }
        if (styleProfile.formality !== "formal" && styleProfile.formality !== "casual" && styleProfile.formality !== "mixed") {
          throw new Error("Invalid formality value");
        }
        if (typeof styleProfile.pacing !== "string" || !styleProfile.pacing) {
          throw new Error("Missing or invalid pacing");
        }
        if (!Array.isArray(styleProfile.vocabulary)) {
          throw new Error("vocabulary must be an array");
        }
        if (!Array.isArray(styleProfile.quirks)) {
          throw new Error("quirks must be an array");
        }
        if (!Array.isArray(styleProfile.examples)) {
          throw new Error("examples must be an array");
        }

        // Validate new fields (should all exist now due to defaults)
        if (!styleProfile.traits || typeof styleProfile.traits !== "object") {
          throw new Error("traits must be an object");
        }
        if (!styleProfile.emotions || typeof styleProfile.emotions !== "object") {
          throw new Error("emotions must be an object");
        }
        if (!styleProfile.preferences || typeof styleProfile.preferences !== "object") {
          throw new Error("preferences must be an object");
        }
        if (!styleProfile.communication_patterns || typeof styleProfile.communication_patterns !== "object") {
          throw new Error("communication_patterns must be an object");
        }
      } catch (error) {
        console.warn(`Failed to parse style profile for ${participant}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.warn('Raw response:', raw);
        styleProfile = {
          tone: "Neutral and professional",
          formality: "casual",
          pacing: "Varies with context",
          vocabulary: [],
          quirks: [],
          examples: [],
          traits: {
            openness: 5,
            expressiveness: 5,
            humor: 5,
            empathy: 5
          },
          emotions: {
            primary: "neutral",
            secondary: ["calm"],
            triggers: {
              positive: ["friendly interaction"],
              negative: ["disrespect"]
            }
          },
          preferences: {
            topics: ["general conversation"],
            avoids: ["controversial topics"],
            engagement: ["responds thoughtfully"]
          },
          communication_patterns: {
            message_length: "medium",
            punctuation_style: "standard",
            capitalization: "proper",
            abbreviations: [],
            unique_expressions: []
          }
        };
      }

      // Create persona with the full conversation as transcript
      const persona: StoredPersona = {
        id: participant,
        name: participant,
        messageCount: participantMessages.length,
        transcript: conversation, // Full conversation with alternating speakers
        chatHistory: [],
        styleProfile
      };

      personas.push(persona);
    }

    // Update server-side persona storage
    const updatedPersonas = [...existingPersonas, ...personas];
    ipPersonas.set(ip, updatedPersonas);
    
    // Keep the old counter for backward compatibility
    ipUsage.set(ip, updatedPersonas.length);
    
    // Generate session ID for this upload
    const sessionId = Date.now().toString();
    
    // Check if we had to skip some participants due to limit
    const skippedCount = selectedParticipants.length - personas.length;
    const limitInfo = skippedCount > 0 ? {
      message: `Processed ${personas.length} out of ${selectedParticipants.length} participants due to persona limit`,
      skippedCount,
      totalParticipants: selectedParticipants.length
    } : null;
    
    return NextResponse.json({
      sessionId,
      personas,
      autoSelectionInfo: null, // No auto-selection needed for conversation format
      totalPersonasCreated: used + personas.length, // Return the updated total
      limitInfo
    });

  } catch (error) {
    console.error('[upload/route] Error:', error);
    
    // Check if it's a quota exceeded error
    if (error instanceof Error && error.message.includes('quota_exceeded')) {
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
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
