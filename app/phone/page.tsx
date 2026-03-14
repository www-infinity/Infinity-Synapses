"use client";
import { useState, useCallback, useRef } from "react";
import { Phone, PhoneOff, Copy, Check } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  number: string[];
  online: boolean;
}

const EMOJI_BLOCKS = ["🟥","🟧","🟨","🟩","🟦","🟪","⬜","⬛","🔴","🟠","🟡","🟢","🔵","🟣","⭕","🔶","🔷","🎷","😎","👌","⭐","💃","♥️","🧱","🟨","🛸","🌻","🐴","💎","👑","🦾","🧲"];

function generateNumber(seed: string, length = 8): string[] {
  const blocks: string[] = [];
  for (let i = 0; i < length; i++) {
    const code = seed.charCodeAt(i % seed.length) + i;
    blocks.push(EMOJI_BLOCKS[code % EMOJI_BLOCKS.length]);
  }
  return blocks;
}

const CONTACTS: Contact[] = [
  { id: 1, name: "Green Engineer",  number: generateNumber("green-engineer", 8),  online: true },
  { id: 2, name: "Infinity Crown",  number: generateNumber("infinity-crown", 8),  online: true },
  { id: 3, name: "Cosmic Signal",   number: generateNumber("cosmic-signal", 8),   online: false },
  { id: 4, name: "Synapse Node",    number: generateNumber("synapse-node", 8),    online: false },
];

const MY_NUMBER = ["😎","🟦","👌","🟥","🎷","🟨","♣️","⬜"];

type CallState = "idle" | "calling" | "connected" | "ended";

export default function PhonePage() {
  const [callState, setCallState]   = useState<CallState>("idle");
  const [callTarget, setCallTarget] = useState<Contact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [copied, setCopied]         = useState(false);
  const [customSeed, setCustomSeed] = useState("");
  const [customNumber, setCustomNumber] = useState<string[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCall = useCallback((contact: Contact) => {
    setCallTarget(contact);
    setCallState("calling");
    setCallDuration(0);
    setTimeout(() => {
      setCallState("connected");
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }, 1800);
  }, []);

  const endCall = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setCallState("ended");
    setTimeout(() => { setCallState("idle"); setCallTarget(null); }, 1500);
  }, []);

  const copyNumber = useCallback(async () => {
    await navigator.clipboard.writeText(MY_NUMBER.join("")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const formatDuration = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>📞 Hydrogen Host</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Emoji-block device identifiers. 8-block numbers for P2P communication — no traditional phone numbers.
      </p>

      {/* My number */}
      <div className="rounded-xl border p-5 mb-6 glow-gold" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>YOUR INFINITY NUMBER</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 flex-wrap" role="text" aria-label={`Your number: ${MY_NUMBER.join("")}`}>
            {MY_NUMBER.map((e, i) => (
              <span key={i} className="text-2xl">{e}</span>
            ))}
          </div>
          <button onClick={copyNumber}
            className="ml-auto p-2 rounded-lg transition-all"
            style={{ background: "rgba(255,215,0,0.1)", color: "var(--gold)" }}
            aria-label="Copy your number">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>This 8-block ID identifies your device on the Hydrogen Host network</p>
      </div>

      {/* Custom number generator */}
      <div className="rounded-xl border p-4 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--gold)" }}>Generate Custom Number</h2>
        <div className="flex gap-2">
          <input
            value={customSeed}
            onChange={(e) => setCustomSeed(e.target.value)}
            placeholder="Enter your name or phrase…"
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
            aria-label="Custom number seed"
          />
          <button
            onClick={() => setCustomNumber(generateNumber(customSeed || "seed", 8))}
            disabled={!customSeed.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ background: "var(--gold)", color: "#000" }}
            aria-label="Generate number">
            Generate
          </button>
        </div>
        {customNumber && (
          <div className="mt-3 flex gap-1 flex-wrap" role="text" aria-label="Generated number">
            {customNumber.map((e, i) => <span key={i} className="text-2xl">{e}</span>)}
          </div>
        )}
      </div>

      {/* Active call overlay */}
      {callState !== "idle" && callTarget && (
        <div className="rounded-xl border p-6 mb-6 text-center" style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.3)" }}>
          <div className="text-4xl mb-2">{callState === "calling" ? "📡" : callState === "connected" ? "🟢" : "🔴"}</div>
          <div className="font-bold text-lg mb-1">{callTarget.name}</div>
          <div className="flex justify-center gap-1 mb-2">
            {callTarget.number.map((e, i) => <span key={i} className="text-lg">{e}</span>)}
          </div>
          <div className="text-sm mb-4" style={{ color: callState === "connected" ? "var(--green)" : "var(--text-muted)" }}>
            {callState === "calling" ? "Establishing signal…" : callState === "connected" ? `Connected ${formatDuration(callDuration)}` : "Call ended"}
          </div>
          {callState === "connected" && (
            <button onClick={endCall}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full font-semibold"
              style={{ background: "var(--red)", color: "#fff" }}
              aria-label="End call">
              <PhoneOff size={16} /> End Call
            </button>
          )}
        </div>
      )}

      {/* Contacts */}
      <h2 className="font-semibold mb-3 text-sm" style={{ color: "var(--gold)" }}>Contacts</h2>
      <div className="space-y-3" role="list" aria-label="Contacts">
        {CONTACTS.map((c) => (
          <div key={c.id} className="rounded-xl border p-4 flex items-center gap-4" role="listitem"
            style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: "rgba(255,215,0,0.1)" }}>
                {c.number[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: c.online ? "var(--green)" : "var(--text-muted)", borderColor: "var(--bg-card)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{c.name}</div>
              <div className="flex gap-0.5 mt-0.5" role="text" aria-label={`Number: ${c.number.join("")}`}>
                {c.number.map((e, i) => <span key={i} className="text-sm">{e}</span>)}
              </div>
            </div>
            <button
              onClick={() => c.online && callState === "idle" && startCall(c)}
              disabled={!c.online || callState !== "idle"}
              className="p-2.5 rounded-full transition-all disabled:opacity-40"
              style={{ background: c.online ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", color: c.online ? "var(--green)" : "var(--text-muted)" }}
              aria-label={`Call ${c.name}`}>
              <Phone size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
