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

// Helper function to sample messages evenly across transcript
function sampleMessagesEvenly(messages: Msg[], sampleSize: number): Msg[] {
  if (messages.length <= sampleSize) return messages;
  
  const step = messages.length / sampleSize;
  const sampled: Msg[] = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const index = Math.floor(i * step);
    sampled.push(messages[index]);
  }
  
  return sampled;
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

export async function POST(request: Request) {
  const ip = getClientIP(request);

  // Check persona limit per IP
  const used = ipUsage.get(ip) || 0;
  if (used >= MAX_PERSONAS_PER_IP) {
    return NextResponse.json({ 
      error: `You've reached the maximum number of personas per IP (2 personas: yourself + one other person). This limit is permanent and cannot be reset by deleting personas.` 
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

    // Check if adding this conversation would exceed the limit
    if (used + 1 > MAX_PERSONAS_PER_IP) {
      return NextResponse.json({ 
        error: `Upload would create 1 conversation, but you can only have ${MAX_PERSONAS_PER_IP} total (yourself + one other person). You have already created ${used} personas. This limit is permanent and cannot be reset by deleting personas.` 
      }, { status: 429 });
    }

    // Create personas for each participant with the full conversation as transcript
    const personas: StoredPersona[] = [];
    for (const participant of participants) {
      // Sample messages from this participant for style analysis
      const participantMessages = conversation.filter(m => m.sender === participant);
      const styleSample = sampleMessagesEvenly(participantMessages, MAX_STYLE_SAMPLE_LINES);
      
      // style analysis with structured JSON output
      const analysisRes = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
      You are a conversation style analyst.
      Below are ${styleSample.length} evenly sampled messages from ${participant}.
      Analyze them and respond *only* with valid JSON* matching this schema*:
      
      {
        "tone": string,          // one-sentence summary of overall mood
        "formality": "formal"|"casual",
        "pacing": string,        // one-sentence on sentence length & flow
        "vocabulary": [string],  // 3–5 frequently used words or short phrases
        "quirks": [string],      // 1–3 idiosyncrasies (emoji, punctuation)
        "examples": [string]     // 1–2 verbatim snippets illustrating style
      }
      
      Do not include any explanation, extra fields, or markdown—just the JSON.
            `.trim()
          },
          ...styleSample.map(m => ({
          role: (m.sender === participant ? "assistant" : "user") as "assistant" | "user",
          content: m.message
        }))
      ]
    });

      // Parse the structured style profile
      let styleProfile: StyleProfile;
      try {
        styleProfile = JSON.parse(analysisRes.choices[0]?.message?.content?.trim() || '{}') as StyleProfile;
        
        // Validate and provide fallbacks for required fields
        if (!styleProfile.tone) styleProfile.tone = "Neutral and professional";
        if (!styleProfile.formality) styleProfile.formality = "casual";
        if (!styleProfile.pacing) styleProfile.pacing = "Varies with context";
        if (!Array.isArray(styleProfile.vocabulary)) styleProfile.vocabulary = [];
        if (!Array.isArray(styleProfile.quirks)) styleProfile.quirks = [];
        if (!Array.isArray(styleProfile.examples)) styleProfile.examples = [];
      } catch (error) {
        console.warn(`Failed to parse style profile for ${participant}:`, error);
        // Fallback style profile
        styleProfile = {
          tone: "Neutral and professional",
          formality: "casual",
          pacing: "Varies with context",
          vocabulary: [],
          quirks: [],
          examples: []
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

    // Update IP usage counter
    ipUsage.set(ip, used + personas.length);
    
    // Generate session ID for this upload
    const sessionId = Date.now().toString();
    
    return NextResponse.json({
      sessionId,
      personas,
      autoSelectionInfo: null // No auto-selection needed for conversation format
    });

  } catch (error) {
    console.error('[upload/route] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
