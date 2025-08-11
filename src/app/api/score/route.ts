import { NextResponse } from "next/server";

// Type definitions for scoring cache
interface ScoringResult {
  score: number;
  tips: string[];
}

interface GlobalWithScoringCache {
  scoringCache?: Map<string, Promise<ScoringResult>>;
}

declare global {
  var scoringCache: Map<string, Promise<ScoringResult>> | undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scoringId = searchParams.get('id');

  if (!scoringId) {
    return NextResponse.json({ error: "Missing scoring ID" }, { status: 400 });
  }

  try {
    // Check if scoring is complete
    if (!global.scoringCache || !global.scoringCache.has(scoringId)) {
      return NextResponse.json({ 
        status: "not_found",
        message: "Scoring request not found or expired"
      }, { status: 404 });
    }

    const scoringPromise = global.scoringCache.get(scoringId);
    if (!scoringPromise) {
      return NextResponse.json({ 
        status: "not_found",
        message: "Scoring request not found"
      }, { status: 404 });
    }
    
    // Check if the promise has resolved
    const result = await scoringPromise;
    
    // Remove from cache after successful retrieval
    global.scoringCache.delete(scoringId);

    return NextResponse.json({
      status: "complete",
      score: result.score,
      tips: result.tips
    });

  } catch (error) {
    console.error("[score] error:", error);
    
    // Remove failed promise from cache
    if (global.scoringCache) {
      global.scoringCache.delete(scoringId);
    }

    return NextResponse.json({
      status: "error",
      score: 5,
      tips: ["Continue the conversation naturally"]
    }, { status: 500 });
  }
}
