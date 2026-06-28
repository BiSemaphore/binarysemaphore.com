import type { TemplateProps } from "./types";
import { cleanList, formatRange, ph } from "./util";
import { linkAnchor } from "@/lib/resume/links";
import { rich } from "@/lib/resume/richtext";

/**
 * Editorial: a magazine-style serif resume with an oversized stacked name,
 * all-caps tracked section heads, a pull-quote profile, and a two-column index
 * at the foot. Rendered as light "paper".
 */
export function EditorialTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const skillList = cleanList(skills);

  const parts = name.text.split(" ");
  const last = parts.length > 1 ? parts.pop() : "";
  const first = parts.join(" ");

  const reach = [basics.email, basics.website, basics.location]
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="w-full bg-white font-serif text-[13px] leading-relaxed text-neutral-800">
      {/* Header */}
      <header className="flex items-start justify-between gap-8 border-b border-neutral-900 pb-5">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
            The Resume
          </p>
          <h1
            className={`mt-2 text-5xl leading-[0.95] tracking-tight ${
              name.muted ? "text-neutral-300" : "text-neutral-900"
            }`}
          >
            {first}
            {last ? (
              <>
                <br />
                <span className="italic">{last}</span>
              </>
            ) : null}
          </h1>
        </div>

        <dl className="shrink-0 space-y-2 border-l border-neutral-300 pl-6 text-xs">
          {basics.title.trim() ? (
            <MetaRow label="Title">{basics.title}</MetaRow>
          ) : null}
          {reach.length > 0 ? (
            <MetaRow label="Reach">
              {reach.map((r) => (
                <span key={r} className="block">
                  {r}
                </span>
              ))}
            </MetaRow>
          ) : null}
          {links.length > 0 ? (
            <MetaRow label="Online">
              {links.map((l, i) => (
                <span key={i} className="block">
                  {linkAnchor(l)}
                </span>
              ))}
            </MetaRow>
          ) : null}
        </dl>
      </header>

      {/* Profile */}
      {basics.summary.trim() ? (
        <section className="mt-6">
          <Head>The Profile</Head>
          <p className="mt-3 text-lg leading-7">
            <span className="float-left mr-2 font-serif text-5xl leading-[0.7] text-neutral-300">
              &ldquo;
            </span>
            {rich(basics.summary)}
          </p>
        </section>
      ) : null}

      {/* Experience */}
      {experience.length > 0 ? (
        <section className="mt-7">
          <Head>The Experience</Head>
          <div className="mt-4 space-y-5">
            {experience.map((exp, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr] gap-x-5">
                <p className="pt-0.5 text-xs italic text-neutral-500">
                  {formatRange(exp.start, exp.end, exp.current)}
                </p>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {exp.role || "Role"}
                  </h3>
                  {exp.company.trim() ? (
                    <p className="text-sm">
                      <span className="italic">{exp.company}</span>
                    </p>
                  ) : null}
                  {cleanList(exp.bullets).length > 0 ? (
                    <ul className="mt-1.5 space-y-1">
                      {cleanList(exp.bullets).map((b, j) => (
                        <li key={j} className="flex gap-2 text-neutral-700">
                          <span>–</span>
                          <span>{rich(b)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Index */}
      {(projects.length > 0 ||
        education.length > 0 ||
        skillList.length > 0) ? (
        <section className="mt-8">
          <Head>The Index</Head>
          <div className="mt-4 grid grid-cols-2 gap-8">
            <div>
              {projects.length > 0 ? (
                <>
                  <SubHead>Projects</SubHead>
                  <div className="space-y-2">
                    {projects.map((pr, i) => (
                      <div key={i}>
                        <p className="font-bold text-neutral-900">
                          {pr.name || "Project"}
                        </p>
                        {pr.description.trim() ? (
                          <p className="text-neutral-700">{rich(pr.description)}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-4">
              {education.length > 0 ? (
                <div>
                  <SubHead>Education</SubHead>
                  {education.map((ed, i) => (
                    <div key={i}>
                      <p className="font-bold text-neutral-900">
                        {ed.school || "School"}
                      </p>
                      <p className="text-neutral-700">
                        {[ed.degree, ed.field].filter(Boolean).join(", ")}
                        {ed.start || ed.end
                          ? ` · ${formatRange(ed.start, ed.end)}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {skillList.length > 0 ? (
                <div>
                  <SubHead accent>Skills</SubHead>
                  <p className="text-neutral-700">{skillList.join(", ")}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-14 shrink-0 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </dt>
      <dd className="text-neutral-700">{children}</dd>
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-neutral-300 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-700">
      {children}
    </h2>
  );
}

function SubHead({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <h3
      className={`mb-1 border-b pb-1 text-sm italic ${
        accent ? "border-amber-700/40 text-amber-800" : "border-neutral-200"
      }`}
    >
      {children}
    </h3>
  );
}
