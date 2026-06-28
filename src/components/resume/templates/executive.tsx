import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { contactLine, projectLink } from "@/lib/resume/links";
import { rich } from "@/lib/resume/richtext";

/**
 * Executive: a conservative, corporate resume. Centred name, double-ruled
 * header, deep-navy section labels. Reads as senior and formal.
 */
export function ExecutiveTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800">
      <header className="border-y-2 border-neutral-900 py-4 text-center">
        <h1
          className={`text-3xl font-bold uppercase tracking-[0.12em] ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`mt-1 text-sm uppercase tracking-[0.25em] ${
            title.muted ? "text-neutral-300" : "text-[#1e3a5f]"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-2 text-xs text-neutral-600">
            {contactLine(basics, links, "  ·  ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Section title="Profile">
          <p className="text-neutral-700">{rich(basics.summary)}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-4">
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
                {exp.company ? (
                  <p className="text-sm italic text-[#1e3a5f]">{exp.company}</p>
                ) : null}
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700">
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
          <div className="space-y-3">
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
                <span className="shrink-0 text-xs text-neutral-500">
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
        <Section title="Projects">
          <div className="space-y-3">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-semibold text-neutral-900">
                  {pr.name || "Project"}
                  {pr.link ? (
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {projectLink(pr.link)}
                    </span>
                  ) : null}
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
    <section className="mt-5">
      <h2 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">
        {title}
      </h2>
      {children}
    </section>
  );
}
