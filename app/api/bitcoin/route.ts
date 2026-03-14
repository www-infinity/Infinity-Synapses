import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://blockchain.info/latestblock", {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`BTC API ${res.status}`);
    const data = (await res.json()) as { hash: string; height: number; time: number };
    return NextResponse.json({ hash: data.hash, height: data.height, time: data.time });
  } catch {
    // Fallback deterministic hash so the radio always works
    const fallback = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    return NextResponse.json({ hash: fallback, height: 0, time: Date.now() / 1000, fallback: true });
  }
}
