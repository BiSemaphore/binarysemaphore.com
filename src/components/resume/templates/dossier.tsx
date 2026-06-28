import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";

/**
 * Dossier: a case-file aesthetic. A bordered header block with field labels, a
 * monospace meta strip, and boxed sections. Structured and official.
 */
export function DossierTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800">
      <header className="border-2 border-neutral-900 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Personnel File
        </p>
        <h1
          className={`mt-0.5 text-2xl font-bold uppercase tracking-wide ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`text-sm ${
            title.muted ? "text-neutral-300" : "text-neutral-600"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-2 border-t border-dashed border-neutral-400 pt-1.5 font-mono text-[11px] text-neutral-600">
            {[...contacts, ...links.map((l) => l.label || l.url)].join("  //  ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Section title="Brief">
          <p className="text-neutral-700">{basics.summary}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Record">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal text-neutral-500">
                        {" "}
                        — {exp.company}
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
                          <span className="font-mono text-neutral-400">›</span>
                          <span>{b}</span>
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
        <Section title="Credentials">
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
        <Section title="Aptitudes">
          <p className="font-mono text-xs text-neutral-700">
            {skillList.join("  ·  ")}
          </p>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Casework">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-semibold text-neutral-900">
                  {pr.name || "Project"}
                </h3>
                {pr.description.trim() ? (
                  <p className="text-neutral-700">{pr.description}</p>
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
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 inline-block border border-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
