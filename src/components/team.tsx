import { team } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/icons";

/**
 * Per-card accent. `ink` is the text color used on the solid avatar so it
 * stays legible (dark ink on the light/yellow accents).
 */
const accents = [
  { color: "var(--coral)", ink: "#fff" },
  { color: "var(--blue)", ink: "#fff" },
  { color: "var(--violet)", ink: "#fff" },
  { color: "var(--sun)", ink: "var(--foreground)" },
];

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

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => {
            const a = accents[i % accents.length];
            return (
              <li key={member.name} className="flex">
                <Reveal delay={(i % 4) * 80} className="flex w-full">
                  <article className="group flex w-full flex-col overflow-hidden rounded-panel border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                    {/* Colored header band with halftone dots */}
                    <div
                      className="relative h-24"
                      style={{
                        background: `linear-gradient(135deg, ${a.color}, color-mix(in oklab, ${a.color} 60%, #ffffff))`,
                      }}
                    >
                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-25"
                        style={{
                          backgroundImage:
                            "radial-gradient(#fff 1.5px, transparent 1.5px)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                    </div>

                    {/* Avatar overlapping the band */}
                    <div className="px-7">
                      <span
                        className="-mt-11 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border-4 border-card text-2xl font-extrabold shadow-soft transition-transform duration-300 group-hover:-rotate-3"
                        style={{ backgroundColor: a.color, color: a.ink }}
                        aria-hidden
                      >
                        {initials(member.name)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col px-7 pb-7 pt-4">
                      <h3 className="font-display text-xl font-bold leading-tight text-foreground">
                        {member.name}
                      </h3>
                      <p
                        className="mt-1 text-sm font-semibold"
                        style={{ color: a.color }}
                      >
                        {member.role}
                      </p>
                      {member.focus ? (
                        <p className="mt-0.5 text-xs uppercase tracking-wider text-subtle">
                          {member.focus}
                        </p>
                      ) : null}
                      {member.description ? (
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {member.description}
                        </p>
                      ) : null}

                      {member.email || member.linkedin || member.github ? (
                        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
                          {member.linkedin ? (
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noreferrer noopener"
                              aria-label={`${member.name} on LinkedIn`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                            >
                              <LinkedInIcon className="h-4 w-4" />
                            </a>
                          ) : null}
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              aria-label={`Email ${member.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                            >
                              <MailIcon className="h-4 w-4" />
                            </a>
                          ) : null}
                          {member.github ? (
                            <a
                              href={member.github}
                              target="_blank"
                              rel="noreferrer noopener"
                              aria-label={`${member.name} on GitHub`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                            >
                              <GitHubIcon className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
