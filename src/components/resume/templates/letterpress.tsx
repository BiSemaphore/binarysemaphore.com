import type { TemplateProps } from "./types";
import { cleanList, contactBits, formatRange, ph } from "./util";
import { contactLine } from "@/lib/resume/links";
import { rich } from "@/lib/resume/richtext";

/**
 * Letterpress: warm and literary. A cream sheet, serif type, italic accents,
 * and centred small-caps section heads. Reads like fine correspondence.
 */
export function LetterpressTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const title = ph(basics.title, "Your professional title");
  const contacts = contactBits(basics);
  const skillList = cleanList(skills);

  return (
    <article className="w-full bg-white font-serif text-[13px] leading-relaxed text-[#3a352c]">
      <header className="text-center">
        <h1
          className={`text-[30px] font-bold tracking-wide ${
            name.muted ? "text-[#cabfa8]" : "text-[#2a2620]"
          }`}
        >
          {name.text}
        </h1>
        <p
          className={`mt-1 text-sm italic ${
            title.muted ? "text-[#cabfa8]" : "text-[#6b6253]"
          }`}
        >
          {title.text}
        </p>
        {contacts.length > 0 || links.length > 0 ? (
          <p className="mt-2 text-xs text-[#6b6253]">
            {contactLine(basics, links, "  ·  ")}
          </p>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <Section title="In Brief">
          <p className="text-center italic text-[#534b3e]">{rich(basics.summary)}</p>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-bold text-[#2a2620]">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal italic text-[#6b6253]">
                        {" "}
                        — {exp.company}
                      </span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 text-xs italic text-[#8a8073]">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {exp.bullets.filter((b) => b.trim()).length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[#534b3e]">
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
                  <h3 className="font-bold text-[#2a2620]">
                    {ed.school || "School"}
                  </h3>
                  <p className="italic text-[#6b6253]">
                    {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span className="shrink-0 text-xs italic text-[#8a8073]">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillList.length > 0 ? (
        <Section title="Skills">
          <p className="text-center text-[#534b3e]">{skillList.join("  ·  ")}</p>
        </Section>
      ) : null}

      {projects.length > 0 ? (
        <Section title="Works">
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <h3 className="font-bold text-[#2a2620]">
                  {pr.name || "Project"}
                </h3>
                {pr.description.trim() ? (
                  <p className="text-[#534b3e]">{rich(pr.description)}</p>
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
      <h2 className="mb-2 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-[#8a8073]">
        <span className="h-px w-8 bg-[#cabfa8]" />
        {title}
        <span className="h-px w-8 bg-[#cabfa8]" />
      </h2>
      {children}
    </section>
  );
}
