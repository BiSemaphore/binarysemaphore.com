import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { team, getTeamMember, site, type TeamMember } from "@/lib/site";
import { groupStints, memberBuilds, memberFacts } from "@/lib/team";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import {
  ArrowUpRightIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/icons";
import { SectionNav } from "@/components/team-member/section-nav";
import { ProfileSection } from "@/components/team-member/section";
import { StudioBuildCard } from "@/components/team-member/studio-build-card";
import { CardTile, TrayCard } from "@/components/team-member/tray-card";
import { Experience } from "@/components/team-member/experience";

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

// Static class names so Tailwind sees them; indexed by fact count.
const factCols = ["", "", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"];

// Certifications shown before the rest fold into a disclosure.
const CERTS_SHOWN = 4;

const chip =
  "rounded-full bg-background px-3 py-1.5 font-mono text-xs text-subtle ring-1 ring-inset ring-border";
const pill =
  "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover";

/** "github.com/shahid-io/beeline" from a URL, for a card's tray footer. */
function repoLabel(href: string | undefined): string {
  if (!href) return "Private";
  try {
    const url = new URL(href);
    return `${url.host.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return href;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function Hero({ member }: { member: TeamMember }) {
  const firstName = member.name.split(/\s+/)[0];
  return (
    <header className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
          {site.wordmark} <span className="text-accent-strong">/</span> Team
        </p>
        <h1 className="mt-5 font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          {member.name}
        </h1>
        <p className="mt-4 text-xl font-semibold text-accent-strong">
          {member.role}
        </p>
        {member.description ? (
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            {member.description}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {member.email ? (
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MailIcon className="h-4 w-4" />
              Email {firstName}
            </a>
          ) : null}
          {member.linkedin ? (
            <a href={member.linkedin} target="_blank" rel="noreferrer noopener" className={pill}>
              <LinkedInIcon className="h-4 w-4" />
              LinkedIn
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
            </a>
          ) : null}
          {member.github ? (
            <a href={member.github} target="_blank" rel="noreferrer noopener" className={pill}>
              <GitHubIcon className="h-4 w-4" />
              GitHub
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="relative mx-auto w-fit lg:mx-0">
        <div
          aria-hidden
          className="absolute -inset-3 rotate-6 rounded-blob bg-blue/15 sm:-inset-4"
        />
        {member.avatar ? (
          <Image
            src={member.avatar}
            alt={member.avatarAlt ?? member.name}
            width={288}
            height={288}
            priority
            className="relative h-56 w-56 rounded-blob object-cover shadow-soft sm:h-64 sm:w-64"
          />
        ) : (
          <span
            aria-hidden
            className="relative flex h-56 w-56 items-center justify-center rounded-blob bg-accent font-display text-6xl font-bold text-white shadow-soft sm:h-64 sm:w-64"
          >
            {initials(member.name)}
          </span>
        )}
        {member.focus ? (
          <span
            className="absolute -bottom-4 -left-6 -rotate-6 rounded-full bg-sun px-4 py-1.5 font-hand text-2xl leading-none text-[#111111] shadow-soft"
          >
            {member.focus.toLowerCase()}
          </span>
        ) : null}
      </div>
    </header>
  );
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const member = getTeamMember(slug);
  if (!member) notFound();

  const builds = memberBuilds(member);
  const facts = memberFacts(member);
  const stints = groupStints(member.experience);
  const certs = member.certifications ?? [];

  // Every section the page can show, in order. Only those with data render,
  // and the rail and the "01" numbering are both derived from this list.
  const sections: { id: string; label: string; title?: string; body: ReactNode }[] = [];

  if (builds.length > 0) {
    sections.push({
      id: "building",
      label: `Building at ${site.wordmark}`,
      body: (
        <>
          <ul className="grid gap-6 sm:grid-cols-2">
            {builds.map((project) => (
              <li key={project.name} className="min-w-0">
                <StudioBuildCard project={project} />
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-6 text-muted">
            How these tools work is written up in{" "}
            <Link
              href="/threads"
              className="font-medium text-accent-strong underline-offset-4 hover:underline"
            >
              threads
            </Link>
            .
          </p>
        </>
      ),
    });
  }

  if (member.bio && member.bio.length > 0) {
    const [lead, ...rest] = member.bio;
    sections.push({
      id: "about",
      label: "About",
      body: (
        <div className="space-y-5">
          <p className="font-display text-xl leading-9 text-foreground sm:text-2xl sm:leading-10">
            {lead}
          </p>
          {rest.map((para, i) => (
            <p key={i} className="text-base leading-8 text-muted">
              {para}
            </p>
          ))}
        </div>
      ),
    });
  }

  if (stints.length > 0) {
    sections.push({
      id: "experience",
      label: "Experience",
      body: <Experience stints={stints} />,
    });
  }

  if (member.projects && member.projects.length > 0) {
    sections.push({
      id: "projects",
      label: builds.length > 0 ? "Other projects" : "Projects",
      body: (
        <ul className="grid gap-6 sm:grid-cols-2">
          {member.projects.map((proj, i, all) => {
            // An odd last card spans the row rather than sitting alone.
            const span = all.length % 2 === 1 && i === all.length - 1 ? "sm:col-span-2" : "";
            return (
              <li key={proj.name} className={`min-w-0 ${span}`}>
                <TrayCard href={proj.href} footer={repoLabel(proj.href)}>
                  <div className="flex items-center gap-3">
                    <CardTile label={proj.name} />
                    <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                      {proj.name}
                    </h3>
                  </div>
                  {proj.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                      {proj.description}
                    </p>
                  ) : null}
                </TrayCard>
              </li>
            );
          })}
        </ul>
      ),
    });
  }

  if (member.skillGroups && member.skillGroups.length > 0) {
    sections.push({
      id: "skills",
      label: "Skills",
      body: (
        <dl className="divide-y divide-border rounded-panel border border-border bg-card px-6 shadow-soft">
          {member.skillGroups.map((group) => (
            <div
              key={group.title}
              className="py-5 sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-6"
            >
              <dt className="pt-1.5 text-sm font-semibold text-foreground">
                {group.title}
              </dt>
              <dd className="mt-3 sm:mt-0">
                <ul className="flex flex-wrap gap-1.5">
                  {group.items.map((skill) => (
                    <li key={skill} className={chip}>
                      {skill}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      ),
    });
  } else if (member.skills && member.skills.length > 0) {
    sections.push({
      id: "skills",
      label: "Focus areas",
      body: (
        <ul className="flex flex-wrap gap-2">
          {member.skills.map((skill) => (
            <li key={skill} className={chip}>
              {skill}
            </li>
          ))}
        </ul>
      ),
    });
  }

  if ((member.education && member.education.length > 0) || certs.length > 0) {
    const certRow = (cert: (typeof certs)[number], i: number) => {
      const label = (
        <>
          <span className="font-medium text-foreground">{cert.name}</span>
          <span className="mt-0.5 block text-xs text-subtle">
            {[cert.issuer, cert.year].filter(Boolean).join(" · ")}
          </span>
        </>
      );
      return (
        <li key={i} className="border-b border-border py-3 text-sm last:border-b-0">
          {cert.href ? (
            <a
              href={cert.href}
              target="_blank"
              rel="noreferrer noopener"
              className="block transition-colors hover:text-accent-strong"
            >
              {label}
            </a>
          ) : (
            label
          )}
        </li>
      );
    };

    sections.push({
      id: "education",
      label: certs.length > 0 ? "Education & certifications" : "Education",
      body: (
        <div className="grid gap-5 lg:grid-cols-2">
          {member.education && member.education.length > 0 ? (
            <ul className="space-y-4">
              {member.education.map((edu, i) => (
                <li
                  key={i}
                  className="rounded-card border border-border bg-card p-5 shadow-soft"
                >
                  <span className="font-mono text-xs text-subtle">{edu.period}</span>
                  <h3 className="mt-1 font-semibold text-foreground">{edu.degree}</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {edu.school}
                    {edu.location ? (
                      <span className="text-subtle"> · {edu.location}</span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {certs.length > 0 ? (
            <div className="rounded-card border border-border bg-card px-5 py-2 shadow-soft">
              <ul>{certs.slice(0, CERTS_SHOWN).map(certRow)}</ul>
              {certs.length > CERTS_SHOWN ? (
                <details className="group">
                  <summary className="cursor-pointer list-none border-t border-border py-3 text-sm font-medium text-accent-strong [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">
                      Show {certs.length - CERTS_SHOWN} more
                    </span>
                    <span className="hidden group-open:inline">Show fewer</span>
                  </summary>
                  <ul>
                    {certs.slice(CERTS_SHOWN).map((c, i) => certRow(c, i + CERTS_SHOWN))}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
    });
  }

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 lg:px-10">
        <nav className="pt-10 pb-10 text-sm" aria-label="Breadcrumb">
          <Link
            href="/#team"
            className="inline-flex items-center gap-1.5 font-mono text-subtle transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> Team
          </Link>
        </nav>

        <Hero member={member} />

        {facts.length >= 2 ? (
          <Reveal>
            <dl
              className={`mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-border bg-border shadow-soft ${factCols[facts.length] ?? "sm:grid-cols-4"}`}
            >
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col-reverse bg-card px-6 py-5">
                  <dt className="mt-1 text-sm text-muted">{fact.label}</dt>
                  <dd className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}

        <div className="mt-16 grid gap-12 lg:grid-cols-[13rem_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <SectionNav items={sections.map(({ id, label }) => ({ id, label }))} />
            </div>
          </aside>

          <div className="min-w-0 space-y-20">
            {sections.map((section, i) => (
              <ProfileSection
                key={section.id}
                id={section.id}
                index={i + 1}
                label={section.label}
                title={section.title}
              >
                {section.body}
              </ProfileSection>
            ))}

            <Reveal>
              <section className="relative overflow-hidden rounded-blob border border-band-border bg-band p-8 text-white shadow-soft sm:p-10">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                  {site.wordmark}
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Work with {site.wordmark}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
                  {site.services.lead}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/#contact"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Start a conversation
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/#projects"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    See what we have built
                  </Link>
                </div>
              </section>
            </Reveal>

            <div className="border-t border-border pt-8">
              <Link
                href="/#team"
                className="inline-flex items-center gap-1.5 font-mono text-sm text-subtle transition-colors hover:text-foreground"
              >
                <span aria-hidden="true">&larr;</span> Meet the rest of the team
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
