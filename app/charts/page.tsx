"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface BtcBlock { hash: string; height: number; time: number; fallback?: boolean }
interface PricePoint { time: string; price: number; volume: number }

// Simulate BTC price history seeded from block hash
function generatePriceHistory(seed: string, points = 24): PricePoint[] {
  const base = 60000 + (parseInt(seed.slice(0, 8), 16) % 20000);
  const result: PricePoint[] = [];
  let price = base;
  for (let i = points - 1; i >= 0; i--) {
    const noise = (parseInt(seed.slice(i % 40, (i % 40) + 4), 16) % 2000) - 1000;
    price = Math.max(40000, price + noise);
    const hour = new Date(Date.now() - i * 3600000);
    result.push({
      time: hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: Math.round(price),
      volume: Math.round(100 + (parseInt(seed.slice((i * 2) % 50, (i * 2) % 50 + 4), 16) % 500)),
    });
  }
  return result;
}

const TRENDING_TOPICS = [
  { topic: "Bitcoin ETF", score: 94, change: 12 },
  { topic: "AI Research",  score: 87, change:  8 },
  { topic: "Web3 Wallets", score: 76, change: -3 },
  { topic: "Infinity AI",  score: 71, change: 21 },
  { topic: "Blockchain",   score: 65, change:  5 },
  { topic: "DeFi Yield",   score: 58, change: -7 },
  { topic: "NFT Market",   score: 44, change: -15},
  { topic: "DAO Governance",score: 38, change:  2 },
];

export default function ChartsPage() {
  const [btc, setBtc]         = useState<BtcBlock | null>(null);
  const [prices, setPrices]   = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://blockchain.info/latestblock", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await res.json()) as BtcBlock;
      setBtc(data);
      setPrices(generatePriceHistory(data.hash));
    } catch {
      const fallback = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setPrices(generatePriceHistory(fallback));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const latest   = prices[prices.length - 1];
  const previous = prices[prices.length - 2];
  const priceChange = latest && previous ? latest.price - previous.price : 0;
  const maxPrice = Math.max(...prices.map((p) => p.price), 1);
  const minPrice = Math.min(...prices.map((p) => p.price));
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...prices.map((p) => p.volume), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--gold)" }}>📊 Charts & Data</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Bitcoin data seeded from live block hash</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--gold)", color: "#000" }}
          aria-label="Refresh data">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "BTC Price",   value: `$${latest.price.toLocaleString()}`, color: "var(--gold)" },
            { label: "1H Change",   value: `${priceChange >= 0 ? "+" : ""}$${priceChange.toLocaleString()}`, color: priceChange >= 0 ? "var(--green)" : "var(--red)" },
            { label: "Block",       value: btc ? `#${btc.height.toLocaleString()}` : "—", color: "var(--cyan)" },
            { label: "24H Volume",  value: prices.reduce((s, p) => s + p.volume, 0).toLocaleString(), color: "var(--purple)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Price chart */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          {priceChange >= 0 ? <TrendingUp size={16} style={{ color: "var(--green)" }} /> : <TrendingDown size={16} style={{ color: "var(--red)" }} />}
          <h2 className="font-semibold text-sm">BTC Price (24H)</h2>
        </div>
        <div className="relative overflow-x-auto">
          <div className="flex items-end gap-0.5 h-48 min-w-[480px]" role="img" aria-label="BTC price chart">
            {prices.map((p, i) => {
              const h = ((p.price - minPrice) / priceRange) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-all group relative"
                  style={{ height: `${Math.max(h, 2)}%`, background: priceChange >= 0 ? "var(--green)" : "var(--red)", opacity: 0.7 + (i / prices.length) * 0.3 }}
                  title={`${p.time}: $${p.price.toLocaleString()}`}
                />
              );
            })}
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between mt-1">
            {[0, 6, 12, 18, 23].map((i) => (
              <span key={i} className="text-xs" style={{ color: "var(--text-muted)" }}>
                {prices[i]?.time ?? ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Volume bars */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <h2 className="font-semibold text-sm mb-4">Trading Volume (24H)</h2>
        <div className="flex items-end gap-0.5 h-24 overflow-x-auto">
          {prices.map((p, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${(p.volume / maxVolume) * 100}%`, background: "var(--cyan)", opacity: 0.5 + (i / prices.length) * 0.5 }}
              title={`${p.time}: ${p.volume} BTC`}
            />
          ))}
        </div>
      </div>

      {/* Trending topics */}
      <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--bg-border)" }}>
        <h2 className="font-semibold text-sm mb-4">⭐ Trending Topics</h2>
        <div className="space-y-3">
          {TRENDING_TOPICS.map((t, i) => (
            <div key={t.topic} className="flex items-center gap-3">
              <span className="text-xs w-5 text-right font-mono" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{t.topic}</span>
                  <div className="flex items-center gap-1 text-xs" style={{ color: t.change >= 0 ? "var(--green)" : "var(--red)" }}>
                    {t.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {t.change > 0 ? "+" : ""}{t.change}%
                  </div>
                </div>
                <div className="rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", height: 6 }}>
                  <div className="h-full rounded-full" style={{ width: `${t.score}%`, background: i < 3 ? "var(--gold)" : "var(--cyan)" }} />
                </div>
              </div>
              <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--text-muted)" }}>{t.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
