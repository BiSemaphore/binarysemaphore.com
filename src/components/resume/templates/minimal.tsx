import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { contactLine } from "@/lib/resume/links";
import { rich } from "@/lib/resume/richtext";

/**
 * Minimal: ultra-spare. No rules, light weights, lots of whitespace. Section
 * labels are tiny and tracked; the content does the talking.
 */
export function MinimalTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] font-light leading-relaxed text-neutral-700">
      <header>
        <h1
          className={`text-4xl font-light tracking-tight ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`mt-1 text-base ${
            title.muted ? "text-neutral-300" : "text-neutral-500"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-3 text-xs text-neutral-500">
            {contactLine(basics, links, "   /   ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <p className="mt-6 max-w-[52ch] text-neutral-600">{rich(basics.summary)}</p>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-5">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-normal text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="text-neutral-400"> · {exp.company}</span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-1.5 space-y-1 text-neutral-600">
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
                <span className="text-neutral-900">
                  {ed.school || "School"}
                  {[ed.degree, ed.field].filter(Boolean).length > 0 ? (
                    <span className="text-neutral-400">
                      {" "}
                      · {[ed.degree, ed.field].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section title="Skills">
          <p className="text-neutral-600">{skillList.join("   ·   ")}</p>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Projects">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <span className="text-neutral-900">{pr.name || "Project"}</span>
                {pr.description.trim() ? (
                  <span className="text-neutral-500"> — {rich(pr.description)}</span>
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
    <section className="mt-7">
      <h2 className="mb-2.5 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
