"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Grid, Layout } from "lucide-react";

interface GalleryItem {
  id: number;
  title: string;
  emoji: string;
  src: string;
  tag: string;
  color: string;
}

// Using picsum for demo images
const ITEMS: GalleryItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  title: `Infinity Frame ${i + 1}`,
  emoji: ["🌌","��","💫","⚡","🌊","🔥","🌿","🎆","🌈","🏔️","🌅","🎇"][i % 12],
  src: `https://picsum.photos/seed/${i + 10}/400/300`,
  tag: ["cosmos","neural","energy","data","flow","spark"][i % 6],
  color: ["var(--gold)","var(--cyan)","var(--purple)","var(--green)","#f97316","#ec4899"][i % 6],
}));

const TAGS = ["all", "cosmos", "neural", "energy", "data", "flow", "spark"];

export default function GalleryPage() {
  const [filter, setFilter]     = useState("all");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [layout, setLayout]     = useState<"grid" | "masonry">("grid");

  const filtered = filter === "all" ? ITEMS : ITEMS.filter((i) => i.tag === filter);

  const openLightbox = useCallback((item: GalleryItem) => setLightbox(item), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const navigate = useCallback((dir: "prev" | "next") => {
    if (!lightbox) return;
    const idx = filtered.findIndex((i) => i.id === lightbox.id);
    const next = dir === "next" ? (idx + 1) % filtered.length : (idx - 1 + filtered.length) % filtered.length;
    setLightbox(filtered[next]);
  }, [lightbox, filtered]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--gold)" }}>🖼️ Gallery</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{filtered.length} images</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLayout("grid")} aria-label="Grid layout" aria-pressed={layout === "grid"}
            className="p-2 rounded-lg transition-all" style={{ background: layout === "grid" ? "rgba(255,215,0,0.1)" : "var(--bg-card)", color: layout === "grid" ? "var(--gold)" : "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
            <Grid size={16} />
          </button>
          <button onClick={() => setLayout("masonry")} aria-label="Masonry layout" aria-pressed={layout === "masonry"}
            className="p-2 rounded-lg transition-all" style={{ background: layout === "masonry" ? "rgba(255,215,0,0.1)" : "var(--bg-card)", color: layout === "masonry" ? "var(--gold)" : "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
            <Layout size={16} />
          </button>
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by tag">
        {TAGS.map((t) => (
          <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t}
            className="px-3 py-1 rounded-full text-sm font-medium capitalize transition-all"
            style={{ background: filter === t ? "var(--gold)" : "var(--bg-card)", color: filter === t ? "#000" : "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={`grid gap-3 ${layout === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => openLightbox(item)}
            className="group relative rounded-xl overflow-hidden aspect-square transition-transform hover:scale-105"
            style={{ border: "1px solid var(--bg-border)" }}
            aria-label={`View ${item.title}`}
          >
            <Image src={item.src} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center"
              style={{ background: "rgba(7,7,15,0.7)" }}>
              <span className="text-3xl mb-1">{item.emoji}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: item.color, color: "#000" }}>{item.tag}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer: ${lightbox.title}`}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            aria-label="Close lightbox"
          >
            <X size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate("prev"); }}
            className="absolute left-4 p-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="relative max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox.src} alt={lightbox.title} width={800} height={600} className="object-contain" />
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{lightbox.emoji}</span>
                <span className="font-semibold text-sm" style={{ color: lightbox.color }}>{lightbox.title}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: lightbox.color, color: "#000" }}>{lightbox.tag}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate("next"); }}
            className="absolute right-4 p-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
