import type { TemplateProps } from "./types";
import { cleanList, formatRange, ph } from "./util";

/**
 * Two-column: an emerald-accented layout with a left sidebar (skills, projects,
 * education, links) and a main column of experience. Mono `// section` labels.
 * Rendered as light "paper".
 */
export function TwoColTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const skillList = cleanList(skills);

  // Split the name so the last word can take the accent color.
  const parts = name.text.split(" ");
  const last = parts.length > 1 ? parts.pop() : "";
  const first = parts.join(" ");

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white px-[16mm] pt-[var(--rpt,15mm)] pb-[var(--rpb,15mm)] font-sans text-[13px] leading-relaxed text-neutral-800">
      {/* Header */}
      <header>
        <h1
          className={`text-4xl font-extrabold tracking-tight ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {first}
          {last ? <span className="text-emerald-600"> {last}</span> : null}
          <span className="text-emerald-600">.</span>
        </h1>
        {basics.title.trim() ? (
          <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {basics.title}
          </span>
        ) : null}
      </header>

      {/* About */}
      {basics.summary.trim() ? (
        <div className="mt-6 grid grid-cols-[140px_1fr] gap-x-6 border-b border-neutral-200 pb-6">
          <Label>about</Label>
          <p className="text-neutral-700">{basics.summary}</p>
        </div>
      ) : null}

      {/* Body */}
      <div className="mt-6 grid grid-cols-[200px_1fr] gap-x-8">
        {/* Sidebar */}
        <aside className="space-y-5 border-r border-neutral-200 pr-6">
          {skillList.length > 0 ? (
            <div>
              <Label>skills</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skillList.map((s) => (
                  <span
                    key={s}
                    className="rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <div>
              <Label>projects</Label>
              <div className="mt-2 space-y-3">
                {projects.map((pr, i) => (
                  <div key={i}>
                    <p className="font-semibold text-neutral-900">
                      {pr.name || "Project"}
                    </p>
                    {pr.link ? (
                      <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">
                        {pr.link}
                      </p>
                    ) : null}
                    {pr.description.trim() ? (
                      <p className="mt-0.5 text-xs text-neutral-600">
                        {pr.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {education.length > 0 ? (
            <div>
              <Label>education</Label>
              <div className="mt-2 space-y-2">
                {education.map((ed, i) => (
                  <div key={i}>
                    <p className="font-semibold text-neutral-900">
                      {ed.school || "School"}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {[ed.degree, ed.field].filter(Boolean).join(", ")}
                    </p>
                    <p className="font-mono text-[10px] text-neutral-500">
                      {formatRange(ed.start, ed.end)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {links.length > 0 ? (
            <div>
              <Label>links</Label>
              <div className="mt-2 space-y-1">
                {links.map((l, i) => (
                  <p key={i} className="text-xs text-neutral-700">
                    <span className="font-medium">{l.label || "Link"}</span>
                    {l.url ? (
                      <span className="text-neutral-500"> · {l.url}</span>
                    ) : null}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        {/* Main */}
        <div>
          <Label>experience</Label>
          <div className="mt-3 space-y-5">
            {experience.length === 0 ? (
              <p className="text-sm text-neutral-300">
                Add your experience to see it here.
              </p>
            ) : (
              experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-neutral-900">
                      {exp.role || "Role"}
                      {exp.company ? (
                        <span className="font-normal text-neutral-500">
                          {" "}
                          @ {exp.company}
                        </span>
                      ) : null}
                    </h3>
                    <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                      {formatRange(exp.start, exp.end, exp.current)}
                    </span>
                  </div>
                  {cleanList(exp.bullets).length > 0 ? (
                    <ul className="mt-1.5 space-y-1">
                      {cleanList(exp.bullets).map((b, j) => (
                        <li key={j} className="flex gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4 font-mono text-[11px] text-neutral-400">
        <span>{slug(name.text)}</span>
        <span>{basics.title}</span>
      </footer>
    </article>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] text-neutral-400">
      {"// "}
      {children}
    </p>
  );
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
