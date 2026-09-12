/**
 * Derived views over a `TeamMember` for the detail page. Nothing here is copy:
 * every value is computed from `src/lib/site.ts`, so the page cannot claim a
 * number the data does not back.
 */
import { getStudioBuild, type Project, type TeamMember } from "@/lib/site";

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
      label: builds === 1 ? "studio build" : "studio builds",
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
