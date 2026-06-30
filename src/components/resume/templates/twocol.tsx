import type { ReactNode } from "react";
import type { TemplateProps } from "./types";
import { cleanList, formatRange, ph } from "./util";
import {
  companyName,
  contactNodes,
  projectLink,
  linkAnchor,
} from "@/lib/resume/links";
import { rich, richBlock } from "@/lib/resume/richtext";

/**
 * Two-column: an emerald-accented layout with a left sidebar (skills, projects,
 * education, links) and a main column of experience. Mono `// section` labels.
 *
 * The layout is exposed as discrete parts (`twoColParts`) so the paginator can
 * break each column independently across pages (see ResumePaper's column-aware
 * path). `TwoColTemplate` composes the same parts into a single sheet for cards
 * and the non-paginated path.
 */

/** Fixed sidebar width and column gap, shared by the renderer and paginator. */
export const TWOCOL_SIDEBAR_WIDTH = "200px";
export const TWOCOL_GAP = "2rem";

export type ColumnParts = {
  /** Full-width header region (name, title, summary). Page 1 only. */
  top: ReactNode;
  /** Left sidebar flow (skills, projects, education, contact, links). */
  left: ReactNode;
  /** Main flow (experience). */
  right: ReactNode;
  /** Full-width footer. Last page only. */
  footer: ReactNode;
  leftWidth: string;
  gap: string;
  /** Classes for the article wrapper (font, colour, base size). */
  articleClassName: string;
  /** Classes for the sidebar content (spacing + inner padding). */
  asideClassName: string;
  /** Classes for the full-height sidebar rail (tint + divider). */
  railClassName: string;
};

export function twoColParts(content: TemplateProps["content"]): ColumnParts {
  const { basics, experience, education, skills, projects, links } = content;
  const name = ph(basics.name, "Your Name");
  const skillList = cleanList(skills);

  // Split the name so the last word can take the accent color.
  const parts = name.text.split(" ");
  const last = parts.length > 1 ? parts.pop() : "";
  const first = parts.join(" ");

  const top = (
    <>
      <header>
        <h1
          className={`text-4xl font-extrabold tracking-tight ${
            name.muted ? "text-neutral-300" : "text-neutral-900"
          }`}
        >
          {first}
          {last ? <span className="text-emerald-600"> {last}</span> : null}
          <span className="text-emerald-600">.</span>
        </h1>
        {basics.title.trim() ? (
          <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {basics.title}
          </span>
        ) : null}
      </header>

      {basics.summary.trim() ? (
        <div className="mt-6 grid grid-cols-[140px_1fr] gap-x-6 border-b border-neutral-200 pb-6">
          <Label>about</Label>
          <p className="text-neutral-700">{rich(basics.summary)}</p>
        </div>
      ) : null}
    </>
  );

  const left = (
    <>
      {skillList.length > 0 ? (
        <div>
          <Label>skills</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skillList.map((s) => (
              <span
                key={s}
                className="rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {contactNodes(basics).length > 0 ? (
        <div>
          <Label>contact</Label>
          <div className="mt-2 space-y-1">
            {contactNodes(basics).map((c, i) => (
              <p key={i} className="text-xs text-neutral-700">
                {c}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {links.length > 0 ? (
        <div>
          <Label>links</Label>
          <div className="mt-2 space-y-1">
            {links.map((l, i) => (
              <p key={i} className="text-xs text-neutral-700">
                <span className="font-medium">{linkAnchor(l)}</span>
                {l.url ? (
                  <span className="text-neutral-500"> · {l.url}</span>
                ) : null}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );

  const right = (
    <>
      <Label>experience</Label>
      <div className="mt-3 space-y-5">
        {experience.length === 0 ? (
          <p className="text-sm text-neutral-300">
            Add your experience to see it here.
          </p>
        ) : (
          experience.map((exp, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-semibold text-neutral-900">
                  {exp.role || "Role"}
                  {exp.company ? (
                    <span className="font-normal text-neutral-500">
                      {" "}
                      @ {companyName(exp.company, exp.companyUrl)}
                    </span>
                  ) : null}
                </h3>
                <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                  {formatRange(exp.start, exp.end, exp.current)}
                </span>
              </div>
              {cleanList(exp.bullets).length > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {cleanList(exp.bullets).map((b, j) => (
                    <li key={j} className="flex gap-2 text-neutral-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      <span>{rich(b)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </div>

      {projects.length > 0 ? (
        <div className="mt-6">
          <Label>projects</Label>
          <div className="mt-3 space-y-4">
            {projects.map((pr, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-neutral-900">
                    {pr.name || "Project"}
                  </h3>
                  {pr.link ? (
                    <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                      {projectLink(pr.link)}
                    </span>
                  ) : null}
                </div>
                {pr.description.trim() ? (
                  richBlock(pr.description, "mt-1 text-neutral-700")
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {education.length > 0 ? (
        <div className="mt-6">
          <Label>education</Label>
          <div className="mt-3 space-y-3">
            {education.map((ed, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-neutral-900">
                    {ed.school || "School"}
                  </h3>
                  <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                    {formatRange(ed.start, ed.end)}
                  </span>
                </div>
                {[ed.degree, ed.field].filter(Boolean).length > 0 ? (
                  <p className="mt-0.5 text-neutral-600">
                    {[ed.degree, ed.field].filter(Boolean).join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );

  const footer = (
    <footer className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4 font-mono text-[11px] text-neutral-400">
      <span>{slug(name.text)}</span>
      <span>{basics.title}</span>
    </footer>
  );

  return {
    top,
    left,
    right,
    footer,
    leftWidth: TWOCOL_SIDEBAR_WIDTH,
    gap: TWOCOL_GAP,
    articleClassName:
      "w-full bg-white font-sans text-[13px] leading-relaxed text-neutral-800",
    asideClassName: "space-y-5 pr-6",
    railClassName: "border-r border-neutral-200",
  };
}

export function TwoColTemplate({ content }: TemplateProps) {
  const p = twoColParts(content);
  return (
    <article className={p.articleClassName}>
      {p.top}
      <div
        className="mt-6 grid"
        style={{ gridTemplateColumns: `${p.leftWidth} 1fr`, columnGap: p.gap }}
      >
        <aside className={`${p.railClassName} ${p.asideClassName}`}>
          {p.left}
        </aside>
        <div>{p.right}</div>
      </div>
      {p.footer}
    </article>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] text-neutral-400">
      {"// "}
      {children}
    </p>
  );
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}
