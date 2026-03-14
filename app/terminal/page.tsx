"use client";
import dynamic from "next/dynamic";

// xterm and Monaco are client-only
const InfinityTerminal = dynamic(() => import("@/components/InfinityTerminal"), { ssr: false, loading: () => (
  <div className="max-w-6xl mx-auto px-4 py-10">
    <div className="h-96 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-muted)" }}>
      Loading Terminal…
    </div>
  </div>
)});

export default function TerminalPage() {
  return <InfinityTerminal />;
}
