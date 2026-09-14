import Image from "next/image";
import Link from "next/link";
import { team, type TeamMember } from "@/lib/site";
import { formatEventDate, latestEvent, memberBuilds, memberFacts } from "@/lib/team";
import { Reveal } from "@/components/reveal";
import {
  ArrowUpRightIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/icons";

/*
 * The team page: one wide row per person, read top to bottom like an
 * editorial spread. Everything on a row comes from the member's profile data
 * (`src/lib/site.ts`) through the same helpers the profile page uses, so the
 * page cannot say something the profile does not.
 *
 * The whole row is one link to the profile. The social icons are the only
 * other links, raised above the stretched link so they stay clickable, and
 * nothing else on the row catches the pointer.
 */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const iconLink =
  "pointer-events-auto relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted transition-colors hover:border-foreground/30 hover:text-foreground";

function Portrait({ member }: { member: TeamMember }) {
  return (
    <div className="relative mx-auto w-fit lg:mx-0">
      <div aria-hidden className="absolute -inset-2.5 rotate-6 rounded-blob bg-blue/15" />
      {member.avatar ? (
        <Image
          src={member.avatar}
          alt={member.avatarAlt ?? member.name}
          width={224}
          height={224}
          className="relative h-40 w-40 rounded-blob object-cover shadow-soft sm:h-48 sm:w-48 lg:h-56 lg:w-56"
        />
      ) : (
        <span
          aria-hidden
          className="relative flex h-40 w-40 items-center justify-center rounded-blob bg-accent font-display text-5xl font-bold text-white shadow-soft sm:h-48 sm:w-48 lg:h-56 lg:w-56"
        >
          {initials(member.name)}
        </span>
      )}
      {member.focus ? (
        <span className="absolute -bottom-3 -left-4 -rotate-6 rounded-full bg-sun px-3.5 py-1 font-hand text-xl leading-none text-[#111111] shadow-soft">
          {member.focus.toLowerCase()}
        </span>
      ) : null}
    </div>
  );
}

function Row({ member }: { member: TeamMember }) {
  const builds = memberBuilds(member);
  const facts = memberFacts(member);
  const latest = latestEvent(member);
  const summary = member.bio?.[0] ?? member.description;

  return (
    <article className="group relative grid gap-8 py-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:py-16">
      {/* Stretched link: the row is the profile. */}
      <Link
        href={`/team/${member.slug}`}
        aria-label={`${member.name}, ${member.role}: open profile`}
        className="absolute inset-0 z-0 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
      />

      <div className="pointer-events-none relative min-w-0">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="underline decoration-transparent decoration-2 underline-offset-8 transition-colors group-hover:decoration-accent">
            {member.name}
          </span>
        </h2>
        <p className="mt-2 text-lg font-semibold text-accent-strong">{member.role}</p>

        {summary ? (
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">{summary}</p>
        ) : null}

        {facts.length > 0 ? (
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-baseline gap-2">
                <dd className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {fact.value}
                </dd>
                <dt className="text-sm text-muted">{fact.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}

        {builds.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-xs uppercase tracking-[0.15em] text-subtle">
              Builds
            </span>
            {builds.map((project) => (
              <span
                key={project.name}
                className="rounded-full bg-background px-3 py-1 font-mono text-xs text-foreground ring-1 ring-inset ring-border"
              >
                {project.name}
              </span>
            ))}
          </div>
        ) : null}

        {latest ? (
          <p className="mt-4 text-sm text-muted">
            <span className="mr-2 rounded-full bg-sun px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]">
              Latest
            </span>
            <span className="font-medium text-foreground">{latest.name}</span>, {formatEventDate(latest)}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform group-hover:-translate-y-0.5">
            Profile
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </span>
          {member.linkedin ? (
            <a href={member.linkedin} target="_blank" rel="noreferrer noopener" className={iconLink} aria-label={`${member.name} on LinkedIn`}>
              <LinkedInIcon className="h-4 w-4" />
            </a>
          ) : null}
          {member.github ? (
            <a href={member.github} target="_blank" rel="noreferrer noopener" className={iconLink} aria-label={`${member.name} on GitHub`}>
              <GitHubIcon className="h-4 w-4" />
            </a>
          ) : null}
          {member.email ? (
            <a href={`mailto:${member.email}`} className={iconLink} aria-label={`Email ${member.name}`}>
              <MailIcon className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none relative lg:pt-2">
        <Portrait member={member} />
      </div>
    </article>
  );
}

export function Team() {
  if (team.length === 0) return null;

  return (
    <section id="team" className="mx-auto w-full max-w-7xl px-6 pb-8 lg:px-10">
      <div className="divide-y divide-border">
        {team.map((member, i) => (
          <Reveal key={member.slug} delay={i * 80}>
            <Row member={member} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
