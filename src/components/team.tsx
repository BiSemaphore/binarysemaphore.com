import type { SVGProps } from "react";
import { team } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/icons";

/* ---- Sticker icons (small, scattered on the cover) ------------------- */
type IconProps = SVGProps<SVGSVGElement>;
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

const IconCode = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);
const IconBraces = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M8 3c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3" />
    <path d="M16 3c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3" />
  </svg>
);
const IconTerminal = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m7 9 3 3-3 3M13 15h4" />
  </svg>
);
const IconBranch = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="6" cy="6" r="2.2" />
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="8" r="2.2" />
    <path d="M6 8.2v7.6M18 10.2c0 4-4 4.8-8 4.8" />
  </svg>
);
const IconChart = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M3 21h18" />
    <path d="M7 18v-6M12 18V7M17 18v-3" />
  </svg>
);
const IconLine = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 2 5-6" />
  </svg>
);
const IconClipboard = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3h6v1M9 10h6M9 14h4" />
  </svg>
);
const IconSearch = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.4-3.4" />
  </svg>
);

const devStickers = [IconCode, IconTerminal, IconBraces, IconBranch];
const dataStickers = [IconChart, IconClipboard, IconLine, IconSearch];

function stickersFor(role: string) {
  const r = role.toLowerCase();
  const isProduct = /product|data|analyst|manager/.test(r);
  return isProduct ? dataStickers : devStickers;
}

/* ---- Per-card accent + scatter positions ----------------------------- */
const accents = [
  { color: "var(--coral)", ink: "#fff" },
  { color: "var(--blue)", ink: "#fff" },
  { color: "var(--violet)", ink: "#fff" },
  { color: "var(--sun)", ink: "var(--foreground)" },
];

// position + resting rotation + the extra transform applied on card hover.
const slots = [
  "left-5 top-4 -rotate-12 group-hover:-translate-y-1 group-hover:-rotate-3",
  "right-6 top-5 rotate-6 group-hover:-translate-y-1.5 group-hover:rotate-12",
  "left-1/3 top-12 rotate-3 group-hover:-translate-y-1 group-hover:rotate-6",
  "right-1/4 top-14 -rotate-6 group-hover:-translate-y-1.5 group-hover:-rotate-12",
];

export function Team() {
  if (team.length === 0) return null;

  return (
    <section id="team" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionHeading label="Team" title="The people behind it" />

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => {
            const a = accents[i % accents.length];
            const stickers = stickersFor(member.role);
            // sticker icons sit on white chips, so use a darkened accent for contrast
            const stickerInk = `color-mix(in oklab, ${a.color} 72%, var(--foreground))`;
            const onLight = a.ink !== "#fff";

            return (
              <li key={member.name} className="flex">
                <Reveal delay={(i % 4) * 80} className="flex w-full">
                  <article className="group flex w-full flex-col overflow-hidden rounded-panel border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                    {/* Role cover: name + role + scattered stickers */}
                    <div
                      className="relative h-44 overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${a.color}, color-mix(in oklab, ${a.color} 58%, #ffffff))`,
                      }}
                    >
                      {/* halftone dot texture */}
                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "radial-gradient(#fff 1.5px, transparent 1.5px)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                      {/* sheen on hover */}
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/10"
                      />

                      {/* stickers */}
                      {stickers.map((Sticker, s) => (
                        <span
                          key={s}
                          aria-hidden
                          className={`absolute flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 ease-out ${slots[s]}`}
                          style={{ color: stickerInk }}
                        >
                          <Sticker className="h-4 w-4" />
                        </span>
                      ))}

                      {/* name + role */}
                      <div className="absolute inset-x-0 bottom-0 p-5 pr-20">
                        <h3
                          className={`font-display text-xl font-extrabold leading-tight ${
                            onLight
                              ? "text-foreground"
                              : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                          }`}
                        >
                          {member.name}
                        </h3>
                        <p
                          className={`text-sm font-semibold ${
                            onLight ? "text-foreground/80" : "text-white/90"
                          }`}
                        >
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {/* Body: contribution + description + links */}
                    <div className="flex flex-1 flex-col p-6">
                      {member.focus ? (
                        <p
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: a.color }}
                        >
                          {member.focus}
                        </p>
                      ) : null}
                      {member.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted">
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
