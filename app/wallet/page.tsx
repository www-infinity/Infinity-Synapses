"use client";
import { useState, useCallback, useEffect } from "react";
import { Wallet, LogIn, LogOut, RefreshCw, Copy, Check, Shield, Zap } from "lucide-react";

interface WalletIdentity {
  address: string;
  shortId: string;
  entropy: string;
  blockHeight: number;
  blockHash: string;
  createdAt: number;
}

/** Derive a deterministic Bitcoin-style address from a block hash + nonce */
function deriveAddress(hash: string, nonce: string): string {
  // Combine hash and nonce into a hex string, then encode as a compact Base58-like ID.
  // The character set intentionally omits 0, O, I, l to avoid visual confusion (Base58 convention).
  const combined = hash + nonce;
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "bc1q";
  for (let i = 0; i < 38; i++) {
    const code = combined.charCodeAt(i % combined.length) ^ combined.charCodeAt((i * 7) % combined.length);
    result += chars[code % chars.length];
  }
  return result;
}

/** Deterministic short ID for display */
function deriveShortId(hash: string): string {
  const emojis = ["⚡", "🔮", "🌊", "🔥", "💎", "🌙", "⭐", "🧲"];
  const a = parseInt(hash.slice(0, 4), 16) % emojis.length;
  const b = parseInt(hash.slice(4, 8), 16) % emojis.length;
  const hex = hash.slice(0, 8).toUpperCase();
  return `${emojis[a]}${emojis[b]} ${hex}`;
}

const STORAGE_KEY = "infinity_wallet_identity";

export default function WalletPage() {
  const [identity, setIdentity] = useState<WalletIdentity | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce] = useState(() => {
    // Use cryptographically secure randomness for the per-session nonce
    const buf = new Uint8Array(8);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  });

  // Load saved identity on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WalletIdentity;
        setIdentity(parsed);
        setSignedIn(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://blockchain.info/latestblock", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`BTC fetch failed: ${res.status}`);
      const block = (await res.json()) as { hash: string; height: number; time: number };

      const id: WalletIdentity = {
        address: deriveAddress(block.hash, nonce),
        shortId: deriveShortId(block.hash),
        entropy: block.hash.slice(0, 16) + "…",
        blockHeight: block.height,
        blockHash: block.hash,
        createdAt: Date.now(),
      };
      setIdentity(id);
      setSignedIn(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
    } catch (e) {
      // Fallback: use random entropy
      const fallbackHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      const id: WalletIdentity = {
        address: deriveAddress(fallbackHash, nonce),
        shortId: deriveShortId(fallbackHash),
        entropy: fallbackHash.slice(0, 16) + "… (offline)",
        blockHeight: 0,
        blockHash: fallbackHash,
        createdAt: Date.now(),
      };
      setIdentity(id);
      setSignedIn(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
      setError(e instanceof Error ? `${e.message} — offline identity generated` : "Offline mode");
    } finally {
      setLoading(false);
    }
  }, [nonce]);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentity(null);
    setSignedIn(false);
    setError(null);
  }, []);

  const copyAddress = useCallback(() => {
    if (!identity) return;
    navigator.clipboard.writeText(identity.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [identity]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: "var(--gold)" }}>
        <Wallet size={28} /> Bitcoin Crusher Wallet
      </h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        Identity derived from live Bitcoin block entropy — no seed phrase, no password. Your address is
        minted from the blockchain.
      </p>

      {error && (
        <div
          className="mb-6 p-3 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.08)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          {error}
        </div>
      )}

      {!signedIn ? (
        /* ── Sign-in Panel ── */
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
        >
          <div className="text-7xl mb-6">🔑</div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--gold)" }}>
            Connect with Bitcoin Entropy
          </h2>
          <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            We fetch the latest Bitcoin block hash and derive a unique identity for you — no account
            required, no data stored on our servers.
          </p>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base transition-all"
            style={{ background: "var(--gold)", color: "#000" }}
            aria-label="Connect wallet"
          >
            {loading ? (
              <><RefreshCw size={18} className="animate-spin" /> Syncing with blockchain…</>
            ) : (
              <><LogIn size={18} /> Sign In with Bitcoin Crusher</>
            )}
          </button>
          <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
            <Shield size={12} className="inline mr-1" />
            Non-custodial · read-only · entropy only
          </p>
        </div>
      ) : (
        /* ── Wallet Panel ── */
        <div className="space-y-4">
          {/* Identity card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-2xl font-bold mb-1" style={{ color: "var(--gold)" }}>
                  {identity?.shortId}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Connected · Bitcoin Crusher Wallet
                </div>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <Zap size={10} /> Live
              </span>
            </div>

            {/* Address */}
            <div className="mb-5">
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Address</div>
              <div
                className="flex items-center gap-2 p-3 rounded-xl font-mono text-xs break-all"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--bg-border)" }}
              >
                <span style={{ color: "var(--cyan)", flex: 1 }}>{identity?.address}</span>
                <button
                  onClick={copyAddress}
                  className="shrink-0 p-1 rounded"
                  style={{ color: copied ? "var(--green)" : "var(--text-muted)" }}
                  aria-label="Copy address"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Block info */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid var(--bg-border)" }}>
                <div style={{ color: "var(--gold)" }}>BLOCK HEIGHT</div>
                <div style={{ color: "var(--text)" }}>{identity?.blockHeight.toLocaleString() || "—"}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid var(--bg-border)" }}>
                <div style={{ color: "var(--gold)" }}>ENTROPY SOURCE</div>
                <div style={{ color: "var(--text)" }} className="truncate">{identity?.entropy}</div>
              </div>
              <div className="p-3 rounded-xl col-span-2" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid var(--bg-border)" }}>
                <div style={{ color: "var(--gold)" }}>CONNECTED AT</div>
                <div style={{ color: "var(--text)" }}>
                  {identity ? new Date(identity.createdAt).toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={connectWallet}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(255,215,0,0.08)", color: "var(--gold)", border: "1px solid rgba(255,215,0,0.2)" }}
              aria-label="Refresh wallet identity"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Identity
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(239,68,68,0.08)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}
              aria-label="Sign out"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          <p className="text-xs pt-2" style={{ color: "var(--text-muted)" }}>
            <Shield size={11} className="inline mr-1" />
            Identity stored locally only · sourced from Bitcoin block #{identity?.blockHeight.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
