import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface DDGResult {
  AbstractText: string;
  AbstractURL: string;
  AbstractSource: string;
  RelatedTopics: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text: string; FirstURL: string }> }>;
  Answer: string;
  AnswerType: string;
  Heading: string;
  Image: string;
  Type: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "InfinitySynapses/1.0" },
    });
    if (!res.ok) throw new Error(`DDG ${res.status}`);
    const data = (await res.json()) as DDGResult;

    // Extract a clean set of results
    const topics: Array<{ text: string; url: string }> = [];
    for (const t of data.RelatedTopics ?? []) {
      if (t.Text && t.FirstURL) {
        topics.push({ text: t.Text, url: t.FirstURL });
      } else if (t.Topics) {
        for (const sub of t.Topics) {
          topics.push({ text: sub.Text, url: sub.FirstURL });
        }
      }
      if (topics.length >= 6) break;
    }

    return NextResponse.json({
      heading: data.Heading,
      abstract: data.AbstractText,
      abstractURL: data.AbstractURL,
      abstractSource: data.AbstractSource,
      answer: data.Answer,
      answerType: data.AnswerType,
      image: data.Image,
      type: data.Type,
      topics,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
