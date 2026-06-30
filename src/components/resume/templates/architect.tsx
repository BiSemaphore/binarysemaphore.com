import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { companyName, contactItems, projectLink } from "@/lib/resume/links";
import { rich, richBlock } from "@/lib/resume/richtext";

/**
 * Architect: a drafting / blueprint feel. Thin rules, monospace labels with a
 * numeric index, lots of structure. Technical and precise.
 */
export function ArchitectTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);
  let n = 0;
  const idx = () => String(++n).padStart(2, "0");

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800">
      <header className="flex items-end justify-between gap-4 border-b-2 border-neutral-900 pb-3">
        <div>
          <h1
            className={`text-3xl font-bold tracking-tight ${
              name.muted ? "text-neutral-300" : "text-neutral-900"
            }`}
          >
            {name.text}
          </h1>
          <p
            className={`mt-0.5 font-mono text-xs uppercase tracking-[0.2em] ${
              title.muted ? "text-neutral-300" : "text-neutral-500"
            }`}
          >
            {title.text}
          </p>
        </div>
        {contacts.length > 0 || links.length > 0 ? (
          <div className="shrink-0 text-right font-mono text-[11px] text-neutral-600">
            {contactItems(basics, links).map((c, i) => (
              <p key={i}>{c}</p>
            ))}
          </div>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Section label={idx()} title="Profile">
          <p className="text-neutral-700">{rich(basics.summary)}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section label={idx()} title="Experience">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal text-neutral-500">
                        {" "}
                        / {companyName(exp.company, exp.companyUrl)}
                      </span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-neutral-700">
                    {exp.bullets
                      .filter((b) => b.trim())
                      .map((b, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-neutral-400">—</span>
                          <span>{rich(b)}</span>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {education.length > 0 ? (
        <Section label={idx()} title="Education">
          <div className="space-y-2">
            {education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {ed.school || "School"}
                  </h3>
                  <p className="text-neutral-600">
                    {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section label={idx()} title="Skills">
          <p className="font-mono text-xs text-neutral-700">
            {skillList.join("  ·  ")}
          </p>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section label={idx()} title="Projects">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-neutral-900">{pr.name || "Project"}</h3>
                  {pr.link ? (
                    <span className="shrink-0 font-mono text-[11px] font-normal text-neutral-500">
                      {projectLink(pr.link)}
                    </span>
                  ) : null}
                </div>
                {pr.description.trim() ? (
                  richBlock(pr.description, "text-neutral-700")
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </article>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-neutral-900">
        <span className="text-neutral-400">{label}</span>
        <span>{title}</span>
        <span className="h-px flex-1 bg-neutral-300" />
      </h2>
      {children}
    </section>
  );
}
