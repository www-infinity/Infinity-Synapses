import Link from "next/link";

interface HubCard {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  color: string;
}

const cards: HubCard[] = [
  { href: "/radio",    emoji: "📻", title: "Bitcoin Crusher Radio", desc: "Entropy-driven channel selection via live BTC block hash. Spins to playable stations only.", color: "var(--gold)" },
  { href: "/wallet",   emoji: "💳", title: "Wallet & Sign In",      desc: "Bitcoin-entropy identity. Connect with a live block hash — no password, no seed phrase.", color: "var(--cyan)" },
  { href: "/chat",     emoji: "😎", title: "AI Chat",               desc: "Real conversation backed by DuckDuckGo live search, reasoned into responses.", color: "var(--cyan)" },
  { href: "/research", emoji: "✍️", title: "Research Writer",       desc: "Draft structured research documents from live web sources. Outline, write, copy.", color: "var(--purple)" },
  { href: "/terminal", emoji: "🖥️", title: "Infinity Coder Terminal",desc: "Browser-based terminal + Monaco code editor. Your Termux in the browser.", color: "var(--purple)" },
  { href: "/gallery",  emoji: "🖼️", title: "Gallery",               desc: "Dynamic image gallery. Navigate freely through visual worlds.", color: "#f97316" },
  { href: "/builder",  emoji: "🧱", title: "Builder",               desc: "Drag-and-drop page builder. Throw up a site inside your pages instantly.", color: "var(--green)" },
  { href: "/bots",     emoji: "🤖", title: "Bot Spawner",           desc: "Spawn watcher, writer, and repair bots. Manifest new designs automatically.", color: "#ec4899" },
  { href: "/phone",    emoji: "📞", title: "Hydrogen Host",         desc: "Emoji-block device identifiers. P2P calls without traditional phone numbers.", color: "var(--cyan)" },
  { href: "/game",     emoji: "🎮", title: "BTC Coin Game",         desc: "Collect coins, each prints a token research article. Hard to find, high value.", color: "var(--gold)" },
  { href: "/tokens",   emoji: "🟡", title: "Token Studio",          desc: "Mint research tokens backed by real content. Soban AI gates quality.", color: "#FFD700" },
  { href: "/charts",   emoji: "📊", title: "Charts & Data",         desc: "Live BTC price, trending topics, research visualizations.", color: "var(--green)" },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="text-7xl mb-4 spin-slow inline-block">∞</div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: "var(--gold)" }}>
          Infinity Synapses
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Crown Index — AI, Radio, Wallet, Terminal, Research, Gallery, Builder, Bots, Phone, Game, Tokens
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {["🟡", "👑", "💎", "🧱", "🦾", "🧲", "🕹️", "⭐", "🍄"].map((e) => (
            <span key={e} className="text-2xl">{e}</span>
          ))}
        </div>
      </div>

      {/* Hub Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block p-5 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--bg-border)",
            }}
          >
            <div className="text-4xl mb-3">{card.emoji}</div>
            <h2 className="font-bold text-base mb-1.5" style={{ color: card.color }}>
              {card.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {card.desc}
            </p>
            <div
              className="mt-4 text-xs font-semibold"
              style={{ color: card.color }}
            >
              Open →
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center" style={{ color: "var(--text-muted)" }}>
        <p className="text-sm">∞ Infinity Synapses • Crown Index</p>
      </div>
    </div>
  );
}
