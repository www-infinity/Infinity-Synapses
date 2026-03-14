"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { RefreshCw, Radio, Volume2, VolumeX } from "lucide-react";

interface Channel {
  id: number;
  emoji: string;
  name: string;
  color: string;
  streamUrl: string;
  description: string;
}

const CHANNELS: Channel[] = [
  { id: 0,  emoji: "��", name: "Jazz",          color: "#b45309", streamUrl: "https://streaming.radio.co/s3f2b345df/listen", description: "Smooth jazz from around the world" },
  { id: 1,  emoji: "🎨", name: "Masterpiece",   color: "#7c3aed", streamUrl: "https://stream.klassikradio.de/klassikradio/mp3-128/stream.mp3", description: "Classical masterpieces" },
  { id: 2,  emoji: "🍄", name: "Police Scanner",color: "#16a34a", streamUrl: "", description: "Public safety comms (simulated)" },
  { id: 3,  emoji: "😎", name: "Cool",           color: "#0284c7", streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", description: "BBC Radio 1 — Cool & current" },
  { id: 4,  emoji: "🛸", name: "Alien",          color: "#a21caf", streamUrl: "", description: "Electroacoustic & otherworldly soundscapes" },
  { id: 5,  emoji: "👌", name: "Top Notch",      color: "#FFD700", streamUrl: "https://icecast.omroep.nl/radio2-bb-mp3", description: "Top notch hits" },
  { id: 6,  emoji: "⭐", name: "Trendy",         color: "#f97316", streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_1xtra", description: "BBC 1Xtra — Latest trends" },
  { id: 7,  emoji: "💃", name: "Dance",          color: "#ec4899", streamUrl: "https://streaming.radio.co/s3f2b345df/listen", description: "Non-stop dance floor" },
  { id: 8,  emoji: "♥️", name: "Love",           color: "#ef4444", streamUrl: "", description: "Love songs & slow jams" },
  { id: 9,  emoji: "🧱", name: "Military Comms", color: "#64748b", streamUrl: "", description: "Military band & march music" },
  { id: 10, emoji: "🟨", name: "News",           color: "#ca8a04", streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service", description: "BBC World Service" },
  { id: 11, emoji: "🟦", name: "Conversation",   color: "#2563eb", streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm", description: "BBC Radio 4 — Talk & conversation" },
  { id: 12, emoji: "🟥", name: "Shortwave",      color: "#dc2626", streamUrl: "", description: "Shortwave noise floor simulation" },
  { id: 13, emoji: "🟪", name: "FM",             color: "#9333ea", streamUrl: "https://icecast.omroep.nl/3fm-bb-mp3", description: "3FM — Classic FM broadcast" },
  { id: 14, emoji: "🟩", name: "AM",             color: "#16a34a", streamUrl: "", description: "AM band simulation" },
  { id: 15, emoji: "⬜", name: "Digital Live",   color: "#94a3b8", streamUrl: "", description: "Live Bitcoin transaction sonification" },
];

interface BtcData { hash: string; height: number; time: number; fallback?: boolean }

function channelFromHash(hash: string): number {
  const bigVal = BigInt("0x" + hash.slice(0, 16));
  return Number(bigVal % BigInt(CHANNELS.length));
}

export default function RadioPage() {
  const [btc, setBtc]               = useState<BtcData | null>(null);
  const [channel, setChannel]       = useState<Channel | null>(null);
  const [loading, setLoading]       = useState(false);
  const [spinning, setSpinning]     = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [muted, setMuted]           = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const spin = useCallback(async () => {
    setSpinning(true);
    setLoading(true);
    setError(null);
    setPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }

    try {
      const res = await fetch("/api/bitcoin");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as BtcData;
      setBtc(data);
      const idx = channelFromHash(data.hash);
      setChannel(CHANNELS[idx]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch BTC block");
    } finally {
      setLoading(false);
      setTimeout(() => setSpinning(false), 600);
    }
  }, []);

  useEffect(() => { spin(); }, [spin]);

  const playStream = useCallback(() => {
    if (!channel?.streamUrl) return;
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(channel.streamUrl);
    audio.muted = muted;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlaying(true);
  }, [channel, muted]);

  const stopStream = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gold)" }}>
        📻 Bitcoin Crusher Radio
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        Live BTC block hash → entropy → channel selection. Every block is a new station.
      </p>

      {/* Crusher panel */}
      <div
        className="rounded-2xl border p-6 mb-8 glow-gold"
        style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Spinning selector */}
          <div className="flex-1 text-center">
            <div
              className={`text-8xl mb-2 transition-all duration-500 ${spinning ? "spin-slow" : ""}`}
              aria-live="polite"
              aria-label={`Current channel: ${channel?.name ?? "loading"}`}
            >
              {spinning ? "🎰" : (channel?.emoji ?? "📻")}
            </div>
            <div className="text-2xl font-bold" style={{ color: channel?.color ?? "var(--gold)" }}>
              {channel?.name ?? "—"}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {channel?.description ?? "Spinning…"}
            </div>
          </div>

          {/* BTC info */}
          <div className="flex-1 font-mono text-xs space-y-2" style={{ color: "var(--text-muted)" }}>
            {btc ? (
              <>
                <div>
                  <span style={{ color: "var(--gold)" }}>BLOCK </span>
                  {btc.height.toLocaleString()}
                  {btc.fallback && <span className="ml-2 text-yellow-500">(fallback)</span>}
                </div>
                <div className="break-all">
                  <span style={{ color: "var(--gold)" }}>HASH  </span>
                  <span className="break-all">{btc.hash}</span>
                </div>
                <div>
                  <span style={{ color: "var(--gold)" }}>TIME  </span>
                  {new Date(btc.time * 1000).toUTCString()}
                </div>
                <div>
                  <span style={{ color: "var(--gold)" }}>CHAN  </span>
                  Ch {channel?.id ?? "?"} / {CHANNELS.length}
                </div>
              </>
            ) : (
              <div className="pulse-gold" style={{ color: "var(--gold)" }}>Fetching block…</div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.3)" }}>
            {error}
          </div>
        )}

        {/* Visualizer */}
        {playing && (
          <div className="mt-4 flex items-end justify-center gap-1 h-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 rounded-t bar${(i % 5) + 1}`}
                style={{ background: channel?.color ?? "var(--gold)", minHeight: "4px" }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={spin}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
            style={{ background: "var(--gold)", color: "#000" }}
            aria-label="Spin for new channel"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Spinning…" : "Crush & Spin"}
          </button>

          {channel?.streamUrl && (
            <>
              <button
                onClick={playing ? stopStream : playStream}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
                style={{
                  background: playing ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                  color: playing ? "var(--red)" : "var(--green)",
                  border: `1px solid ${playing ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                }}
                aria-label={playing ? "Stop stream" : "Play stream"}
              >
                <Radio size={16} />
                {playing ? "Stop" : "Play Stream"}
              </button>
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* All Channels Grid */}
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>All Channels</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setChannel(ch)}
            className="p-3 rounded-xl border text-center transition-all hover:scale-105"
            style={{
              background: channel?.id === ch.id ? "rgba(255,215,0,0.08)" : "var(--bg-card)",
              borderColor: channel?.id === ch.id ? ch.color : "var(--bg-border)",
            }}
            aria-label={`Select ${ch.name} channel`}
            aria-pressed={channel?.id === ch.id}
          >
            <div className="text-2xl mb-1">{ch.emoji}</div>
            <div className="text-xs truncate" style={{ color: ch.color }}>{ch.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
