import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";

/**
 * Spec Sheet: a datasheet aesthetic. Monospace labels in a left rail, content in
 * the right column, hairline row rules. Reads like a technical spec.
 */
export function SpecsheetTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800">
      <header className="border-b-2 border-neutral-900 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Specification
        </p>
        <h1
          className={`text-2xl font-bold ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`font-mono text-xs ${
            title.muted ? "text-neutral-300" : "text-neutral-600"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-1 font-mono text-[11px] text-neutral-600">
            {[...contacts, ...links.map((l) => l.label || l.url)].join("  ·  ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Row label="overview">
          <p className="text-neutral-700">{basics.summary}</p>
        </Row>
      ) : null}

      {experience.length > 0 ? (
        <Row label="experience">
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
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700">
                    {exp.bullets
                      .filter((b) => b.trim())
                      .map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Row>
      ) : null}

      {education.length > 0 ? (
        <Row label="education">
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
        </Row>
      ) : null}

      {skillList.length > 0 ? (
        <Row label="skills">
          <p className="font-mono text-xs text-neutral-700">
            {skillList.join("  ·  ")}
          </p>
        </Row>
      ) : null}

      {projects.length > 0 ? (
        <Row label="projects">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-semibold text-neutral-900">
                  {pr.name || "Project"}
                  {pr.link ? (
                    <span className="ml-2 font-mono text-[11px] font-normal text-neutral-500">
                      {pr.link}
                    </span>
                  ) : null}
                </h3>
                {pr.description.trim() ? (
                  <p className="text-neutral-700">{pr.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Row>
      ) : null}
    </article>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-[88px_1fr] gap-3 border-b border-neutral-200 py-3 last:border-b-0">
      <div className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400">
        {label}
      </div>
      <div>{children}</div>
    </section>
  );
}
