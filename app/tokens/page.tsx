"use client";
import { useState, useCallback } from "react";
import { Shield, CheckCircle, XCircle, Loader2, Clock, Search, FileText } from "lucide-react";

type TokenTier = "research" | "premium" | "gold";
type ApprovalStatus = "idle" | "reviewing" | "approved" | "rejected";
type ResearchStatus = "idle" | "fetching" | "done" | "error";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface MintedToken {
  id: number;
  title: string;
  tier: TokenTier;
  hash: string;
  content: string;
  ts: number;
}

interface RelatedTopicItem {
  Text?: string;
  FirstURL?: string;
  Name?: string;
  Topics?: Array<{ Text: string; FirstURL: string; Name?: string }>;
}

const TIER_CONFIG: Record<TokenTier, { color: string; emoji: string; label: string; minLength: number }> = {
  research: { color: "var(--cyan)",   emoji: "🔵", label: "Research",  minLength: 20 },
  premium:  { color: "var(--purple)", emoji: "💜", label: "Premium",   minLength: 50 },
  gold:     { color: "var(--gold)",   emoji: "🟡", label: "Gold",      minLength: 100 },
};

const OUTLINE_TEMPLATES: Record<string, string[]> = {
  default: ["Introduction", "Background & Context", "Key Concepts", "Analysis", "Implications", "Conclusion", "References"],
  bitcoin: ["What is Bitcoin?", "Blockchain Technology", "Mining & Consensus", "Use Cases", "Market Dynamics", "Future Outlook", "References"],
  ai: ["Introduction to AI", "Machine Learning Foundations", "Current Capabilities", "Ethical Considerations", "Industry Applications", "Open Research Questions", "References"],
};

function pickOutline(topic: string): string[] {
  const t = topic.toLowerCase();
  if (t.includes("bitcoin") || t.includes("btc") || t.includes("crypto") || t.includes("blockchain")) return OUTLINE_TEMPLATES.bitcoin;
  if (t.includes("ai") || t.includes("artificial intelligence") || t.includes("machine learning")) return OUTLINE_TEMPLATES.ai;
  return OUTLINE_TEMPLATES.default;
}

function buildResearchBody(topic: string, results: SearchResult[]): string {
  const outline = pickOutline(topic);
  let body = `# Research Token: ${topic}\n\n`;
  body += `## ${outline[0]}\nThis research token covers "${topic}", drawing on ${results.length} live sourced references.\n\n`;
  if (results[0]) body += `## ${outline[1]}\n${results[0].snippet}\n\nSource: ${results[0].title}\n\n`;
  if (results[1]) body += `## ${outline[2]}\n${results[1].snippet}\n\nSource: ${results[1].title}\n\n`;
  body += `## ${outline[3]}\nBased on available information, "${topic}" encompasses multiple dimensions that are actively studied and debated.\n\n`;
  if (results[2]) body += `## ${outline[4]}\n${results[2].snippet}\n\nSource: ${results[2].title}\n\n`;
  body += `## ${outline[5]}\n"${topic}" continues to evolve rapidly. The sources identified above provide a starting point for deeper investigation.\n\n`;
  body += `## ${outline[6]}\n`;
  results.forEach((r, i) => { body += `[${i + 1}] ${r.title} — ${r.url}\n`; });
  return body;
}

function generateHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0") + "-" +
    Math.random().toString(16).slice(2, 10) + "-" +
    Date.now().toString(16);
}

let tokenId = 0;

export default function TokensPage() {
  const [title, setTitle]             = useState("");
  const [content, setContent]         = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const [tier, setTier]               = useState<TokenTier>("research");
  const [status, setStatus]           = useState<ApprovalStatus>("idle");
  const [researchStatus, setResearchStatus] = useState<ResearchStatus>("idle");
  const [researchError, setResearchError]   = useState("");
  const [rejectReason, setRejectReason]     = useState("");
  const [minted, setMinted]           = useState<MintedToken[]>([]);

  /* ── Research Writer integration ─────────────────────────────────── */
  const runResearch = useCallback(async () => {
    const t = researchTopic.trim();
    if (!t) return;
    setResearchStatus("fetching");
    setResearchError("");
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();

      const results: SearchResult[] = [];
      if (data.Answer) results.unshift({ title: "Direct Answer", url: "#", snippet: data.Answer });
      if (data.AbstractText) results.push({ title: data.AbstractSource || "DuckDuckGo Abstract", url: data.AbstractURL || "#", snippet: data.AbstractText });
      for (const rt of (data.RelatedTopics || []) as RelatedTopicItem[]) {
        if (results.length >= 7) break;
        if (rt.Text && rt.FirstURL) {
          results.push({ title: rt.Name || rt.Text.split(" — ")[0] || "Related", url: rt.FirstURL, snippet: rt.Text });
        } else if (rt.Topics) {
          for (const sub of rt.Topics) {
            if (results.length >= 7) break;
            results.push({ title: sub.Name || sub.Text.split(" — ")[0] || "Related", url: sub.FirstURL, snippet: sub.Text });
          }
        }
      }
      if (results.length === 0) results.push({ title: "No direct results", url: "#", snippet: `No abstract found for "${t}". Add more detail manually.` });

      setContent(buildResearchBody(t, results));
      if (!title.trim()) setTitle(t);
      setResearchStatus("done");
    } catch (e) {
      setResearchError(e instanceof Error ? e.message : "Research fetch failed");
      setResearchStatus("error");
    }
  }, [researchTopic, title]);

  /* ── Mint ─────────────────────────────────────────────────────────── */
  const submit = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setStatus("reviewing");
    setRejectReason("");
    await new Promise((r) => setTimeout(r, 2000));
    const minLen = TIER_CONFIG[tier].minLength;
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < minLen / 5) {
      setStatus("rejected");
      setRejectReason(`Content too short for ${TIER_CONFIG[tier].label} tier. Need at least ${Math.ceil(minLen / 5)} words (use Step 1 — Research Writer to generate content automatically).`);
      return;
    }
    if (title.trim().length < 5) {
      setStatus("rejected");
      setRejectReason("Title must be at least 5 characters.");
      return;
    }
    const hash = generateHash(title + content + tier);
    setMinted((m) => [{ id: ++tokenId, title: title.trim(), tier, hash, content: content.trim(), ts: Date.now() }, ...m]);
    setStatus("approved");
    setTitle("");
    setContent("");
    setResearchTopic("");
    setResearchStatus("idle");
    setTimeout(() => setStatus("idle"), 3000);
  }, [title, content, tier]);

  return (
    <div style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ padding: "48px 0 40px", borderBottom: "1px solid var(--bg-border)" }}>
        {/* Background radial glow */}
        <div aria-hidden={true} style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,215,0,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Synchronized ∞ + ₿ symbol cluster */}
          <div className="relative inline-flex items-center justify-center mb-6" style={{ width: 200, height: 200 }}>
            {/* Outer ring */}
            <div aria-hidden={true} style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(255,215,0,0.2)",
              animation: "spin-slow 12s linear infinite",
            }} />
            {/* Inner ring */}
            <div aria-hidden={true} style={{
              position: "absolute", inset: 16, borderRadius: "50%",
              border: "1px dashed rgba(247,147,26,0.25)",
              animation: "spin-reverse 8s linear infinite",
            }} />
            {/* Central ∞ */}
            <span className="tilt3d glow-pulse" style={{
              fontSize: 80,
              color: "var(--gold)",
              lineHeight: 1,
              userSelect: "none",
              position: "relative",
              zIndex: 2,
            }}>∞</span>
            {/* Orbiting ₿ */}
            <span aria-label="Bitcoin" style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: -16,
              marginLeft: -16,
              fontSize: 28,
              fontWeight: 900,
              color: "#F7931A",
              lineHeight: 1,
              userSelect: "none",
              zIndex: 3,
              filter: "drop-shadow(0 0 10px rgba(247,147,26,0.8))",
              animation: "btc-orbit 4s linear infinite",
            }}>₿</span>
          </div>

          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--gold)" }}>
            Token Studio
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Research-backed token minting. Use the <strong style={{ color: "var(--cyan)" }}>Research Writer</strong> below
            to auto-generate content from live sources, then mint with Soban AI quality gate.
          </p>

          {/* Live Bitcoin tag */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full" style={{ background: "rgba(247,147,26,0.1)", border: "1px solid rgba(247,147,26,0.3)" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#F7931A", animation: "btc-glow-pulse 2s ease-in-out infinite" }} />
            <span className="text-sm font-semibold" style={{ color: "#F7931A" }}>₿ Bitcoin Crusher · Research Token Engine</span>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Step 1 — Research Writer */}
        <div className="rounded-2xl border p-6 mb-6" style={{ background: "var(--bg-card)", borderColor: "rgba(0,212,255,0.3)", boxShadow: "0 0 24px rgba(0,212,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Search size={18} style={{ color: "var(--cyan)" }} />
            <h2 className="font-semibold" style={{ color: "var(--cyan)" }}>Step 1 — Research Writer</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,255,0.1)", color: "var(--cyan)" }}>
              Powered by DuckDuckGo
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Enter a research topic and let the Research Writer fetch live sources and draft the token content for you.
          </p>

          <div className="flex gap-3 mb-3">
            <input
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && researchStatus !== "fetching" && runResearch()}
              placeholder="e.g. Bitcoin Lightning Network, Proof of Work, DeFi…"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(0,0,0,0.4)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
              aria-label="Research topic for token"
              disabled={researchStatus === "fetching"}
            />
            <button
              onClick={runResearch}
              disabled={researchStatus === "fetching" || !researchTopic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "var(--cyan)", color: "#000", opacity: (!researchTopic.trim() || researchStatus === "fetching") ? 0.6 : 1 }}
              aria-label="Run research writer"
            >
              {researchStatus === "fetching"
                ? <><Loader2 size={15} className="animate-spin" /> Writing…</>
                : <><Search size={15} /> Research</>}
            </button>
          </div>

          {researchStatus === "done" && (
            <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.08)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={13} /> Research content generated — review and edit below, then mint.
            </div>
          )}
          {researchStatus === "error" && (
            <div className="p-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {researchError}
            </div>
          )}
        </div>

        {/* Step 2 — Mint form */}
        <div className="rounded-2xl border p-6 mb-8 glow-gold" style={{ background: "var(--bg-card)", borderColor: "rgba(255,215,0,0.25)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold" style={{ color: "var(--gold)" }}>Step 2 — Mint Token</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,215,0,0.1)", color: "var(--gold)" }}>
              Soban AI Gate Active
            </span>
          </div>

          {/* Tier selector */}
          <div className="mb-4">
            <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Token Tier</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TIER_CONFIG) as TokenTier[]).map((t) => (
                <button key={t} onClick={() => setTier(t)} aria-pressed={tier === t}
                  className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
                  style={{ background: tier === t ? TIER_CONFIG[t].color : "rgba(255,255,255,0.04)", color: tier === t ? "#000" : "var(--text)", border: `1px solid ${tier === t ? TIER_CONFIG[t].color : "var(--bg-border)"}` }}>
                  {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Min content length: {TIER_CONFIG[tier].minLength} chars · {Math.ceil(TIER_CONFIG[tier].minLength / 5)} words
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Token Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
              placeholder="e.g. Bitcoin Consensus Mechanisms" aria-label="Token title" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>Content / Research</label>
              {researchStatus === "done" && (
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--cyan)" }}>
                  <FileText size={11} /> Research-generated content
                </span>
              )}
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-y focus:outline-none font-mono"
              style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
              placeholder="Use the Research Writer above to auto-generate content, or write your own research here…" aria-label="Token content" />
            <p className="text-xs mt-1 text-right" style={{ color: content.length >= TIER_CONFIG[tier].minLength ? "var(--green)" : "var(--text-muted)" }}>
              {content.length} / {TIER_CONFIG[tier].minLength} chars
            </p>
          </div>

          <button onClick={submit} disabled={status === "reviewing" || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--gold) 0%, #ffb300 100%)", color: "#000", boxShadow: "0 4px 16px rgba(255,215,0,0.3)" }}
            aria-label="Mint token">
            {status === "reviewing"
              ? <><Loader2 size={16} className="animate-spin" /> Soban AI reviewing…</>
              : <><span style={{ fontSize: 18 }}>₿</span> Mint Research Token</>}
          </button>

          {status === "approved" && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg slide-in" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <CheckCircle size={16} style={{ color: "var(--green)" }} />
              <span className="text-sm" style={{ color: "var(--green)" }}>Token minted successfully! ₿∞</span>
            </div>
          )}
          {status === "rejected" && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg slide-in" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <XCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--red)" }} />
              <span className="text-sm" style={{ color: "var(--red)" }}>{rejectReason}</span>
            </div>
          )}
        </div>

        {/* Minted tokens */}
        {minted.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" }}>∞</div>
              <h2 className="font-bold" style={{ color: "var(--gold)" }}>Minted Tokens ({minted.length})</h2>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#F7931A", animation: "btc-glow-pulse 2s ease-in-out infinite", marginLeft: 4 }} />
            </div>
            <div className="space-y-3">
              {minted.map((t) => (
                <div key={t.id} className="rounded-xl border p-4 slide-in" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)", boxShadow: `0 0 12px ${t.tier === "gold" ? "rgba(255,215,0,0.1)" : t.tier === "premium" ? "rgba(139,92,246,0.1)" : "rgba(0,212,255,0.1)"}` }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{TIER_CONFIG[t.tier].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: TIER_CONFIG[t.tier].color }}>{t.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(255,255,255,0.05)", color: TIER_CONFIG[t.tier].color }}>{t.tier}</span>
                        <span className="text-xs font-bold" style={{ color: "#F7931A" }}>₿</span>
                      </div>
                      <p className="text-xs mb-2 line-clamp-2 font-mono" style={{ color: "var(--text-muted)" }}>{t.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,215,0,0.08)", color: "var(--gold)" }}>
                          {t.hash}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Clock size={10} /> {new Date(t.ts).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
