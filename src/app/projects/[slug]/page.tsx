import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/site";
import { productSubdomainUrl } from "@/lib/subdomains";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";

type Params = { slug: string };

// Prerender a static page for every project that has detail content.
export function generateStaticParams() {
  return projects
    .filter((p) => p.slug && p.detail)
    .map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project?.detail) return {};

  const title = `${project.name}: ${project.tagline}`;
  return {
    title: project.name,
    description: project.detail.lede,
    openGraph: {
      title,
      description: project.detail.lede,
      images: project.image ? [{ url: project.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.detail.lede,
      images: project.image ? [project.image] : undefined,
    },
    // Products with a subdomain are canonical there; otherwise the path is.
    alternates: {
      canonical: productSubdomainUrl(slug) ?? `/projects/${slug}`,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project?.detail) notFound();

  const { detail } = project;
  // Display label for the repo link, derived from the project's own href so it
  // works for any GitHub owner (not just shahid-io).
  const repoLabel = project.href.replace(/^https?:\/\//, "");

  // When served from a product subdomain (set by the proxy), point the shared
  // chrome's internal links back at the apex.
  const onSubdomain = Boolean((await headers()).get("x-product-subdomain"));
  const linkBase = onSubdomain ? "https://binarysemaphore.com" : "";

  return (
    <>
      <Header linkBase={linkBase} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        {/* Breadcrumb */}
        <nav className="pt-10 pb-8 text-sm" aria-label="Breadcrumb">
          <Link
            href={`${linkBase}/#projects`}
            className="inline-flex items-center gap-1.5 font-mono text-subtle transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> Projects
          </Link>
        </nav>

        {/* Title block */}
        <header>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
            {project.featured ? (
              <span className="rounded-full bg-accent px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
                Featured
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-balance text-lg leading-7 text-muted sm:text-xl">
            {detail.lede}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <GitHubIcon className="h-4 w-4" />
              View on GitHub
              <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-70" />
            </a>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-card px-2.5 py-1 font-mono text-xs text-subtle ring-1 ring-inset ring-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Statement band (brand voice) */}
        {detail.statements && detail.statements.length > 0 ? (
          <div
            className="relative mt-10 overflow-hidden rounded-panel p-8 sm:p-12"
            style={{
              background: "linear-gradient(135deg, var(--blue), var(--violet))",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: "radial-gradient(#fff 1.5px, transparent 1.5px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative space-y-1.5">
              {detail.statements.map((s) => (
                <p
                  key={s}
                  className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl"
                >
                  {s}
                </p>
              ))}
            </div>
            {/* inode-specific install pill. Other products can set `statements`
                too (e.g. notchify), so this is gated to inode by slug. */}
            {project.slug === "inode" ? (
              <p className="relative mt-6 inline-flex items-center rounded-full bg-white/95 px-4 py-2 font-mono text-sm font-semibold text-neutral-900">
                $ go install inode
              </p>
            ) : null}
          </div>
        ) : project.image ? (
          <div className="relative mt-10 aspect-[1200/627] w-full overflow-hidden rounded-panel border border-border shadow-soft">
            <Image
              src={project.image}
              alt={`${project.name} preview`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        {/* Overview */}
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            Overview
          </h2>
          <div className="space-y-4">
            {detail.overview.map((para, i) => (
              <p key={i} className="text-[15px] leading-7 text-muted">
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* Screenshots */}
        {detail.screenshots && detail.screenshots.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              Screenshots
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {detail.screenshots.map((shot) => (
                <div
                  key={shot.src}
                  className="relative aspect-square overflow-hidden rounded-panel border border-border shadow-soft"
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* At a glance */}
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            At a glance
          </h2>
          <dl className="grid gap-x-6 gap-y-4 rounded-panel border border-border bg-card p-6 shadow-soft sm:grid-cols-2">
            {detail.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="font-mono text-xs uppercase tracking-wider text-subtle">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works (pipeline) */}
        {detail.howItWorks && detail.howItWorks.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              How it works
            </h2>
            <ol className="space-y-6 border-l border-border pl-6">
              {detail.howItWorks.map((s, i) => (
                <li key={s.step} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[2.05rem] flex h-7 w-7 items-center justify-center rounded-full bg-accent font-mono text-xs font-bold text-white ring-4 ring-background"
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold text-foreground">
                    {s.step}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-7 text-muted">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Capabilities */}
        <section className="mt-12">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            Capabilities
          </h2>
          <div className="space-y-8">
            {detail.features.map((feature, i) => (
              <div
                key={feature.title}
                className="flex gap-4 border-l-2 border-accent/40 pl-5"
              >
                <div className="flex-1">
                  <h3 className="flex items-baseline gap-2 text-base font-medium text-foreground">
                    <span className="font-mono text-xs text-accent-strong">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-7 text-muted">
                    {feature.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage */}
        {detail.usage && detail.usage.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              Usage
            </h2>
            <ul className="space-y-4">
              {detail.usage.map((u) => (
                <li
                  key={u.command}
                  className="overflow-hidden rounded-card border border-border bg-card shadow-soft"
                >
                  <pre className="overflow-x-auto border-b border-border bg-background px-4 py-3 font-mono text-[13px] text-foreground">
                    <code>
                      <span className="text-accent-strong">$</span> {u.command}
                    </code>
                  </pre>
                  <p className="px-4 py-3 text-sm leading-6 text-muted">
                    {u.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Bottom CTA */}
        <section className="mt-14 rounded-panel border border-border bg-card p-6 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-sm font-medium text-foreground">
              Want the code?
            </p>
            <p className="mt-1 text-sm text-muted">
              {project.name} is open source and built in public.
            </p>
          </div>
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover sm:mt-0"
          >
            <GitHubIcon className="h-4 w-4" />
            {repoLabel}
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
          </a>
        </section>
      </main>

      <Footer linkBase={linkBase} />
    </>
  );
}
