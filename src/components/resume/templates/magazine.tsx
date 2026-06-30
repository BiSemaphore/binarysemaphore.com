import type { TemplateProps } from "./types";
import { BaseSection } from "./parts";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { companyName, contactLine } from "@/lib/resume/links";
import { rich, richBlock } from "@/lib/resume/richtext";

/**
 * Magazine: a cover-style layout. A navy kicker, an oversized serif name, and
 * a tracked subtitle. Bold editorial styling distinct from Editorial's column.
 */
export function MagazineTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#003554]">
          The Résumé Issue
        </p>
        <h1
          className={`mt-1 font-serif text-[44px] font-bold leading-none tracking-tight ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`mt-2 text-sm uppercase tracking-[0.25em] ${
            title.muted ? "text-neutral-300" : "text-neutral-600"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-2 border-t border-neutral-300 pt-2 text-xs text-neutral-600">
            {contactLine(basics, links, "  ·  ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Section title="Feature">
          <p className="text-[15px] leading-7 text-neutral-700">
            {rich(basics.summary)}
          </p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-base font-bold text-neutral-900">
                    {exp.role || "Role"}
                  </h3>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.company ? (
                  <p className="text-xs uppercase tracking-[0.18em] text-[#003554]">
                    {companyName(exp.company, exp.companyUrl)}
                  </p>
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
                  <h3 className="font-serif font-bold text-neutral-900">
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
        <Section title="Portfolio">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-serif font-bold text-neutral-900">
                  {pr.name || "Project"}
                </h3>
                {pr.description.trim() ? (
                  richBlock(pr.description, "text-neutral-700")
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
    <BaseSection className="mt-5" headingClassName="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#003554]" title={title}>
      {children}
    </BaseSection>
  );
}
