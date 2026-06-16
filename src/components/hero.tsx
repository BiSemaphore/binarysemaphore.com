import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";

/**
 * Dark, Superlist-style hero: copy on the left, product visual on the right,
 * on a deep navy band. Coral accent + coral CTA. No decorative blobs.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-[#0d0f17] text-white"
    >
      {/* Single soft glow, not blobby */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,92,57,0.22),transparent)]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10 lg:py-32">
        {/* Left: copy */}
        <div>
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            {site.eyebrow}
          </p>

          <h1 className="text-balance text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.5rem]">
            {site.hero.headline}{" "}
            <span className="text-coral">{site.hero.headlineAccent}</span>
          </h1>

          <p className="mt-7 max-w-md text-lg leading-8 text-white/65">
            {site.hero.subhead}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={site.hero.primary.href}
              className="inline-flex items-center gap-2 rounded-full bg-coral px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-coral/20 transition-transform hover:-translate-y-0.5"
            >
              {site.hero.primary.label}
            </Link>
            <a
              href={site.hero.secondary.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <GitHubIcon className="h-4 w-4" />
              {site.hero.secondary.label}
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-white/50" />
            </a>
          </div>
        </div>

        {/* Right: product visual in a dark faux-window */}
        <div className="relative">
          <div className="overflow-hidden rounded-panel border border-white/10 bg-[#15171f] shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-white/15" />
              <span className="h-3 w-3 rounded-full bg-white/15" />
              <span className="h-3 w-3 rounded-full bg-white/15" />
              <span className="ml-3 font-mono text-xs text-white/40">inode</span>
            </div>
            <Image
              src="/projects/inode.png"
              alt="inode, the CLI knowledge base, in action"
              width={1200}
              height={627}
              priority
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
