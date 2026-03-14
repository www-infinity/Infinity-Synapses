"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Square, Trash2, Plus } from "lucide-react";

type BotRole = "watcher" | "writer" | "repair" | "researcher";
type BotStatus = "idle" | "running" | "done" | "error";

interface Bot {
  id: number;
  name: string;
  role: BotRole;
  status: BotStatus;
  log: string[];
  topic: string;
}

const ROLE_CONFIG: Record<BotRole, { emoji: string; color: string; desc: string }> = {
  watcher:    { emoji: "👁️",  color: "#0284c7", desc: "Monitors content changes and reports diffs" },
  writer:     { emoji: "✍️",  color: "var(--gold)", desc: "Generates content and research on a topic" },
  repair:     { emoji: "🔧",  color: "var(--green)", desc: "Scans for errors and suggests fixes" },
  researcher: { emoji: "🔍",  color: "var(--purple)", desc: "Deep-dives a topic using DuckDuckGo" },
};

let botId = 0;

const WRITER_LINES   = ["Drafting outline…", "Searching references…", "Composing section 1…", "Composing section 2…", "Formatting output…", "✅ Content ready."];
const WATCHER_LINES  = ["Watching file tree…", "Detected 3 changes…", "Diff: +12 lines, -4 lines", "No critical issues found.", "✅ Watch cycle complete."];
const REPAIR_LINES   = ["Scanning for lint errors…", "Found 2 warnings…", "Auto-fix applied: unused import removed", "Re-scanning…", "✅ No errors remain."];
const RESEARCHER_LINES = (topic: string) => [
  `Querying DuckDuckGo: "${topic}"…`,
  "Parsing top results…",
  "Cross-referencing sources…",
  "Summarising findings…",
  `✅ Research on "${topic}" complete.`,
];

function getBotLines(bot: Bot): string[] {
  switch (bot.role) {
    case "writer":     return WRITER_LINES;
    case "watcher":    return WATCHER_LINES;
    case "repair":     return REPAIR_LINES;
    case "researcher": return RESEARCHER_LINES(bot.topic || "unknown");
    default:           return ["Working…", "Done."];
  }
}

export default function BotsPage() {
  const [bots, setBots]          = useState<Bot[]>([]);
  const [newRole, setNewRole]    = useState<BotRole>("researcher");
  const [newTopic, setNewTopic]  = useState("Bitcoin blockchain");
  const timers = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());

  const spawnBot = useCallback(() => {
    const id = ++botId;
    const name = `${ROLE_CONFIG[newRole].emoji} Bot-${id}`;
    setBots((bs) => [...bs, { id, name, role: newRole, status: "idle", log: [], topic: newTopic }]);
  }, [newRole, newTopic]);

  const runBot = useCallback((id: number) => {
    // Read bot from current state inside setter to avoid stale closure
    setBots((bs) => {
      const bot = bs.find((b) => b.id === id);
      if (!bot || bot.status === "running") return bs;

      const lines = getBotLines(bot);
      let i = 0;
      const interval = setInterval(() => {
        setBots((inner) => inner.map((b) => {
          if (b.id !== id) return b;
          const newLog = [...b.log, `[${new Date().toLocaleTimeString()}] ${lines[i]}`];
          const isDone = i >= lines.length - 1;
          return { ...b, log: newLog, status: isDone ? "done" : "running" };
        }));
        i++;
        if (i >= lines.length) {
          clearInterval(interval);
          timers.current.delete(id);
        }
      }, 900);
      timers.current.set(id, interval);

      return bs.map((b) => b.id === id ? { ...b, status: "running", log: [] } : b);
    });
  }, []);

  const stopBot = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) { clearInterval(t); timers.current.delete(id); }
    setBots((bs) => bs.map((b) => b.id === id ? { ...b, status: "idle" } : b));
  }, []);

  const removeBot = useCallback((id: number) => {
    stopBot(id);
    setBots((bs) => bs.filter((b) => b.id !== id));
  }, [stopBot]);

  useEffect(() => {
    const current = timers.current;
    return () => { current.forEach((t) => clearInterval(t)); };
  }, []);

  const statusColor: Record<BotStatus, string> = {
    idle: "var(--text-muted)", running: "var(--gold)", done: "var(--green)", error: "var(--red)"
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>🤖 Bot Spawner</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>Spawn watcher, writer, repair, and researcher bots. Each runs its cycle and logs output.</p>

      {/* Spawn panel */}
      <div className="rounded-xl border p-5 mb-8" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <h2 className="font-semibold mb-4" style={{ color: "var(--gold)" }}>Spawn New Bot</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Role</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(ROLE_CONFIG) as BotRole[]).map((r) => (
                <button key={r} onClick={() => setNewRole(r)} aria-pressed={newRole === r}
                  className="px-3 py-1.5 rounded-lg text-sm capitalize transition-all"
                  style={{ background: newRole === r ? ROLE_CONFIG[r].color : "rgba(255,255,255,0.04)", color: newRole === r ? "#000" : "var(--text)", border: "1px solid var(--bg-border)" }}>
                  {ROLE_CONFIG[r].emoji} {r}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{ROLE_CONFIG[newRole].desc}</p>
          </div>
          {(newRole === "writer" || newRole === "researcher") && (
            <div className="flex-1 min-w-48">
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Topic</label>
              <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
                placeholder="Enter topic…" aria-label="Bot topic" />
            </div>
          )}
          <button onClick={spawnBot}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ background: "var(--gold)", color: "#000" }}
            aria-label="Spawn bot">
            <Plus size={14} /> Spawn Bot
          </button>
        </div>
      </div>

      {/* Bot list */}
      {bots.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ border: "2px dashed var(--bg-border)", color: "var(--text-muted)" }}>
          No bots yet — spawn one above ↑
        </div>
      ) : (
        <div className="space-y-4" role="list" aria-label="Active bots">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-xl border" role="listitem"
              style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <span className="text-xl">{ROLE_CONFIG[bot.role].emoji}</span>
                <div className="flex-1">
                  <span className="font-semibold text-sm">{bot.name}</span>
                  {bot.topic && <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>&ldquo;{bot.topic}&rdquo;</span>}
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full capitalize" style={{ color: statusColor[bot.status], background: "rgba(255,255,255,0.04)" }}>
                  {bot.status === "running" && <span className="pulse-gold">● </span>}{bot.status}
                </span>
                <div className="flex gap-2">
                  {bot.status !== "running" ? (
                    <button onClick={() => runBot(bot.id)} className="p-1.5 rounded-lg"
                      style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)" }} aria-label={`Run ${bot.name}`}>
                      <Play size={14} />
                    </button>
                  ) : (
                    <button onClick={() => stopBot(bot.id)} className="p-1.5 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)" }} aria-label={`Stop ${bot.name}`}>
                      <Square size={14} />
                    </button>
                  )}
                  <button onClick={() => removeBot(bot.id)} className="p-1.5 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.06)", color: "var(--red)" }} aria-label={`Remove ${bot.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {bot.log.length > 0 && (
                <div className="p-3 font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto" style={{ color: "var(--text-muted)" }}>
                  {bot.log.map((line, i) => (
                    <div key={i} style={{ color: line.includes("✅") ? "var(--green)" : line.includes("Error") ? "var(--red)" : "var(--text-muted)" }}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
