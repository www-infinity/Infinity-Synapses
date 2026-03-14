import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface SearchResult {
  heading: string;
  abstract: string;
  abstractURL: string;
  abstractSource: string;
  answer: string;
  topics: Array<{ text: string; url: string }>;
}

// Reason over search results and produce a conversational response
function buildResponse(query: string, search: SearchResult): string {
  const parts: string[] = [];

  if (search.answer) {
    parts.push(search.answer);
  }

  if (search.abstract) {
    parts.push(search.abstract);
  } else if (!search.answer) {
    parts.push(`Here's what I found on "${query}".`);
  }

  if (search.topics.length > 0) {
    const topicLines = search.topics
      .slice(0, 4)
      .map((t) => `• ${t.text}`)
      .join("\n");
    parts.push(`\nRelated threads:\n${topicLines}`);
  }

  if (search.abstractURL) {
    parts.push(`\nSource: ${search.abstractURL}`);
  }

  return parts.join("\n\n");
}

export async function POST(req: NextRequest) {
  let body: { message?: string };
  try {
    body = (await req.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  try {
    // Run DuckDuckGo search
    const base = req.nextUrl.origin;
    const searchRes = await fetch(
      `${base}/api/search?q=${encodeURIComponent(message)}`
    );
    const searchData = (await searchRes.json()) as SearchResult & { error?: string };

    let reply: string;
    if (searchData.error || (!searchData.abstract && !searchData.answer && searchData.topics.length === 0)) {
      reply = `I searched for "${message}" but couldn't find a direct answer right now. Try rephrasing or check DuckDuckGo directly.`;
    } else {
      reply = buildResponse(message, searchData);
    }

    return NextResponse.json({ reply, searchData });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
