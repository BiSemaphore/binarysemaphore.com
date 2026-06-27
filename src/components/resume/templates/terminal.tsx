import type { TemplateProps } from "./types";
import { cleanList, formatRange, ph } from "./util";

/**
 * Terminal: a CLI / shell aesthetic. Prompt-style header, `$ cat section.md`
 * headers, `#` comment bullets, key=value contact block, and syntax-colored
 * accents on white. Full mono. Rendered as light "paper".
 */
export function TerminalTemplate({ content }: TemplateProps) {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const skillList = cleanList(skills);
  const user = (basics.name.trim().split(" ")[0] || "you").toLowerCase();

  const fields: { key: string; value: string }[] = [];
  if (basics.email.trim()) fields.push({ key: "email", value: basics.email });
  if (basics.website.trim()) fields.push({ key: "site", value: basics.website });
  if (basics.phone.trim()) fields.push({ key: "phone", value: basics.phone });
  if (basics.location.trim()) fields.push({ key: "loc", value: basics.location });
  for (const l of links) {
    if (l.url.trim())
      fields.push({ key: (l.label || "link").toLowerCase(), value: l.url });
  }

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white px-10 pt-[var(--rpt,2.5rem)] pb-[var(--rpb,2.5rem)] font-mono text-[12.5px] leading-relaxed text-neutral-800">
      {/* Prompt header */}
      <p className="text-[12px]">
        <span className="text-emerald-600">{user}</span>
        <span className="text-neutral-400"> @ </span>
        <span className="text-blue-600">resume</span>
        <span className="text-neutral-400"> : ~ $ </span>
        <span className="text-neutral-700">whoami</span>
      </p>

      <h1
        className={`mt-3 flex items-center text-3xl font-bold tracking-tight ${
          name.muted ? "text-neutral-300" : "text-neutral-900"
        }`}
      >
        {name.text}
        <span className="ml-1 inline-block h-6 w-2.5 translate-y-0.5 bg-blue-600" />
      </h1>
      {basics.title.trim() ? (
        <p className="mt-1 text-neutral-500">
          <span className="text-neutral-400">{"// "}</span>
          {basics.title}
        </p>
      ) : null}

      {/* key = value contact block */}
      {fields.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
          {fields.map((f) => (
            <p key={f.key + f.value}>
              <span className="text-blue-600">{f.key}</span>
              <span className="text-neutral-400"> = </span>
              <span className="text-emerald-600">&quot;{f.value}&quot;</span>
            </p>
          ))}
        </div>
      ) : null}

      {/* Summary */}
      {basics.summary.trim() ? (
        <Block>
          <Cmd cmd="cat" arg="summary.md" />
          <p className="mt-2 text-neutral-700">{basics.summary}</p>
        </Block>
      ) : null}

      {/* Experience */}
      {experience.length > 0 ? (
        <Block>
          <Cmd cmd="cat" arg="experience.md" />
          <div className="mt-2 space-y-4">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-bold text-neutral-900">
                    {exp.role || "Role"}
                    {exp.company ? (
                      <span className="font-normal text-blue-600">
                        {" "}
                        @ {exp.company}
                      </span>
                    ) : null}
                  </p>
                  <span className="shrink-0 text-[11px] text-neutral-500">
                    {formatRange(exp.start, exp.end, exp.current)}
                  </span>
                </div>
                {cleanList(exp.bullets).map((b, j) => (
                  <p key={j} className="text-neutral-700">
                    <span className="text-neutral-400"># </span>
                    {b}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Block>
      ) : null}

      {/* Projects */}
      {projects.length > 0 ? (
        <Block>
          <Cmd cmd="ls" arg="projects/" />
          <div className="mt-2 space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <p className="font-bold text-neutral-900">
                  {pr.name || "project"}
                  {pr.link ? (
                    <span className="font-normal text-blue-600"> · {pr.link}</span>
                  ) : null}
                </p>
                {pr.description.trim() ? (
                  <p className="text-neutral-700">{pr.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Block>
      ) : null}

      {/* Education */}
      {education.length > 0 ? (
        <Block>
          <Cmd cmd="cat" arg="education.md" />
          <div className="mt-2 space-y-1">
            {education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <p className="text-neutral-800">
                  <span className="font-bold">
                    {[ed.degree, ed.field].filter(Boolean).join(", ") ||
                      "Degree"}
                  </span>
                  {ed.school ? (
                    <span className="text-blue-600"> @ {ed.school}</span>
                  ) : null}
                </p>
                <span className="shrink-0 text-[11px] text-neutral-500">
                  {formatRange(ed.start, ed.end)}
                </span>
              </div>
            ))}
          </div>
        </Block>
      ) : null}

      {/* Skills as JSON */}
      {skillList.length > 0 ? (
        <Block>
          <Cmd cmd="cat" arg="skills.json" />
          <p className="mt-2">
            <span className="text-blue-600">&quot;skills&quot;</span>
            <span className="text-neutral-400">: [ </span>
            {skillList.map((s, i) => (
              <span key={s}>
                <span className="text-emerald-600">&quot;{s}&quot;</span>
                {i < skillList.length - 1 ? (
                  <span className="text-neutral-400">, </span>
                ) : null}
              </span>
            ))}
            <span className="text-neutral-400"> ]</span>
          </p>
        </Block>
      ) : null}

      <p className="mt-8 text-[11px] text-neutral-400">
        {"// resume.tsx · binarysemaphore.com"}
      </p>
    </article>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return <section className="mt-6">{children}</section>;
}

function Cmd({ cmd, arg }: { cmd: string; arg: string }) {
  return (
    <p>
      <span className="text-emerald-600">$ {cmd}</span>{" "}
      <span className="text-neutral-500">{arg}</span>
    </p>
  );
}
