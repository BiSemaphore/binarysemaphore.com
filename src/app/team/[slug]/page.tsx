import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { team, getTeamMember, site } from "@/lib/site";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  ArrowUpRightIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/icons";

type Params = { slug: string };

// Only slugs returned here exist; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = getTeamMember(slug);
  if (!member) return {};

  const title = `${member.name}, ${member.role}`;
  const description =
    member.bio?.[0] ?? member.description ?? `${member.name} at ${site.wordmark}`;
  return {
    title: member.name,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: { canonical: `/team/${slug}` },
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const member = getTeamMember(slug);
  if (!member) notFound();

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        {/* Breadcrumb */}
        <nav className="pt-10 pb-8 text-sm" aria-label="Breadcrumb">
          <Link
            href="/#team"
            className="inline-flex items-center gap-1.5 font-mono text-subtle transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> Team
          </Link>
        </nav>

        {/* Header: avatar + name + role */}
        <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl font-extrabold text-white shadow-soft"
            aria-hidden
          >
            {initials(member.name)}
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {member.name}
            </h1>
            <p className="mt-1 text-lg font-semibold text-accent-strong">
              {member.role}
            </p>
            {member.focus ? (
              <p className="mt-0.5 text-sm text-muted">{member.focus}</p>
            ) : null}
          </div>
        </header>

        {/* Contact links */}
        {member.linkedin || member.email || member.github ? (
          <div className="mt-7 flex flex-wrap gap-3">
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
              >
                <LinkedInIcon className="h-4 w-4" />
                LinkedIn
                <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
              </a>
            ) : null}
            {member.github ? (
              <a
                href={member.github}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
              >
                <GitHubIcon className="h-4 w-4" />
                GitHub
                <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
              </a>
            ) : null}
            {member.email ? (
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
              >
                <MailIcon className="h-4 w-4" />
                Email
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Bio */}
        {member.bio && member.bio.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              About
            </h2>
            <div className="space-y-4">
              {member.bio.map((para, i) => (
                <p key={i} className="text-[15px] leading-7 text-muted">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {/* Experience */}
        {member.experience && member.experience.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              Experience
            </h2>
            <ol className="space-y-6 border-l border-border pl-6">
              {member.experience.map((job, i) => (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-background"
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="text-base font-semibold text-foreground">
                      {job.role}
                    </h3>
                    {job.period ? (
                      <span className="font-mono text-xs text-subtle">
                        {job.period}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-accent-strong">
                    {job.company}
                  </p>
                  {job.summary ? (
                    <p className="mt-1.5 text-[15px] leading-7 text-muted">
                      {job.summary}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Projects */}
        {member.projects && member.projects.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              Projects
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {member.projects.map((proj, i) => {
                const inner = (
                  <>
                    <h3 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                      {proj.name}
                      {proj.href ? (
                        <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
                      ) : null}
                    </h3>
                    {proj.description ? (
                      <p className="mt-1.5 text-sm leading-6 text-muted">
                        {proj.description}
                      </p>
                    ) : null}
                  </>
                );
                return (
                  <li key={i}>
                    {proj.href ? (
                      <a
                        href={proj.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block h-full rounded-card border border-border bg-card p-5 shadow-soft transition-transform duration-200 hover:-translate-y-1"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="h-full rounded-card border border-border bg-card p-5 shadow-soft">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Certifications */}
        {member.certifications && member.certifications.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              Certifications
            </h2>
            <ul className="space-y-3">
              {member.certifications.map((cert, i) => {
                const label = (
                  <>
                    <span className="font-medium text-foreground">
                      {cert.name}
                    </span>
                    {cert.issuer ? (
                      <span className="text-muted"> · {cert.issuer}</span>
                    ) : null}
                    {cert.year ? (
                      <span className="text-subtle"> · {cert.year}</span>
                    ) : null}
                  </>
                );
                return (
                  <li
                    key={i}
                    className="rounded-card border border-border bg-card px-5 py-3.5 text-sm shadow-soft"
                  >
                    {cert.href ? (
                      <a
                        href={cert.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="transition-colors hover:text-accent-strong"
                      >
                        {label}
                      </a>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Skills */}
        {member.skills && member.skills.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
              Focus areas
            </h2>
            <ul className="flex flex-wrap gap-2">
              {member.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-card px-3 py-1.5 font-mono text-xs text-subtle ring-1 ring-inset ring-border"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Back link */}
        <div className="mt-14 border-t border-border pt-8">
          <Link
            href="/#team"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-subtle transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> Meet the rest of the team
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
