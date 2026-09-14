/**
 * Derived views over a `TeamMember` for the detail page. Nothing here is copy:
 * every value is computed from `src/lib/site.ts`, so the page cannot claim a
 * number the data does not back.
 */
import { getStudioBuild, type Project, type TeamEvent, type TeamMember } from "@/lib/site";

export type Fact = { value: string; label: string };

type Job = NonNullable<TeamMember["experience"]>[number];

/** A company and the consecutive roles held there, newest first. */
export type Stint = { company: string; location?: string; roles: Job[] };

/** Studio builds that resolve, in the order the member lists them. */
export function memberBuilds(member: TeamMember): Project[] {
  return (member.builds ?? [])
    .map((slug) => getStudioBuild(slug))
    .filter((p): p is Project => Boolean(p));
}

/**
 * Headline numbers for the fact strip. Each is included only when the data
 * behind it exists, so a sparse profile gets fewer tiles rather than zeros.
 */
export function memberFacts(member: TeamMember, now = new Date()): Fact[] {
  const facts: Fact[] = [];
  const jobs = member.experience ?? [];

  const years = jobs.flatMap((job) =>
    (job.period?.match(/\b(?:19|20)\d{2}\b/g) ?? []).map(Number),
  );
  if (years.length > 0) {
    const span = now.getFullYear() - Math.min(...years);
    if (span >= 1) {
      facts.push({
        value: `${span}+`,
        label: span === 1 ? "year shipping" : "years shipping",
      });
    }
  }

  const builds = memberBuilds(member).length;
  if (builds > 0) {
    facts.push({
      value: String(builds),
      label: builds === 1 ? "thing built here" : "things built here",
    });
  }

  const companies = new Set(jobs.map((job) => job.company)).size;
  if (companies > 0) {
    facts.push({
      value: String(companies),
      label: companies === 1 ? "company" : "companies",
    });
  }

  const certs = member.certifications?.length ?? 0;
  if (certs > 0) {
    facts.push({
      value: String(certs),
      label: certs === 1 ? "certification" : "certifications",
    });
  }

  return facts;
}

/**
 * Groups consecutive roles at the same company, so a promotion reads as one
 * stint with two titles instead of two unrelated jobs.
 */
export function groupStints(experience: TeamMember["experience"]): Stint[] {
  const stints: Stint[] = [];
  for (const job of experience ?? []) {
    const last = stints.at(-1);
    if (last && last.company === job.company) {
      last.roles.push(job);
    } else {
      stints.push({ company: job.company, location: job.location, roles: [job] });
    }
  }
  return stints;
}

type Certification = NonNullable<TeamMember["certifications"]>[number];

/** Certifications sharing an issue year, for the grouped credentials list. */
export type CertYear = { year: string; certs: Certification[] };

/**
 * Groups certifications by the four-digit year in `year`, newest first,
 * keeping each group in its listed order. Undated ones form a trailing
 * "Undated" group so nothing is dropped.
 */
export function groupCertsByYear(certs: TeamMember["certifications"]): CertYear[] {
  const byYear = new Map<string, Certification[]>();
  for (const cert of certs ?? []) {
    const year = cert.year?.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? "Undated";
    byYear.set(year, [...(byYear.get(year) ?? []), cert]);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => (a === "Undated" ? 1 : b === "Undated" ? -1 : Number(b) - Number(a)))
    .map(([year, certs]) => ({ year, certs }));
}

/** Events newest first. ISO dates sort as strings; ties keep listed order. */
export function sortEvents(events: TeamEvent[] | undefined): TeamEvent[] {
  return [...(events ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

/** The most recent event, for the hero line. */
export function latestEvent(member: TeamMember): TeamEvent | undefined {
  return sortEvents(member.events)[0];
}

/** Events sharing a start year, newest first. */
export type EventYear = { year: string; events: TeamEvent[] };

export function groupEventsByYear(events: TeamEvent[] | undefined): EventYear[] {
  const groups: EventYear[] = [];
  for (const event of sortEvents(events)) {
    const year = event.date.slice(0, 4);
    const last = groups.at(-1);
    if (last?.year === year) last.events.push(event);
    else groups.push({ year, events: [event] });
  }
  return groups;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-09-13" to "13 Sep 2026", "2026-09" to "Sep 2026", "2023" as is, and a
 * recurring event to "2023 to 2026". Parsed by hand so no timezone can shift
 * the day.
 */
export function formatEventDate(event: Pick<TeamEvent, "date" | "until">): string {
  const [year, month, day] = event.date.split("-");
  const monthName = month ? MONTHS[Number(month) - 1] : undefined;
  const start = [day ? String(Number(day)) : undefined, monthName, year]
    .filter(Boolean)
    .join(" ");
  return event.until && event.until !== year ? `${start} to ${event.until}` : start;
}

/** "Master of Computer Applications (MCA)" to its short form and full name. */
export function splitDegree(degree: string): { short: string | null; name: string } {
  const match = degree.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return match ? { short: match[2], name: match[1] } : { short: null, name: degree };
}
