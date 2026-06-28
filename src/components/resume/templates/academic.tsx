import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";

/**
 * Academic: a LaTeX-CV aesthetic. Serif type, centred name, small-caps section
 * heads with a ruled underline, dense single column. Suits CVs / publications.
 */
export function AcademicTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-serif text-[12.5px] leading-snug text-neutral-800">
      <header className="text-center">
        <h1
          className={`text-[26px] font-semibold ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`mt-0.5 text-sm italic ${
            title.muted ? "text-neutral-300" : "text-neutral-600"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-1 text-xs text-neutral-600">
            {[...contacts, ...links.map((l) => l.label || l.url)].join("  ·  ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Section title="Statement">
          <p className="text-neutral-700">{basics.summary}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Appointments">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal italic text-neutral-600">
                        {" "}
                        — {exp.company}
                      </span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 text-xs italic text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-700">
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
        </Section>
      ) : null}

      {education.length > 0 ? (
        <Section title="Education">
          <div className="space-y-2">
            {education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {ed.school || "School"}
                  </h3>
                  <p className="italic text-neutral-600">
                    {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="shrink-0 text-xs italic text-neutral-500">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Selected Projects">
          <div className="space-y-1.5">
            {projects.map((pr, i) => (
              <div key={i}>
                <span className="font-semibold text-neutral-900">
                  {pr.name || "Project"}
                </span>
                {pr.description.trim() ? (
                  <span className="text-neutral-700">. {pr.description}</span>
                ) : null}
                {pr.link ? (
                  <span className="text-xs italic text-neutral-500">
                    {" "}
                    {pr.link}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section title="Technical Skills">
          <p className="text-neutral-700">{skillList.join(", ")}</p>
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
      <h2 className="mb-1.5 border-b border-neutral-400 pb-0.5 text-xs uppercase tracking-[0.18em] text-neutral-700">
        {title}
      </h2>
      {children}
    </section>
  );
}
