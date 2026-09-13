import type { ReactNode } from "react";
import type { TeamMember } from "@/lib/site";
import { groupCertsByYear, splitDegree, type CertYear } from "@/lib/team";
import { ArrowUpRightIcon } from "@/components/icons";
import { CardTile, TrayCard } from "@/components/team-member/tray-card";

// Year groups shown before the older ones fold behind a disclosure.
const YEARS_SHOWN = 3;

function SubHeading({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
      {children}
      {count ? (
        <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-subtle ring-1 ring-inset ring-border">
          {count}
        </span>
      ) : null}
    </h3>
  );
}

function CertCard({ cert }: { cert: NonNullable<TeamMember["certifications"]>[number] }) {
  const body = (
    <>
      <CardTile label={cert.issuer ?? cert.name} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-snug text-foreground">{cert.name}</p>
        {cert.issuer ? <p className="mt-1 text-sm text-muted">{cert.issuer}</p> : null}
      </div>
      {cert.href ? (
        <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-foreground" />
      ) : null}
    </>
  );
  const card =
    "group flex h-full items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft";
  return cert.href ? (
    <a
      href={cert.href}
      target="_blank"
      rel="noreferrer noopener"
      className={`${card} transition-transform duration-200 motion-safe:hover:-translate-y-0.5`}
    >
      {body}
    </a>
  ) : (
    <div className={card}>{body}</div>
  );
}

function YearGroup({ group }: { group: CertYear }) {
  return (
    <div className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-6">
      <p className="font-display text-2xl font-bold tracking-tight text-subtle sm:pt-3">
        {group.year}
      </p>
      <ul className="mt-3 grid gap-3 sm:mt-0 sm:grid-cols-2">
        {group.certs.map((cert, i) => (
          <li key={`${cert.name}-${i}`} className="min-w-0">
            <CertCard cert={cert} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Degrees as tray cards, then certifications grouped by year. */
export function Credentials({ member }: { member: TeamMember }) {
  const education = member.education ?? [];
  const years = groupCertsByYear(member.certifications);
  const certCount = member.certifications?.length ?? 0;
  const shown = years.slice(0, YEARS_SHOWN);
  const earlier = years.slice(YEARS_SHOWN);
  const earlierCount = earlier.reduce((n, g) => n + g.certs.length, 0);

  return (
    <div className="space-y-12">
      {education.length > 0 ? (
        <div>
          <SubHeading>Education</SubHeading>
          <ul className="mt-5 space-y-5">
            {education.map((edu, i) => {
              const { short, name } = splitDegree(edu.degree);
              return (
                <li key={i} className="min-w-0">
                  <TrayCard
                    footer={[edu.period, edu.location].filter(Boolean).join(" · ")}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                      {short ? (
                        <p className="shrink-0 font-display text-4xl font-bold tracking-tight text-foreground sm:w-28">
                          {short}
                        </p>
                      ) : null}
                      <div className="min-w-0 sm:border-l sm:border-border sm:pl-8">
                        <p className="font-display text-lg font-bold leading-snug text-foreground">
                          {name}
                        </p>
                        <p className="mt-1 text-[15px] leading-6 text-muted">{edu.school}</p>
                      </div>
                    </div>
                  </TrayCard>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {certCount > 0 ? (
        <div>
          <SubHeading count={certCount}>Certifications</SubHeading>
          <div className="mt-5 space-y-6">
            {shown.map((group) => (
              <YearGroup key={group.year} group={group} />
            ))}
            {earlier.length > 0 ? (
              <details className="group space-y-6">
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-medium text-foreground transition-colors hover:text-accent-strong sm:ml-[7rem] [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs ring-1 ring-inset ring-border transition-transform group-open:rotate-90"
                  >
                    &rsaquo;
                  </span>
                  <span className="group-open:hidden">Show {earlierCount} earlier</span>
                  <span className="hidden group-open:inline">Hide earlier</span>
                </summary>
                {earlier.map((group) => (
                  <YearGroup key={group.year} group={group} />
                ))}
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
