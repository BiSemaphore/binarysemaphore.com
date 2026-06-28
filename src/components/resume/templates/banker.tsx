import type { TemplateProps } from "./types";
import { BaseSection } from "./parts";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { companyName, contactLine } from "@/lib/resume/links";
import { rich } from "@/lib/resume/richtext";

/**
 * Banker: a formal letterhead. Centred serif name over a burgundy rule, with
 * conservative spacing. Reads as finance / law / consulting.
 */
export function BankerTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-serif text-[13px] leading-relaxed text-neutral-800">
      <header className="text-center">
        <h1
          className={`text-[28px] font-bold tracking-wide ${
            name.muted ? "text-neutral-300" : "text-[#6b1f2a]"
          }`}
        >
          {name.text}
        </h1>
        <div className="mx-auto my-2 h-[2px] w-24 bg-[#6b1f2a]" />
        <p
          className={`text-sm uppercase tracking-[0.2em] ${
            title.muted ? "text-neutral-300" : "text-neutral-600"
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
        <Section title="Professional Experience">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-bold text-neutral-900">
                    {companyName(exp.company, exp.companyUrl, exp.role || "Company")}
                  </h3>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.role && exp.company ? (
                  <p className="italic text-neutral-600">{exp.role}</p>
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
                <span className="shrink-0 text-xs text-neutral-500">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section title="Competencies">
          <p className="text-neutral-700">{skillList.join("  ·  ")}</p>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Selected Engagements">
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
    <BaseSection className="mt-5" headingClassName="mb-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#6b1f2a]" title={title}>
      {children}
    </BaseSection>
  );
}
