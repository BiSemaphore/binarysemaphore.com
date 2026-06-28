import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { ArrowUpRightIcon } from "@/components/icons";
import { HeroPanel } from "@/components/hero-panel";

/**
 * Hero modeled on the reference site's service banner: a light canvas with a
 * huge, tightly-tracked left-aligned headline, a large supporting line, a
 * circular outlined call-to-action top-right, and a wide rounded brand panel
 * below (standing in for the reference's full-bleed photo).
 */
export function Hero() {
  return (
    <section id="top" className="relative bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-14 lg:px-10 lg:pt-20 lg:pb-20">
        {/* Headline + circular CTA */}
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <a
              href="https://resume.binarysemaphore.com"
              target="_blank"
              rel="noreferrer noopener"
              className="group mb-7 inline-flex items-center gap-4 rounded-full border border-foreground bg-background py-2.5 pl-5 pr-4 transition-colors duration-300 hover:bg-foreground"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground group-hover:text-background">
                  Resume Builder by Binary Semaphore
                </span>
                <span className="text-xs text-muted group-hover:text-background/70">
                  Pick a template, fill it in, export a clean PDF. Free.
                </span>
              </span>
              <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-background" />
            </a>

            <h1 className="flex flex-wrap items-center gap-x-5 gap-y-1 font-display font-normal leading-[1.1] tracking-[-0.0328em] text-foreground text-[clamp(2.75rem,9vw,7.25rem)]">
              <Image
                src="/brand/mark.svg"
                alt=""
                aria-hidden
                width={120}
                height={120}
                priority
                unoptimized
                className="h-[0.78em] w-[0.78em] rounded-[0.16em] ring-1 ring-black/5 dark:ring-white/10"
              />
              {site.wordmark}
            </h1>

            <p className="mt-7 max-w-2xl text-balance text-xl font-medium leading-snug tracking-[-0.02em] text-foreground sm:text-2xl lg:text-[1.9375rem] lg:leading-[1.3]">
              {site.hero.subhead}
            </p>
          </div>

          {/* Circular outlined CTA, matching the reference's "Start Work" mark. */}
          <Link
            href={site.hero.primary.href}
            className="group hidden shrink-0 flex-col items-center justify-center gap-2 rounded-full border border-[#d1d1d1] text-foreground transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background lg:flex dark:border-white/20"
            style={{ width: 140, height: 140 }}
          >
            <ArrowUpRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="text-base font-medium">{site.hero.primary.label}</span>
          </Link>
        </div>

        {/* Wide rounded brand panel: a full-bleed photo. */}
        <HeroPanel className="mt-12 lg:mt-16" />

        {/* Mobile CTA (the circular mark is desktop-only). */}
        <div className="mt-8 flex items-center gap-3 lg:hidden">
          <Link
            href={site.hero.primary.href}
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-base font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
          >
            {site.hero.primary.label}
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
