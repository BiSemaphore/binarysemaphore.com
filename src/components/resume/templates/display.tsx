import type { TemplateProps } from "./types";
import { BaseSection } from "./parts";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { companyName, contactLine, projectLink } from "@/lib/resume/links";
import { rich, richBlock } from "@/lib/resume/richtext";

/**
 * Display: typography-forward. An enormous name set tight, a thin contact rule,
 * and quiet sans body. The name is the hero.
 */
export function DisplayTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800">
      <header>
        <h1
          className={`text-[56px] font-extrabold leading-[0.92] tracking-[-0.03em] ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {name.text}
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-neutral-900 pt-2">
          <p
            className={`text-sm font-medium uppercase tracking-[0.2em] ${
              title.muted ? "text-neutral-300" : "text-neutral-700"
            }`}
          >
            {title.text}
          </p>
          {contacts.length > 0 || links.length > 0 ? (
            <p className="text-xs text-neutral-500">
              {contactLine(basics, links, "  ·  ")}
            </p>
          ) : null}
        </div>
      </header>

      {basics.summary.trim() ? (
        <p className="mt-5 max-w-[58ch] text-[15px] leading-7 text-neutral-700">
          {rich(basics.summary)}
        </p>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-base font-bold text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal text-neutral-500">
                        {" "}
                        {companyName(exp.company, exp.companyUrl)}
                      </span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
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
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-bold text-neutral-900">
                  {pr.name || "Project"}
                  {pr.link ? (
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {projectLink(pr.link)}
                    </span>
                  ) : null}
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
    <BaseSection className="mt-6" headingClassName="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-neutral-900" title={title}>
      {children}
    </BaseSection>
  );
}
