import { team } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";

/** Avatar accent color per card, cycling the candy palette. */
const accents = ["bg-coral", "bg-blue", "bg-violet"];

/** First letters of the first two words, e.g. "Sanny Kumar" -> "SK". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function Team() {
  if (team.length === 0) return null;

  return (
    <section id="team" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionHeading label="Team" title="The people behind it" />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <li key={member.name} className="flex">
              <Reveal delay={(i % 3) * 80} className="flex w-full">
                <div className="flex w-full flex-col items-start rounded-panel border border-border bg-card p-7 shadow-soft transition-transform duration-200 hover:-translate-y-1">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${accents[i % accents.length]}`}
                    aria-hidden
                  >
                    {initials(member.name)}
                  </span>

                  <h3 className="mt-5 text-xl text-foreground">{member.name}</h3>
                  <p className="mt-1 text-sm text-muted">{member.role}</p>

                  {member.github || member.linkedin ? (
                    <div className="mt-4 flex items-center gap-1">
                      {member.github ? (
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${member.name} on GitHub`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                        >
                          <GitHubIcon className="h-4 w-4" />
                        </a>
                      ) : null}
                      {member.linkedin ? (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${member.name} on LinkedIn`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                        >
                          <LinkedInIcon className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
