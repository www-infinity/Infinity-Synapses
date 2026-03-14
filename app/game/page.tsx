"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";

interface Coin {
  id: number;
  x: number;
  y: number;
  emoji: string;
  value: number;
  collected: boolean;
  rare: boolean;
}

interface ResearchArticle {
  id: number;
  title: string;
  abstract: string;
  token: string;
  collected: number;
}

const COIN_EMOJIS = ["🪙","💰","💎","⭐","🟡","🏆"];
const RESEARCH_POOL: Omit<ResearchArticle, "id" | "collected">[] = [
  { title: "Bitcoin Proof-of-Work Consensus",  abstract: "Nakamoto's original 2008 paper: a peer-to-peer electronic cash system using cryptographic proof.", token: "BTC-POW-001" },
  { title: "Blockchain Immutability",           abstract: "How hash-linking of blocks creates a tamper-evident ledger resistant to retroactive modification.", token: "CHAIN-IMM-002" },
  { title: "Lightning Network Channels",        abstract: "Off-chain payment channels that enable instant, low-fee Bitcoin micropayments at scale.", token: "LN-CHAN-003" },
  { title: "Merkle Trees in Cryptography",      abstract: "Binary hash trees used to efficiently verify large datasets — the backbone of blockchain integrity.", token: "MRKL-004" },
  { title: "Elliptic Curve Digital Signatures", abstract: "ECDSA: how Bitcoin wallets sign transactions to prove ownership without revealing private keys.", token: "ECDSA-005" },
  { title: "Proof-of-Stake Consensus",          abstract: "Energy-efficient alternative to PoW where validators stake tokens to earn block rewards.", token: "POS-006" },
  { title: "Zero-Knowledge Proofs",             abstract: "Cryptographic method to prove knowledge of a value without revealing the value itself.", token: "ZKP-007" },
  { title: "Hash Functions: SHA-256",           abstract: "How SHA-256 transforms arbitrary data into a fixed 256-bit digest used throughout Bitcoin.", token: "SHA256-008" },
];

const GRID = { cols: 10, rows: 8, cellSize: 60 };

function randomCoins(): Coin[] {
  const coins: Coin[] = [];
  const used = new Set<string>();
  let id = 0;
  const count = 12 + Math.floor(Math.random() * 6);
  while (coins.length < count) {
    const x = Math.floor(Math.random() * GRID.cols);
    const y = Math.floor(Math.random() * GRID.rows);
    const key = `${x},${y}`;
    if (used.has(key)) continue;
    used.add(key);
    const rare = Math.random() < 0.12;
    coins.push({
      id: ++id,
      x, y,
      emoji: rare ? "💎" : COIN_EMOJIS[Math.floor(Math.random() * (COIN_EMOJIS.length - 1))],
      value: rare ? 10 : 1,
      collected: false,
      rare,
    });
  }
  return coins;
}

export default function GamePage() {
  const [coins, setCoins]         = useState<Coin[]>(() => randomCoins());
  const [score, setScore]         = useState(0);
  const [articles, setArticles]   = useState<ResearchArticle[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver]   = useState(false);
  const [moves, setMoves]         = useState(40);
  const articlePool = useRef<typeof RESEARCH_POOL>([...RESEARCH_POOL]);
  const artId = useRef(0);

  const init = useCallback(() => {
    setCoins(randomCoins());
    setScore(0);
    setArticles([]);
    setPlayerPos({ x: 0, y: 0 });
    setGameOver(false);
    setMoves(40);
    articlePool.current = [...RESEARCH_POOL];
    artId.current = 0;
  }, []);

  const collectCoinsAt = useCallback((x: number, y: number) => {
    setCoins((cs) => {
      let gained = 0;
      let rareFound = false;
      const next = cs.map((c) => {
        if (c.x === x && c.y === y && !c.collected) {
          gained += c.value;
          if (c.rare) rareFound = true;
          return { ...c, collected: true };
        }
        return c;
      });
      if (gained > 0) {
        setScore((s) => s + gained);
        if (rareFound && articlePool.current.length > 0) {
          const art = articlePool.current.shift()!;
          setArticles((as) => [...as, { ...art, id: ++artId.current, collected: score + gained }]);
        }
      }
      return next;
    });
  }, [score]);

  const move = useCallback((dx: number, dy: number) => {
    if (gameOver) return;
    setPlayerPos((p) => {
      const nx = Math.max(0, Math.min(GRID.cols - 1, p.x + dx));
      const ny = Math.max(0, Math.min(GRID.rows - 1, p.y + dy));
      if (nx === p.x && ny === p.y) return p;
      collectCoinsAt(nx, ny);
      setMoves((m) => {
        const nm = m - 1;
        if (nm <= 0) setGameOver(true);
        return Math.max(0, nm);
      });
      return { x: nx, y: ny };
    });
  }, [gameOver, collectCoinsAt]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp"    || e.key === "w") { e.preventDefault(); move(0, -1); }
      if (e.key === "ArrowDown"  || e.key === "s") { e.preventDefault(); move(0, 1); }
      if (e.key === "ArrowLeft"  || e.key === "a") { e.preventDefault(); move(-1, 0); }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); move(1, 0); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const remaining = coins.filter((c) => !c.collected).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--gold)" }}>🎮 BTC Coin Collector</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Collect 💎 rare coins to unlock token research articles. Use arrow keys or buttons.
          </p>
        </div>
        <button onClick={init} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--gold)", color: "#000" }} aria-label="Restart game">
          <RefreshCw size={14} /> New Game
        </button>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Score", value: score, color: "var(--gold)" },
          { label: "Moves Left", value: moves, color: moves < 10 ? "var(--red)" : "var(--green)" },
          { label: "Coins Left", value: remaining, color: "var(--cyan)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center border" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Game Grid */}
      <div
        className="rounded-xl border overflow-hidden mb-4 touch-none select-none"
        style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}
        role="application"
        aria-label="Game grid"
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID.cols}, ${GRID.cellSize}px)`, gap: 1, padding: 4 }}>
          {Array.from({ length: GRID.rows }).map((_, row) =>
            Array.from({ length: GRID.cols }).map((_, col) => {
              const isPlayer = playerPos.x === col && playerPos.y === row;
              const coin = coins.find((c) => c.x === col && c.y === row && !c.collected);
              return (
                <div
                  key={`${col}-${row}`}
                  style={{
                    width: GRID.cellSize - 2,
                    height: GRID.cellSize - 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    fontSize: isPlayer ? 22 : 18,
                    background: isPlayer ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.02)",
                    border: isPlayer ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {isPlayer ? "😎" : coin ? coin.emoji : ""}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* D-Pad controls */}
      <div className="flex flex-col items-center gap-1 mb-6">
        <button onClick={() => move(0, -1)} className="w-12 h-12 rounded-xl text-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }} aria-label="Move up">▲</button>
        <div className="flex gap-1">
          <button onClick={() => move(-1, 0)} className="w-12 h-12 rounded-xl text-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }} aria-label="Move left">◀</button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid var(--bg-border)" }}>😎</div>
          <button onClick={() => move(1, 0)} className="w-12 h-12 rounded-xl text-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }} aria-label="Move right">▶</button>
        </div>
        <button onClick={() => move(0, 1)} className="w-12 h-12 rounded-xl text-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }} aria-label="Move down">▼</button>
      </div>

      {/* Game over */}
      {gameOver && (
        <div className="rounded-xl border p-6 text-center mb-6" style={{ background: "rgba(255,215,0,0.05)", borderColor: "rgba(255,215,0,0.3)" }}>
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-2xl font-bold mb-1" style={{ color: "var(--gold)" }}>Game Over! Score: {score}</div>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>You collected {articles.length} research article{articles.length !== 1 ? "s" : ""}.</p>
          <button onClick={init} className="px-6 py-2 rounded-xl font-semibold" style={{ background: "var(--gold)", color: "#000" }}>Play Again</button>
        </div>
      )}

      {/* Research articles */}
      {articles.length > 0 && (
        <div>
          <h2 className="font-bold mb-3" style={{ color: "var(--gold)" }}>🔬 Collected Research Articles ({articles.length})</h2>
          <div className="space-y-3">
            {articles.map((a) => (
              <div key={a.id} className="rounded-xl border p-4 slide-in" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">��</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1" style={{ color: "var(--gold)" }}>{a.title}</div>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{a.abstract}</p>
                    <div className="mt-2 font-mono text-xs px-2 py-1 rounded inline-block" style={{ background: "rgba(255,215,0,0.1)", color: "var(--gold)" }}>
                      TOKEN: {a.token}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
