import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { companyName, contactLine, projectLink } from "@/lib/resume/links";
import { rich } from "@/lib/resume/richtext";

/**
 * Brutalist: bold and loud. Heavy black section bars with reversed labels,
 * oversized name, thick rules. A confident statement layout.
 */
export function BrutalistTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-900">
      <header className="border-b-4 border-neutral-900 pb-3">
        <h1
          className={`text-[40px] font-black uppercase leading-none tracking-tight ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <p
            className={`text-sm font-bold uppercase tracking-wide ${
              title.muted ? "text-neutral-300" : "text-neutral-700"
            }`}
          >
            {title.text}
          </p>
          {contacts.length > 0 || links.length > 0 ? (
            <p className="font-mono text-[11px] text-neutral-600">
              {contactLine(basics, links, " / ")}
            </p>
          ) : null}
        </div>
      </header>

      {basics.summary.trim() ? (
        <Section title="Profile">
          <p>{rich(basics.summary)}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-bold uppercase">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal normal-case text-neutral-600">
                        {" "}
                        — {companyName(exp.company, exp.companyUrl)}
                      </span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 font-mono text-[11px] text-neutral-600">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-1 space-y-0.5">
                    {exp.bullets
                      .filter((b) => b.trim())
                      .map((b, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="font-black">▪</span>
                          <span className="text-neutral-700">{rich(b)}</span>
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
        <Section title="Education">
          <div className="space-y-2">
            {education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-bold uppercase">{ed.school || "School"}</h3>
                  <p className="text-neutral-600">
                    {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-neutral-600">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {skillList.map((s) => (
              <span
                key={s}
                className="border-2 border-neutral-900 px-2 py-0.5 text-xs font-bold uppercase"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Projects">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-bold uppercase">
                  {pr.name || "Project"}
                  {pr.link ? (
                    <span className="ml-2 font-mono text-[11px] font-normal normal-case text-neutral-600">
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
    <section className="mt-4">
      <h2 className="mb-2 inline-block bg-neutral-900 px-2 py-0.5 text-xs font-black uppercase tracking-[0.2em] text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}
