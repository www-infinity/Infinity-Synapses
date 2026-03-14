"use client";
import { useState, useCallback } from "react";
import { Shield, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

type TokenTier = "research" | "premium" | "gold";
type ApprovalStatus = "idle" | "reviewing" | "approved" | "rejected";

interface MintedToken {
  id: number;
  title: string;
  tier: TokenTier;
  hash: string;
  content: string;
  ts: number;
}

const TIER_CONFIG: Record<TokenTier, { color: string; emoji: string; label: string; minLength: number }> = {
  research: { color: "var(--cyan)",   emoji: "🔵", label: "Research",  minLength: 20 },
  premium:  { color: "var(--purple)", emoji: "💜", label: "Premium",   minLength: 50 },
  gold:     { color: "var(--gold)",   emoji: "🟡", label: "Gold",      minLength: 100 },
};

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
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [tier, setTier]         = useState<TokenTier>("research");
  const [status, setStatus]     = useState<ApprovalStatus>("idle");
  const [rejectReason, setRejectReason] = useState("");
  const [minted, setMinted]     = useState<MintedToken[]>([]);

  const submit = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    setStatus("reviewing");
    setRejectReason("");

    // Soban AI quality gate — client-side simulation
    await new Promise((r) => setTimeout(r, 2000));

    const minLen = TIER_CONFIG[tier].minLength;
    const wordCount = content.trim().split(/\s+/).length;

    if (wordCount < minLen / 5) {
      setStatus("rejected");
      setRejectReason(`Content too short for ${TIER_CONFIG[tier].label} tier. Add more substance (at least ${Math.ceil(minLen / 5)} words).`);
      return;
    }
    if (title.trim().length < 5) {
      setStatus("rejected");
      setRejectReason("Title must be at least 5 characters.");
      return;
    }

    const hash = generateHash(title + content + tier);
    setMinted((m) => [
      { id: ++tokenId, title: title.trim(), tier, hash, content: content.trim(), ts: Date.now() },
      ...m,
    ]);
    setStatus("approved");
    setTitle("");
    setContent("");
    setTimeout(() => setStatus("idle"), 3000);
  }, [title, content, tier]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>🟡 Token Studio</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Mint research-backed tokens. The Soban AI quality gate reviews content before minting.
      </p>

      {/* Mint form */}
      <div className="rounded-xl border p-6 mb-8 glow-gold" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} style={{ color: "var(--gold)" }} />
          <h2 className="font-semibold" style={{ color: "var(--gold)" }}>Mint New Token</h2>
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
                style={{ background: tier === t ? TIER_CONFIG[t].color : "rgba(255,255,255,0.04)", color: tier === t ? "#000" : "var(--text)", border: "1px solid var(--bg-border)" }}>
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
          <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Content / Research</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-y focus:outline-none"
            style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
            placeholder="Write your research content, description, or article here…" aria-label="Token content" />
          <p className="text-xs mt-1 text-right" style={{ color: content.length >= TIER_CONFIG[tier].minLength ? "var(--green)" : "var(--text-muted)" }}>
            {content.length} / {TIER_CONFIG[tier].minLength} chars
          </p>
        </div>

        <button onClick={submit} disabled={status === "reviewing" || !title.trim() || !content.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#000" }}
          aria-label="Mint token">
          {status === "reviewing" ? <><Loader2 size={16} className="animate-spin" /> Soban AI reviewing…</> : "🟡 Mint Token"}
        </button>

        {/* Status feedback */}
        {status === "approved" && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle size={16} style={{ color: "var(--green)" }} />
            <span className="text-sm" style={{ color: "var(--green)" }}>Token minted successfully!</span>
          </div>
        )}
        {status === "rejected" && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <XCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--red)" }} />
            <span className="text-sm" style={{ color: "var(--red)" }}>{rejectReason}</span>
          </div>
        )}
      </div>

      {/* Minted tokens */}
      {minted.length > 0 && (
        <div>
          <h2 className="font-bold mb-4" style={{ color: "var(--gold)" }}>Minted Tokens ({minted.length})</h2>
          <div className="space-y-3">
            {minted.map((t) => (
              <div key={t.id} className="rounded-xl border p-4 slide-in" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{TIER_CONFIG[t.tier].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: TIER_CONFIG[t.tier].color }}>{t.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(255,255,255,0.05)", color: TIER_CONFIG[t.tier].color }}>{t.tier}</span>
                    </div>
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>{t.content}</p>
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
  );
}
