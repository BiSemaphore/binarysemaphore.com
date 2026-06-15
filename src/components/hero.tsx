import { site } from "@/lib/site";
import {
  ArrowUpRightIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/icons";

export function Hero() {
  return (
    <section id="top" className="pt-20 pb-16 sm:pt-28 sm:pb-24">
      <p className="mb-5 inline-flex items-center gap-2 font-mono text-xs text-subtle">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Available for interesting problems
      </p>

      <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
        {site.name}
      </h1>

      <p className="mt-4 max-w-xl text-balance text-lg text-muted sm:text-xl">
        {site.role}.{" "}
        <span className="text-foreground">{site.tagline}</span>
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${site.email}`}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <MailIcon className="h-4 w-4" />
          Get in touch
        </a>
        <a
          href={site.github}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
        >
          <GitHubIcon className="h-4 w-4" />
          GitHub
          <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
        </a>
        {site.linkedin ? (
          <a
            href={site.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            <LinkedInIcon className="h-4 w-4" />
            LinkedIn
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
