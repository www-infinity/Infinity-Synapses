"use client";
import { useState, useCallback } from "react";
import NextImage from "next/image";
import { Plus, Trash2, MoveUp, MoveDown, Eye, Code2, Type, Image as ImageIcon, SquareCode, Columns } from "lucide-react";

type BlockType = "heading" | "text" | "image" | "code" | "columns" | "divider";

interface Block {
  id: number;
  type: BlockType;
  content: string;
  meta?: string;
}

let bId = 0;

const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: React.ReactNode; default: string }> = [
  { type: "heading",  label: "Heading",  icon: <Type size={14} />,       default: "New Heading" },
  { type: "text",     label: "Text",     icon: <Type size={14} />,       default: "Add your text here…" },
  { type: "image",    label: "Image",    icon: <ImageIcon size={14} />,  default: "https://picsum.photos/800/400" },
  { type: "code",     label: "Code",     icon: <SquareCode size={14} />, default: 'console.log("Hello, Infinity!");' },
  { type: "columns",  label: "Columns",  icon: <Columns size={14} />,    default: "Left column content|Right column content" },
  { type: "divider",  label: "Divider",  icon: <span>—</span>,           default: "" },
];

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":  return <h2 className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{block.content}</h2>;
    case "text":     return <p className="leading-relaxed" style={{ color: "var(--text)" }}>{block.content}</p>;
    case "image":    return <NextImage src={block.content} alt="builder block" width={800} height={256} className="w-full rounded-xl object-cover max-h-64" unoptimized />;
    case "code":     return <pre className="p-4 rounded-xl text-sm overflow-x-auto font-mono" style={{ background: "rgba(0,0,0,0.4)", color: "var(--cyan)" }}>{block.content}</pre>;
    case "columns": {
      const [left, right] = block.content.split("|");
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid var(--bg-border)" }}>{left}</div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid var(--bg-border)" }}>{right}</div>
        </div>
      );
    }
    case "divider":  return <hr style={{ borderColor: "var(--bg-border)" }} />;
    default:         return null;
  }
}

export default function BuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: ++bId, type: "heading", content: "My Infinity Page" },
    { id: ++bId, type: "text",    content: "Start building your world. Add blocks below." },
  ]);
  const [editing, setEditing]   = useState<number | null>(null);
  const [preview, setPreview]   = useState(false);
  const [showCode, setShowCode] = useState(false);

  const addBlock = useCallback((type: BlockType, def: string) => {
    setBlocks((bs) => [...bs, { id: ++bId, type, content: def }]);
  }, []);

  const removeBlock = useCallback((id: number) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: number, dir: "up" | "down") => {
    setBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      if (idx < 0) return bs;
      const next = [...bs];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return bs;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const updateContent = useCallback((id: number, value: string) => {
    setBlocks((bs) => bs.map((b) => b.id === id ? { ...b, content: value } : b));
  }, []);

  const exportHtml = blocks.map((b) => {
    switch (b.type) {
      case "heading": return `<h2>${b.content}</h2>`;
      case "text":    return `<p>${b.content}</p>`;
      case "image":   return `<img src="${b.content}" alt="" />`;
      case "code":    return `<pre><code>${b.content}</code></pre>`;
      case "divider": return `<hr />`;
      case "columns": { const [l,r]=b.content.split("|"); return `<div class="cols"><div>${l}</div><div>${r}</div></div>`; }
      default:        return "";
    }
  }).join("\n");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--gold)" }}>🧱 Builder</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Drag-and-drop-style page builder — add blocks, preview, export</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPreview(!preview); setShowCode(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: preview ? "var(--gold)" : "var(--bg-card)", color: preview ? "#000" : "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
            <Eye size={14} /> Preview
          </button>
          <button onClick={() => { setShowCode(!showCode); setPreview(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: showCode ? "var(--cyan)" : "var(--bg-card)", color: showCode ? "#000" : "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
            <Code2 size={14} /> Export HTML
          </button>
        </div>
      </div>

      {showCode ? (
        <pre className="p-4 rounded-xl text-xs overflow-x-auto font-mono" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--cyan)" }}>
          {exportHtml}
        </pre>
      ) : (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Canvas */}
          <div className="space-y-3" role="list" aria-label="Page builder blocks">
            {blocks.length === 0 && (
              <div className="text-center py-16 rounded-xl" style={{ border: "2px dashed var(--bg-border)", color: "var(--text-muted)" }}>
                No blocks yet — add one from the panel →
              </div>
            )}
            {blocks.map((block, i) => (
              <div
                key={block.id}
                className="rounded-xl border transition-all"
                role="listitem"
                style={{ background: preview ? "transparent" : "var(--bg-card)", borderColor: editing === block.id ? "var(--gold)" : "var(--bg-border)" }}
              >
                {!preview && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--bg-border)" }}>
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "rgba(255,215,0,0.1)", color: "var(--gold)" }}>
                      {block.type}
                    </span>
                    <div className="flex-1" />
                    <button onClick={() => moveBlock(block.id, "up")} disabled={i === 0} className="p-1 disabled:opacity-30" aria-label="Move block up"><MoveUp size={12} /></button>
                    <button onClick={() => moveBlock(block.id, "down")} disabled={i === blocks.length - 1} className="p-1 disabled:opacity-30" aria-label="Move block down"><MoveDown size={12} /></button>
                    <button onClick={() => setEditing(editing === block.id ? null : block.id)} className="p-1" style={{ color: editing === block.id ? "var(--gold)" : "var(--text-muted)" }} aria-label="Edit block">✏️</button>
                    <button onClick={() => removeBlock(block.id)} className="p-1" style={{ color: "var(--red)" }} aria-label="Delete block"><Trash2 size={12} /></button>
                  </div>
                )}
                <div className="p-4">
                  {editing === block.id && !preview ? (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateContent(block.id, e.target.value)}
                      className="w-full p-2 rounded-lg text-sm font-mono resize-y min-h-[60px] focus:outline-none"
                      style={{ background: "rgba(0,0,0,0.3)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
                      aria-label={`Edit ${block.type} block content`}
                    />
                  ) : (
                    <BlockRenderer block={block} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Block panel */}
          <div className="rounded-xl border p-4 h-fit sticky top-20" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
            <h2 className="font-semibold mb-3 text-sm" style={{ color: "var(--gold)" }}>Add Block</h2>
            <div className="space-y-2">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type, bt.default)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(255,255,255,0.03)", color: "var(--text)", border: "1px solid var(--bg-border)" }}
                  aria-label={`Add ${bt.label} block`}
                >
                  <span style={{ color: "var(--gold)" }}>{bt.icon}</span>
                  <Plus size={12} className="opacity-50" />
                  {bt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
