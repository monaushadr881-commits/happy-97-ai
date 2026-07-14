import { useState, useRef, type MouseEvent } from "react";
import { ExternalLink, Copy, Check, Globe, Sparkle } from "lucide-react";

type Site = {
  title: string;
  category: string;
  description: string;
  url: string;
  domain: string;
  accent: string; // gradient for placeholder
};

const SITES: Site[] = [
  {
    title: "H.P SHUDDH MASALE",
    category: "Premium Spices",
    description: "Official Website",
    url: "https://hpshuddhmasale.online/",
    domain: "hpshuddhmasale.online",
    accent: "from-[#8a2b0a] via-[#c9721a] to-[#f2c14e]",
  },
  {
    title: "H.P PRIVATE LIMITED",
    category: "Corporate",
    description: "Official Corporate Website",
    url: "https://hp-private-limited--monaushadr881.replit.app/",
    domain: "hp-private-limited.replit.app",
    accent: "from-[#0b1a3a] via-[#1e3a8a] to-[#d4af37]",
  },
  {
    title: "HAPPY PERSON PRIVATE LIMITED",
    category: "Enterprise",
    description: "Official Enterprise Platform",
    url: "https://happypersonpvtltd.lovable.app/",
    domain: "happypersonpvtltd.lovable.app",
    accent: "from-[#111111] via-[#3a2a10] to-[#e6c261]",
  },
  {
    title: "H.P SHUDDH MASALE ONLINE",
    category: "E-Commerce",
    description: "Official Online Store",
    url: "https://hpshuddhmasaleonline.lovable.app/",
    domain: "hpshuddhmasaleonline.lovable.app",
    accent: "from-[#3a0a0a] via-[#8a1c1c] to-[#f2c14e]",
  },
];

function faviconFor(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}`;
  } catch {
    return "";
  }
}

function thumbnailFor(url: string) {
  try {
    const u = new URL(url);
    // Free preview / OG-style screenshot service; falls back to placeholder onError
    return `https://image.thum.io/get/width/800/crop/500/${u.href}`;
  } catch {
    return "";
  }
}

export function BusinessWebsites() {
  return (
    <section id="business-websites" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-obsidian/60 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-gold">
            <Sparkle className="h-3 w-3" /> Business Websites
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-paper sm:text-5xl">
            Official Digital Platforms
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-soft-gray sm:text-base">
            Curated portfolio of live enterprise properties across spices, corporate, and e-commerce verticals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SITES.map((s) => (
            <WebsiteCard key={s.url} site={s} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bw-border-spin { to { transform: rotate(360deg); } }
        .bw-card { transform: translateZ(0); will-change: transform; }
        .bw-card:hover { transform: translateY(-6px); }
        .bw-glow::before {
          content: "";
          position: absolute; inset: -1px; border-radius: inherit; padding: 1px;
          background: conic-gradient(from var(--bw-angle,0deg), transparent 0deg, rgba(212,175,55,0.9) 90deg, transparent 180deg, rgba(212,175,55,0.6) 270deg, transparent 360deg);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity .4s ease;
          pointer-events: none;
        }
        .bw-card:hover .bw-glow::before, .bw-card:focus-within .bw-glow::before { opacity: 1; animation: bw-border-spin 6s linear infinite; }
        .bw-cursor-glow {
          position: absolute; pointer-events: none; width: 260px; height: 260px; border-radius: 9999px;
          background: radial-gradient(circle, rgba(212,175,55,0.28), transparent 60%);
          transform: translate(-50%, -50%); opacity: 0; transition: opacity .25s ease;
          mix-blend-mode: screen;
        }
        .bw-card:hover .bw-cursor-glow { opacity: 1; }
        @keyframes bw-ripple { to { transform: scale(4); opacity: 0; } }
        .bw-ripple { position: absolute; border-radius: 9999px; background: rgba(212,175,55,0.35); transform: scale(0); animation: bw-ripple .7s ease-out forwards; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) {
          .bw-card { transition: none !important; }
          .bw-card:hover { transform: none; }
          .bw-glow::before { animation: none !important; }
          .bw-ripple { animation: none !important; display: none; }
        }
      `}</style>
    </section>
  );
}

function WebsiteCard({ site }: { site: Site }) {
  const [imgOk, setImgOk] = useState(true);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || !glowRef.current) return;
    glowRef.current.style.left = `${e.clientX - rect.left}px`;
    glowRef.current.style.top = `${e.clientY - rect.top}px`;
  };

  const spawnRipple = (e: MouseEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const span = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    span.className = "bw-ripple";
    span.style.width = span.style.height = `${size / 3}px`;
    span.style.left = `${e.clientX - rect.left - size / 6}px`;
    span.style.top = `${e.clientY - rect.top - size / 6}px`;
    target.appendChild(span);
    setTimeout(() => span.remove(), 700);
  };

  const openSite = (e: MouseEvent<HTMLElement>) => {
    spawnRipple(e);
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  const copyDomain = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    spawnRipple(e);
    try {
      await navigator.clipboard.writeText(site.domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      ref={cardRef}
      role="link"
      tabIndex={0}
      aria-label={`Open ${site.title} in a new tab`}
      onMouseMove={onMove}
      onClick={openSite}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.open(site.url, "_blank", "noopener,noreferrer");
        }
      }}
      className="bw-card group relative cursor-pointer overflow-hidden rounded-3xl border border-gold/20 bg-obsidian/70 backdrop-blur-xl transition-all duration-300 hover:border-gold/50 hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
    >
      <span aria-hidden className="bw-glow absolute inset-0 rounded-3xl" />
      <span aria-hidden ref={glowRef} className="bw-cursor-glow" />

      {/* Thumbnail */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {imgOk ? (
          <img
            src={thumbnailFor(site.url)}
            alt={`${site.title} preview`}
            loading="lazy"
            decoding="async"
            width={800}
            height={500}
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${site.accent}`}>
            <div className="text-center">
              <Globe className="mx-auto h-10 w-10 text-paper/80" />
              <div className="mt-2 px-4 text-sm font-semibold tracking-wide text-paper">{site.title}</div>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-obsidian/70 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold backdrop-blur">
          {site.category}
        </div>
        <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-gold/40 bg-obsidian/70 text-gold backdrop-blur transition-transform group-hover:scale-110">
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Body */}
      <div className="relative p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-gold/30 bg-obsidian">
            <img
              src={faviconFor(site.url)}
              alt=""
              width={24}
              height={24}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="h-6 w-6"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-paper sm:text-lg">{site.title}</h3>
            <p className="mt-0.5 text-xs text-soft-gray">{site.description}</p>
            <div className="mt-1 truncate text-[11px] text-gold/80">{site.domain}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openSite(e);
            }}
            className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gold px-3 py-2 text-xs font-semibold text-obsidian transition-transform hover:scale-[1.03]"
            aria-label={`Visit ${site.title}`}
          >
            Visit Website
            <ArrowExt />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openSite(e);
            }}
            className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border border-gold/40 px-3 py-2 text-xs font-semibold text-paper transition-colors hover:bg-gold/10"
            aria-label={`Open ${site.title} in a new tab`}
          >
            Open in New Tab
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={copyDomain}
            className="relative ml-auto inline-flex items-center gap-1.5 overflow-hidden rounded-xl border border-gold/25 bg-obsidian/60 px-3 py-2 text-xs font-medium text-soft-gray transition-colors hover:border-gold/50 hover:text-paper"
            aria-label={`Copy domain ${site.domain}`}
          >
            {copied ? <Check className="h-3 w-3 text-gold" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy Domain"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowExt() {
  return <ExternalLink className="h-3 w-3" />;
}
