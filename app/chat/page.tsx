"use client";
import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { Send, Search, Loader2 } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: Array<{ text: string; url: string }>;
  ts: number;
}

let msgId = 0;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: ++msgId,
      role: "assistant",
      text: "😎 What's on your mind? Ask me anything — I'll search the web, reason it out, and give you a real answer.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || loading) return;
      setInput("");

      const userMsg: Message = { id: ++msgId, role: "user", text, ts: Date.now() };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = (await res.json()) as {
          reply?: string;
          error?: string;
          searchData?: { topics?: Array<{ text: string; url: string }> };
        };

        const reply = data.reply ?? data.error ?? "No response.";
        const sources = data.searchData?.topics ?? [];

        setMessages((m) => [
          ...m,
          { id: ++msgId, role: "assistant", text: reply, sources, ts: Date.now() },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { id: ++msgId, role: "assistant", text: "😎 Network error — try again.", ts: Date.now() },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">😎</span>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--gold)" }}>Infinity AI Chat</h1>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <Search size={12} /> DuckDuckGo-powered real web search on every message
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 slide-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{
                background: msg.role === "user" ? "rgba(255,215,0,0.15)" : "rgba(0,212,255,0.1)",
                color: msg.role === "user" ? "var(--gold)" : "var(--cyan)",
              }}
              aria-hidden="true"
            >
              {msg.role === "user" ? "U" : "😎"}
            </div>

            <div className="max-w-[85%]">
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === "user" ? "rgba(255,215,0,0.08)" : "var(--bg-card)",
                  border: "1px solid var(--bg-border)",
                  color: "var(--text)",
                }}
              >
                {msg.text}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.sources.slice(0, 3).map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs px-3 py-1.5 rounded-lg truncate transition-colors"
                      style={{
                        background: "rgba(0,212,255,0.05)",
                        border: "1px solid rgba(0,212,255,0.15)",
                        color: "var(--cyan)",
                      }}
                    >
                      🔗 {s.text.slice(0, 80)}…
                    </a>
                  ))}
                </div>
              )}

              <div className="text-xs mt-1 px-1" style={{ color: "var(--text-muted)" }}>
                {new Date(msg.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 slide-in">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: "rgba(0,212,255,0.1)", color: "var(--cyan)" }}
            >
              😎
            </div>
            <div
              className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-muted)" }}
            >
              <Loader2 size={14} className="animate-spin" />
              Searching & reasoning…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 pt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border)",
            color: "var(--text)",
            maxHeight: "120px",
          }}
          aria-label="Chat message input"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
          style={{ background: "var(--gold)", color: "#000" }}
          aria-label="Send message"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
