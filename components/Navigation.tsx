"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  emoji: string;
}

const links: NavLink[] = [
  { href: "/",          label: "Crown Index",  emoji: "👑" },
  { href: "/radio",     label: "Radio",        emoji: "📻" },
  { href: "/wallet",    label: "Wallet",       emoji: "💳" },
  { href: "/chat",      label: "AI Chat",      emoji: "😎" },
  { href: "/research",  label: "Research",     emoji: "✍️" },
  { href: "/terminal",  label: "Terminal",     emoji: "🖥️" },
  { href: "/gallery",   label: "Gallery",      emoji: "🖼️" },
  { href: "/builder",   label: "Builder",      emoji: "🧱" },
  { href: "/bots",      label: "Bots",         emoji: "🤖" },
  { href: "/phone",     label: "H-Host",       emoji: "📞" },
  { href: "/game",      label: "BTC Game",     emoji: "🎮" },
  { href: "/tokens",    label: "Tokens",       emoji: "🟡" },
  { href: "/charts",    label: "Charts",       emoji: "📊" },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(7,7,15,0.95)", borderColor: "var(--bg-border)", backdropFilter: "blur(8px)" }}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg"
          style={{ color: "var(--gold)" }}
          aria-label="Infinity Synapses Home"
        >
          <span className="text-xl">∞</span>
          <span className="hidden sm:inline">Infinity Synapses</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1" role="list">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
                style={{
                  color: pathname === l.href ? "var(--gold)" : "var(--text-muted)",
                  background: pathname === l.href ? "rgba(255,215,0,0.08)" : "transparent",
                }}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                <span>{l.emoji}</span>
                <span>{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t"
          style={{ borderColor: "var(--bg-border)", background: "var(--bg-card)" }}
        >
          <ul className="p-4 grid grid-cols-2 gap-2" role="list">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    color: pathname === l.href ? "var(--gold)" : "var(--text)",
                    background: pathname === l.href ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                    border: "1px solid var(--bg-border)",
                  }}
                  aria-current={pathname === l.href ? "page" : undefined}
                >
                  <span>{l.emoji}</span>
                  <span>{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
