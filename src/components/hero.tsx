import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      {/* Soft accent glow behind the product visual. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 bg-[radial-gradient(closest-side,var(--color-accent),transparent)] opacity-[0.14] blur-2xl"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:py-28">
        {/* Copy */}
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {site.eyebrow}
          </p>

          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {site.hero.headline}{" "}
            <span className="text-gradient">{site.hero.headlineAccent}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            {site.hero.subhead}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={site.hero.primary.href}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {site.hero.primary.label}
            </Link>
            <a
              href={site.hero.secondary.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
            >
              <GitHubIcon className="h-4 w-4" />
              {site.hero.secondary.label}
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
            </a>
          </div>
        </div>

        {/* Product visual in a faux window. */}
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="ml-3 font-mono text-xs text-subtle">inode</span>
            </div>
            <Image
              src="/projects/inode.png"
              alt="inode — the CLI knowledge base in action"
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
