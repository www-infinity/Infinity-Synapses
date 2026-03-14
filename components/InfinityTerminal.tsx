"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Tab = "terminal" | "editor";

interface FileEntry {
  name: string;
  content: string;
  language: string;
}

const BOOT_LINES = [
  "\x1b[1;33m∞ INFINITY CODER TERMINAL v1.0\x1b[0m",
  "\x1b[90mBrowser-based terminal — no install required\x1b[0m",
  "",
  "Type \x1b[1;32mhelp\x1b[0m for available commands.",
  "",
];

const HELP_TEXT = [
  "\x1b[1;33mAvailable commands:\x1b[0m",
  "  \x1b[1;32mhelp\x1b[0m        — Show this help",
  "  \x1b[1;32mecho <text>\x1b[0m — Print text",
  "  \x1b[1;32mclear\x1b[0m       — Clear terminal",
  "  \x1b[1;32mdate\x1b[0m        — Show current date/time",
  "  \x1b[1;32mls\x1b[0m          — List virtual files",
  "  \x1b[1;32mcat <file>\x1b[0m  — Show file content",
  "  \x1b[1;32mwrite <f>\x1b[0m   — Open file in editor",
  "  \x1b[1;32msearch <q>\x1b[0m  — DuckDuckGo search",
  "  \x1b[1;32mbtc\x1b[0m         — Latest Bitcoin block",
  "  \x1b[1;32mversion\x1b[0m     — System version",
];

function useVirtualFS() {
  const [files, setFiles] = useState<FileEntry[]>([
    { name: "README.md",      content: "# Infinity Synapses\n\nWelcome to the browser terminal.", language: "markdown" },
    { name: "infinity.js",    content: 'console.log("∞ Infinity running");\n', language: "javascript" },
    { name: "styles.css",     content: "body { background: #07070f; color: #e2e8f0; }\n", language: "css" },
  ]);

  const getFile = useCallback((name: string) => files.find((f) => f.name === name) ?? null, [files]);
  const saveFile = useCallback((name: string, content: string) => {
    setFiles((fs) => {
      const existing = fs.find((f) => f.name === name);
      if (existing) return fs.map((f) => f.name === name ? { ...f, content } : f);
      const ext = name.split(".").pop() ?? "";
      const langMap: Record<string, string> = { js: "javascript", ts: "typescript", md: "markdown", css: "css", html: "html", json: "json" };
      return [...fs, { name, content, language: langMap[ext] ?? "plaintext" }];
    });
  }, []);

  return { files, getFile, saveFile };
}

export default function InfinityTerminal() {
  const termRef      = useRef<HTMLDivElement>(null);
  const xtermRef     = useRef<XTerm | null>(null);
  const fitRef       = useRef<FitAddon | null>(null);
  const lineRef      = useRef("");
  const [tab, setTab] = useState<Tab>("terminal");
  const [editorFile, setEditorFile] = useState<FileEntry | null>(null);
  const { files, getFile, saveFile } = useVirtualFS();

  const writeln = useCallback((text: string) => {
    xtermRef.current?.writeln(text);
  }, []);

  const prompt = useCallback(() => {
    xtermRef.current?.write("\r\n\x1b[1;33m∞\x1b[0m \x1b[1;32m~/infinity\x1b[0m $ ");
  }, []);

  const runCommand = useCallback(async (cmd: string) => {
    const [name, ...args] = cmd.trim().split(/\s+/);
    const arg = args.join(" ");

    if (!name) { prompt(); return; }

    switch (name.toLowerCase()) {
      case "help":
        HELP_TEXT.forEach((l) => writeln(l));
        break;
      case "clear":
        xtermRef.current?.clear();
        break;
      case "echo":
        writeln(arg);
        break;
      case "date":
        writeln(new Date().toString());
        break;
      case "version":
        writeln("\x1b[1;33m∞ Infinity Terminal 1.0.0 — Next.js 15, Xterm.js, Monaco\x1b[0m");
        break;
      case "ls":
        writeln("\x1b[1;34mVirtual filesystem:\x1b[0m");
        files.forEach((f) => writeln(`  \x1b[1;32m${f.name}\x1b[0m`));
        break;
      case "cat": {
        const f = getFile(arg);
        if (!f) { writeln(`\x1b[31mFile not found: ${arg}\x1b[0m`); break; }
        writeln(`\x1b[90m--- ${f.name} ---\x1b[0m`);
        f.content.split("\n").forEach((l) => writeln(l));
        break;
      }
      case "write": {
        const fname = arg || "untitled.txt";
        const existing = getFile(fname);
        setEditorFile(existing ?? { name: fname, content: "", language: "plaintext" });
        setTab("editor");
        writeln(`\x1b[1;33mOpening ${fname} in editor…\x1b[0m`);
        break;
      }
      case "search": {
        if (!arg) { writeln("\x1b[31mUsage: search <query>\x1b[0m"); break; }
        writeln(`\x1b[90mSearching: ${arg}…\x1b[0m`);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(arg)}`);
          const data = (await res.json()) as { heading?: string; abstract?: string; answer?: string; error?: string; topics?: Array<{ text: string }> };
          if (data.error) { writeln(`\x1b[31m${data.error}\x1b[0m`); break; }
          if (data.heading) writeln(`\x1b[1;33m${data.heading}\x1b[0m`);
          if (data.answer)  writeln(data.answer);
          if (data.abstract) data.abstract.split("\n").slice(0, 5).forEach((l) => writeln(l));
          if (data.topics?.length) {
            writeln("\x1b[90mRelated:\x1b[0m");
            data.topics.slice(0, 3).forEach((t) => writeln(`  • ${t.text.slice(0, 80)}`));
          }
          if (!data.abstract && !data.answer) writeln("No direct result found.");
        } catch {
          writeln("\x1b[31mSearch failed.\x1b[0m");
        }
        break;
      }
      case "btc": {
        writeln("\x1b[90mFetching latest block…\x1b[0m");
        try {
          const res = await fetch("/api/bitcoin");
          const data = (await res.json()) as { hash: string; height: number; time: number; fallback?: boolean };
          writeln(`\x1b[1;33mBlock  \x1b[0m${data.height.toLocaleString()}${data.fallback ? " (fallback)" : ""}`);
          writeln(`\x1b[1;33mHash   \x1b[0m${data.hash}`);
          writeln(`\x1b[1;33mTime   \x1b[0m${new Date(data.time * 1000).toUTCString()}`);
        } catch {
          writeln("\x1b[31mFailed to fetch BTC data.\x1b[0m");
        }
        break;
      }
      default:
        writeln(`\x1b[31mCommand not found: ${name}\x1b[0m  Type \x1b[1;32mhelp\x1b[0m to see available commands.`);
    }
    prompt();
  }, [files, getFile, writeln, prompt]);

  useEffect(() => {
    if (!termRef.current || xtermRef.current) return;

    const xterm = new XTerm({
      theme: {
        background: "#07070f",
        foreground: "#e2e8f0",
        cursor: "#FFD700",
        selectionBackground: "rgba(255,215,0,0.2)",
      },
      fontFamily: "'Geist Mono', 'Courier New', monospace",
      fontSize: 14,
      cursorBlink: true,
    });

    const fit = new FitAddon();
    xterm.loadAddon(fit);
    xterm.loadAddon(new WebLinksAddon());
    xterm.open(termRef.current);
    fit.fit();
    xtermRef.current = xterm;
    fitRef.current   = fit;

    BOOT_LINES.forEach((l) => xterm.writeln(l));
    xterm.write("\x1b[1;33m∞\x1b[0m \x1b[1;32m~/infinity\x1b[0m $ ");

    xterm.onData((data) => {
      const code = data.charCodeAt(0);
      if (code === 13) {
        // Enter
        xterm.write("\r\n");
        const cmd = lineRef.current;
        lineRef.current = "";
        runCommand(cmd);
      } else if (code === 127) {
        // Backspace
        if (lineRef.current.length > 0) {
          lineRef.current = lineRef.current.slice(0, -1);
          xterm.write("\b \b");
        }
      } else if (code >= 32) {
        lineRef.current += data;
        xterm.write(data);
      }
    });

    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(termRef.current);

    return () => {
      observer.disconnect();
      xterm.dispose();
      xtermRef.current = null;
    };
  }, [runCommand]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gold)" }}>🖥️ Infinity Coder Terminal</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Browser-based terminal + Monaco code editor</p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Terminal tabs">
          {(["terminal", "editor"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
              style={{
                background: tab === t ? "var(--gold)" : "var(--bg-card)",
                color:      tab === t ? "#000" : "var(--text-muted)",
                border:     "1px solid var(--bg-border)",
              }}
            >
              {t === "terminal" ? "🖥️ Terminal" : "📝 Editor"}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: "var(--bg-border)", display: tab === "terminal" ? "block" : "none" }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ background: "rgba(0,0,0,0.4)", borderColor: "var(--bg-border)" }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--red)" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--gold)" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--green)" }} />
          <span className="ml-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>infinity@synapses: ~/infinity</span>
        </div>
        <div ref={termRef} style={{ height: "480px" }} aria-label="Terminal emulator" />
      </div>

      {/* Editor */}
      {tab === "editor" && (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--bg-border)" }}>
          {/* File tabs */}
          <div
            className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto"
            style={{ background: "rgba(0,0,0,0.4)", borderColor: "var(--bg-border)" }}
          >
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => setEditorFile(f)}
                className="px-3 py-1 rounded-t text-xs font-mono whitespace-nowrap transition-all"
                style={{
                  background: editorFile?.name === f.name ? "var(--bg-card)" : "transparent",
                  color: editorFile?.name === f.name ? "var(--gold)" : "var(--text-muted)",
                }}
                aria-label={`Open ${f.name}`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <MonacoEditor
            height="480px"
            language={editorFile?.language ?? "plaintext"}
            value={editorFile?.content ?? ""}
            theme="vs-dark"
            onChange={(val) => {
              if (editorFile && val !== undefined) {
                saveFile(editorFile.name, val);
                setEditorFile((ef) => ef ? { ...ef, content: val } : ef);
              }
            }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 12 },
            }}
          />
        </div>
      )}
    </div>
  );
}
