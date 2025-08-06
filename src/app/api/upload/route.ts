// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { parseStringPromise } from "xml2js";
import { openai } from "@/lib/openai";
import type { Msg, StoredPersona, StyleProfile } from "@/types/persona";

// 1) Parse a variety of chat-export files into a flat, timestamp-sorted Msg[]
async function parseFiles(files: File[]): Promise<Msg[]> {
  const all: Msg[] = [];

  for (const file of files) {
    const txt = await file.text();
    const name = file.name.toLowerCase();

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
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    // parse & group
    const allMsgs = await parseFiles(files);
    const buckets = groupBySender(allMsgs);

    // 3) Build StoredPersona[] with styleProfile via one-off LLM call
    const personas: StoredPersona[] = [];
    for (const [id, transcript] of Object.entries(buckets)) {
      // style analysis with structured JSON output
      const analysisRes = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are a conversation style analyst.
Based on the lines below, produce a JSON object matching this schema:

{
  "tone": string,
  "formality": string,
  "pacing": string,
  "vocabulary": [string, …],
  "quirks": [string, …],
  "examples": [string, …]
}

- "tone": One-sentence description of their overall mood/attitude.  
- "formality": One word ("formal" or "casual").  
- "pacing": One-sentence description of sentence length and flow.  
- "vocabulary": 3–5 words or short phrases they use often.  
- "quirks": 1–3 idiosyncrasies (emoji use, punctuation habits).  
- "examples": 1–2 verbatim transcript snippets illustrating their style.  

Respond *only* with valid JSON—no extra text.
            `.trim()
          },
          // feed in up to the last 20 transcript messages
          ...transcript
            .slice(-20)
            .map(m => ({
              role: (m.sender === id ? "assistant" : "user") as "assistant" | "user",
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
        console.warn(`Failed to parse style profile for ${id}:`, error);
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

      // Create persona with structured style profile
      const persona: StoredPersona = {
        id,
        name: id,
        messageCount: transcript.length,
        transcript,
        chatHistory: [],
        styleProfile
      };

      personas.push(persona);
    }

    return NextResponse.json({ personas });
  } catch (err: unknown) {
    console.error("[upload/route] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload parsing failed" },
      { status: 500 }
    );
  }
}
