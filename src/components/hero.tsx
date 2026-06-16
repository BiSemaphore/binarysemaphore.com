import Link from "next/link";
import { site } from "@/lib/site";
import { ArrowUpRightIcon } from "@/components/icons";

/**
 * Typography-led, centered hero on a deep indigo gradient. No faked product
 * shot. A tiny line at the bottom nods to the current product (inode).
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, #1d1f44 0%, #0e0f1c 55%, #0a0b12 100%)",
      }}
    >
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-28 text-center lg:py-36">
        <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          {site.eyebrow}
        </p>

        <h1 className="text-balance text-5xl font-extrabold leading-[1.0] tracking-tight sm:text-6xl lg:text-[4.75rem]">
          {site.hero.headline}{" "}
          <span className="text-coral">{site.hero.headlineAccent}</span>
        </h1>

        <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-white/65 sm:text-xl">
          {site.hero.subhead}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={site.hero.primary.href}
            className="inline-flex items-center gap-2 rounded-full bg-coral px-8 py-4 text-base font-semibold text-white shadow-lg shadow-coral/20 transition-transform hover:-translate-y-0.5"
          >
            {site.hero.primary.label}
          </Link>
          <a
            href={site.hero.secondary.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white/80 transition-colors hover:text-white"
          >
            {site.hero.secondary.label}
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-white/40" />
          </a>
        </div>

        {/* Tiny nod to the current product */}
        <Link
          href="/projects/inode"
          className="group mt-14 inline-flex items-center gap-2 font-mono text-xs text-white/45 transition-colors hover:text-white/80"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          Currently building inode, a CLI knowledge base that retrieves by meaning
          <ArrowUpRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
