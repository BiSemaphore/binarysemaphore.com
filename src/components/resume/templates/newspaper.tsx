import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { rich } from "@/lib/resume/richtext";

/**
 * Newspaper: a broadsheet masthead with a black title bar, serif type, and a
 * ruled byline strip. Distinctive editorial / journalistic feel.
 */
export function NewspaperTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "The Daily Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-serif text-[12.5px] leading-snug text-neutral-800">
      <header className="border-y-[3px] border-double border-neutral-900 py-2 text-center">
        <h1
          className={`text-[34px] font-black uppercase leading-none tracking-tight ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-neutral-600">
        <span>{title.text}</span>
        {contacts.length > 0 || links.length > 0 ? (
          <span>
            {[...contacts, ...links.map((l) => l.label || l.url)].join("  ·  ")}
          </span>
        ) : null}
      </div>

      {basics.summary.trim() ? (
        <Section title="Lead">
          <p className="first-letter:float-left first-letter:mr-1 first-letter:font-black first-letter:text-[34px] first-letter:leading-[0.8]">
            {rich(basics.summary)}
          </p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Career">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-bold text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal italic"> — {exp.company}</span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 font-sans text-[10px] uppercase tracking-wide text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-700">
                    {exp.bullets
                      .filter((b) => b.trim())
                      .map((b, j) => (
                        <li key={j}>{rich(b)}</li>
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
                  <h3 className="font-bold text-neutral-900">
                    {ed.school || "School"}
                  </h3>
                  <p className="italic text-neutral-600">
                    {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="shrink-0 font-sans text-[10px] uppercase tracking-wide text-neutral-500">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section title="Skills">
          <p className="text-neutral-700">{skillList.join("  ·  ")}</p>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Notable Work">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-bold text-neutral-900">
                  {pr.name || "Project"}
                </h3>
                {pr.description.trim() ? (
                  <p className="text-neutral-700">{rich(pr.description)}</p>
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
      <h2 className="mb-1.5 border-b border-neutral-900 pb-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
