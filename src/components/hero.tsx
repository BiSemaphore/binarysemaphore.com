import Link from "next/link";
import { site } from "@/lib/site";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";
import { Blob, DotGrid, GradientWash } from "@/components/decoration";

const capabilityAccents = ["bg-coral", "bg-blue", "bg-violet"];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Layered colorful backdrop */}
      <GradientWash />
      <DotGrid className="text-foreground/[0.04]" />
      <Blob className="left-[-6rem] top-[-4rem] h-[26rem] w-[26rem] bg-coral" />
      <Blob className="right-[-8rem] top-[6rem] h-[30rem] w-[30rem] bg-violet" />

      <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-20 text-center lg:px-10 lg:pb-28 lg:pt-28">
        {/* Eyebrow pill */}
        <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 font-mono text-xs text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {site.eyebrow}
        </p>

        {/* Oversized headline */}
        <h1 className="mx-auto max-w-4xl text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
          {site.hero.headline}{" "}
          <span className="text-accent-strong">{site.hero.headlineAccent}</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-8 text-muted sm:text-xl">
          {site.hero.subhead}
        </p>

        {/* Large pill CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={site.hero.primary.href}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-base font-semibold text-background shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {site.hero.primary.label}
          </Link>
          <a
            href={site.hero.secondary.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur transition-colors hover:bg-card-hover"
          >
            <GitHubIcon className="h-4 w-4" />
            {site.hero.secondary.label}
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
          </a>
        </div>

        {/* What we do — quick capability cards */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-5 text-left sm:grid-cols-3">
          {site.capabilities.map((cap, i) => (
            <div
              key={cap.title}
              className="rounded-panel border border-border bg-card/80 p-6 shadow-soft backdrop-blur transition-transform duration-200 hover:-translate-y-1"
            >
              <span
                className={`mb-4 block h-1.5 w-10 rounded-full ${capabilityAccents[i % capabilityAccents.length]}`}
              />
              <h2 className="text-xl text-foreground">{cap.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{cap.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
