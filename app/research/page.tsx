"use client";
import { useState, useCallback, useRef } from "react";
import { Search, FileText, RefreshCw, Copy, Check, Trash2 } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ResearchDoc {
  id: number;
  topic: string;
  outline: string[];
  body: string;
  sources: SearchResult[];
  createdAt: number;
}

let docId = 0;

const OUTLINE_TEMPLATES: Record<string, string[]> = {
  default: [
    "1. Introduction",
    "2. Background & Context",
    "3. Key Concepts",
    "4. Analysis",
    "5. Implications",
    "6. Conclusion",
    "7. References",
  ],
  bitcoin: [
    "1. What is Bitcoin?",
    "2. Blockchain Technology",
    "3. Mining & Consensus",
    "4. Use Cases",
    "5. Market Dynamics",
    "6. Future Outlook",
    "7. References",
  ],
  ai: [
    "1. Introduction to AI",
    "2. Machine Learning Foundations",
    "3. Current Capabilities",
    "4. Ethical Considerations",
    "5. Industry Applications",
    "6. Open Research Questions",
    "7. References",
  ],
};

function pickOutline(topic: string): string[] {
  const t = topic.toLowerCase();
  if (t.includes("bitcoin") || t.includes("btc") || t.includes("crypto") || t.includes("blockchain")) {
    return OUTLINE_TEMPLATES.bitcoin;
  }
  if (t.includes("ai") || t.includes("artificial intelligence") || t.includes("machine learning")) {
    return OUTLINE_TEMPLATES.ai;
  }
  return OUTLINE_TEMPLATES.default;
}

function buildBody(topic: string, results: SearchResult[]): string {
  const outline = pickOutline(topic);
  let body = `# Research: ${topic}\n\n`;

  body += `## ${outline[0]}\n`;
  body += `This document presents an overview of "${topic}", drawing on ${results.length} sourced references.\n\n`;

  if (results[0]) {
    body += `## ${outline[1]}\n`;
    body += `${results[0].snippet}\n\nSource: ${results[0].title}\n\n`;
  }

  if (results[1]) {
    body += `## ${outline[2]}\n`;
    body += `${results[1].snippet}\n\nSource: ${results[1].title}\n\n`;
  }

  body += `## ${outline[3]}\n`;
  body += `Based on available information, "${topic}" encompasses multiple dimensions that are actively studied and debated.\n\n`;

  if (results[2]) {
    body += `## ${outline[4]}\n`;
    body += `${results[2].snippet}\n\nSource: ${results[2].title}\n\n`;
  }

  body += `## ${outline[5]}\n`;
  body += `"${topic}" continues to evolve rapidly. The sources identified above provide a starting point for deeper investigation.\n\n`;

  body += `## ${outline[6]}\n`;
  results.forEach((r, i) => {
    body += `[${i + 1}] ${r.title} — ${r.url}\n`;
  });

  return body;
}

export default function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<ResearchDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const runResearch = useCallback(async () => {
    const t = topic.trim();
    if (!t) return;
    setLoading(true);
    setError(null);

    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(t)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();

      const results: SearchResult[] = [];

      // Answer (direct, highest priority)
      if (data.Answer) {
        results.unshift({ title: "Direct Answer", url: "#", snippet: data.Answer });
      }

      // Abstract
      if (data.AbstractText) {
        results.push({
          title: data.AbstractSource || "DuckDuckGo Abstract",
          url: data.AbstractURL || "#",
          snippet: data.AbstractText,
        });
      }

      // Related topics — handle both flat items and nested topic groups
      for (const rt of (data.RelatedTopics || []) as Array<{
        Text?: string; FirstURL?: string; Name?: string;
        Topics?: Array<{ Text: string; FirstURL: string; Name?: string }>;
      }>) {
        if (results.length >= 7) break;
        if (rt.Text && rt.FirstURL) {
          results.push({
            title: rt.Name || rt.Text.split(" — ")[0] || "Related",
            url: rt.FirstURL,
            snippet: rt.Text,
          });
        } else if (rt.Topics) {
          for (const sub of rt.Topics) {
            if (results.length >= 7) break;
            results.push({
              title: sub.Name || sub.Text.split(" — ")[0] || "Related",
              url: sub.FirstURL,
              snippet: sub.Text,
            });
          }
        }
      }

      if (results.length === 0) {
        results.push({
          title: "No direct results",
          url: "#",
          snippet: `DuckDuckGo returned no abstract for "${t}". Try a more specific query.`,
        });
      }

      const doc: ResearchDoc = {
        id: ++docId,
        topic: t,
        outline: pickOutline(t),
        body: buildBody(t, results),
        sources: results,
        createdAt: Date.now(),
      };

      setDocs((prev) => [doc, ...prev]);
      setActiveDoc(doc);
      setTopic("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed");
    } finally {
      setLoading(false);
    }
  }, [topic]);

  const copyDoc = useCallback(() => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeDoc]);

  const removeDoc = useCallback((id: number) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setActiveDoc((prev) => (prev?.id === id ? null : prev));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>
        ✍️ Research Writer
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        Enter a topic and the Research Writer drafts a structured document using live DuckDuckGo
        search — sourced, outlined, and ready to copy.
      </p>

      {/* Input panel */}
      <div
        className="rounded-2xl border p-5 mb-8"
        style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
      >
        <div className="flex gap-3">
          <input
            ref={inputRef}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && runResearch()}
            placeholder="Enter research topic (e.g. Bitcoin Lightning Network)…"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
            aria-label="Research topic"
            disabled={loading}
          />
          <button
            onClick={runResearch}
            disabled={loading || !topic.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: "var(--gold)", color: "#000", opacity: (!topic.trim() || loading) ? 0.6 : 1 }}
            aria-label="Run research"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? "Writing…" : "Write"}
          </button>
        </div>

        {error && (
          <div
            className="mt-3 p-3 rounded-lg text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document list */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            DOCUMENTS ({docs.length})
          </h2>
          {docs.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-sm"
              style={{ border: "2px dashed var(--bg-border)", color: "var(--text-muted)" }}
            >
              No documents yet — run a search above ↑
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all"
                  style={{
                    background: activeDoc?.id === doc.id ? "rgba(255,215,0,0.06)" : "var(--bg-card)",
                    borderColor: activeDoc?.id === doc.id ? "rgba(255,215,0,0.3)" : "var(--bg-border)",
                  }}
                  onClick={() => setActiveDoc(doc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setActiveDoc(doc)}
                  aria-label={`Open document: ${doc.topic}`}
                >
                  <FileText size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                      {doc.topic}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {doc.sources.length} sources · {new Date(doc.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeDoc(doc.id); }}
                    className="p-1 rounded"
                    style={{ color: "var(--text-muted)" }}
                    aria-label={`Remove ${doc.topic}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document viewer */}
        <div className="lg:col-span-2">
          {activeDoc ? (
            <div
              className="rounded-2xl border h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
            >
              {/* Doc header */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: "var(--bg-border)" }}
              >
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--gold)" }}>
                    {activeDoc.topic}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {activeDoc.sources.length} sources · {activeDoc.outline.length} sections
                  </div>
                </div>
                <button
                  onClick={copyDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                    color: copied ? "var(--green)" : "var(--text-muted)",
                    border: "1px solid var(--bg-border)",
                  }}
                  aria-label="Copy document"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Doc body */}
              <pre
                className="p-5 text-xs leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap"
                style={{ color: "var(--text)", fontFamily: "monospace" }}
              >
                {activeDoc.body}
              </pre>
            </div>
          ) : (
            <div
              className="rounded-2xl border h-64 flex items-center justify-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
            >
              <div className="text-center" style={{ color: "var(--text-muted)" }}>
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a document to view it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
