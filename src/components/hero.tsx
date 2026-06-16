import Link from "next/link";
import { site } from "@/lib/site";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";

/**
 * Dark hero. Copy on the left, a realistic inode terminal session on the right
 * (built in markup, not a stock illustration). Deep indigo gradient backdrop.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 85% at 50% -10%, #1d1f44 0%, #0e0f1c 52%, #0a0b12 100%)",
      }}
    >
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-10 lg:py-32">
        {/* Left: copy */}
        <div>
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            {site.eyebrow}
          </p>

          <h1 className="text-balance text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.25rem]">
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
              className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-base font-semibold text-white/80 transition-colors hover:text-white"
            >
              <GitHubIcon className="h-4 w-4" />
              {site.hero.secondary.label}
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-white/40" />
            </a>
          </div>
        </div>

        {/* Right: realistic inode terminal session */}
        <Terminal />
      </div>
    </section>
  );
}

function Terminal() {
  return (
    <div className="relative">
      {/* soft glow behind the window */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-coral/10 blur-3xl"
      />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e16] shadow-2xl shadow-black/60">
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-white/40">inode — zsh</span>
        </div>

        {/* session */}
        <div className="space-y-4 p-5 font-mono text-[13px] leading-relaxed sm:text-sm">
          <div>
            <p>
              <span className="text-coral">$</span>{" "}
              <span className="text-white">inode add</span>{" "}
              <span className="text-white/55">
                &quot;prod db is db.acme.internal:5432, user svc_api&quot;
              </span>
            </p>
            <p className="text-emerald-400/90">
              ✓ saved · credential · id 7c1a
            </p>
          </div>

          <div>
            <p>
              <span className="text-coral">$</span>{" "}
              <span className="text-white">inode</span>{" "}
              <span className="text-white/55">
                &quot;where does the worker deploy to?&quot;
              </span>
            </p>
            <p className="text-sky-400/90">
              ▸ runbook · deploy-worker{" "}
              <span className="text-white/35">(96%)</span>
            </p>
            <p className="pl-4 text-white/70">
              fly deploy --config worker.toml --remote-only
            </p>
          </div>

          <div>
            <p>
              <span className="text-coral">$</span>{" "}
              <span className="text-white">inode</span>{" "}
              <span className="text-white/55">
                &quot;staging database password&quot;
              </span>
            </p>
            <p className="text-sky-400/90">
              ▸ credential · staging-db{" "}
              <span className="text-white/35">(94%)</span>
            </p>
            <p className="pl-4 text-white/45">
              •••••••••{" "}
              <span className="text-white/30">
                (inode show staging-db to reveal)
              </span>
            </p>
          </div>

          <p>
            <span className="text-coral">$</span>{" "}
            <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-white/70" />
          </p>
        </div>
      </div>
    </div>
  );
}
