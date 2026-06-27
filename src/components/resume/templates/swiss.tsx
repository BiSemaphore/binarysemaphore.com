import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";

/**
 * Swiss / International style: strict baseline grid, numbered sections with
 * all-caps tracked labels in a left gutter, a cobalt block accent, right-aligned
 * dates. Rendered as light "paper".
 */
export function SwissTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  // Number only the sections that are present.
  const sections: { label: string; node: React.ReactNode }[] = [];
  if (basics.summary.trim())
    sections.push({
      label: "Profile",
      node: <p className="text-neutral-700">{basics.summary}</p>,
    });
  if (experience.length)
    sections.push({
      label: "Experience",
      node: (
        <div className="space-y-5">
          {experience.map((exp, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-semibold text-neutral-900">
                  {exp.role || "Role"}
                </h3>
                <span className="shrink-0 text-xs text-neutral-500">
                  {formatRange(exp.start, exp.end, exp.current)}
                </span>
              </div>
              {(exp.company || "").trim() ? (
                <p className="text-sm text-neutral-600">{exp.company}</p>
              ) : null}
              {cleanList(exp.bullets).length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {cleanList(exp.bullets).map((b, j) => (
                    <li key={j} className="flex gap-2 text-neutral-700">
                      <span className="text-blue-700">–</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ),
    });
  if (projects.length)
    sections.push({
      label: "Projects",
      node: (
        <div className="space-y-3">
          {projects.map((pr, i) => (
            <div key={i}>
              <h3 className="font-semibold text-neutral-900">
                {pr.name || "Project"}
                {pr.link ? (
                  <span className="ml-2 text-xs font-normal text-neutral-500">
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
      ),
    });
  if (education.length)
    sections.push({
      label: "Education",
      node: (
        <div className="space-y-2">
          {education.map((ed, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {ed.school || "School"}
                </h3>
                <p className="text-sm text-neutral-600">
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </p>
              </div>
              <span className="shrink-0 text-xs text-neutral-500">
                {formatRange(ed.start, ed.end)}
              </span>
            </div>
          ))}
        </div>
      ),
    });
  if (skillList.length)
    sections.push({
      label: "Skills",
      node: <p className="text-neutral-700">{skillList.join("   ·   ")}</p>,
    });

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white px-[16mm] pt-[var(--rpt,15mm)] pb-[var(--rpb,15mm)] font-sans text-[13px] leading-relaxed text-neutral-800">
      {/* Header */}
      <header className="flex items-start justify-between gap-6 border-b border-neutral-900 pb-5">
        <div className="flex gap-4">
          <span className="mt-1 h-16 w-2 shrink-0 bg-blue-700" aria-hidden />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
              Curriculum Vitae / 01
            </p>
            <h1
              className={`mt-1 text-4xl font-extrabold tracking-tight ${
                name.muted ? "text-neutral-300" : "text-neutral-900"
              }`}
            >
              {name.text}
            </h1>
            <p
              className={`mt-0.5 text-sm ${
                title.muted ? "text-neutral-300" : "text-neutral-600"
              }`}
            >
              {title.text}
            </p>
          </div>
        </div>
        {contacts.length > 0 || links.length > 0 ? (
          <div className="shrink-0 space-y-0.5 text-right font-mono text-[11px] text-neutral-600">
            {contacts.map((c) => (
              <p key={c}>{c}</p>
            ))}
            {links.map((l, i) => (
              <p key={i}>{l.label || l.url}</p>
            ))}
          </div>
        ) : null}
      </header>

      {/* Numbered sections */}
      <div className="mt-7 space-y-7">
        {sections.map((s, i) => (
          <section
            key={s.label}
            className="grid grid-cols-[120px_1fr] gap-x-6"
          >
            <div>
              <p className="font-mono text-xs font-bold text-blue-700">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-700">
                {s.label}
              </p>
            </div>
            <div>{s.node}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
