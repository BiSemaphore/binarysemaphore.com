import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/site";
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

  const title = `${project.name} — ${project.tagline}`;
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
    alternates: { canonical: `/projects/${slug}` },
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

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        {/* Breadcrumb */}
        <nav className="pt-10 pb-8 text-sm" aria-label="Breadcrumb">
          <Link
            href="/#projects"
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

        {/* Banner */}
        {project.image ? (
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

        {/* Features */}
        <section className="mt-12">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            How it works
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
            github.com/shahid-io/{project.name}
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
          </a>
        </section>
      </main>

      <div className="mx-auto w-full max-w-3xl px-6">
        <Footer />
      </div>
    </>
  );
}
