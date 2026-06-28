"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveResume } from "@/app/resume/editor/[id]/actions";
import {
  DEFAULT_PAD,
  DEFAULT_SCALE,
  DENSITIES,
  PAD_MAX,
  PAD_MIN,
  PAGE_SIZES,
  SCALE_MAX,
  SCALE_MIN,
  TEMPLATES,
  TEXT_ALIGNS,
  clampPad,
  clampScale,
  densityForScale,
  type PageSize,
  type TextAlign,
  type ResumeContent,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeLink,
  type ResumeProject,
  type TemplateId,
} from "@/lib/resume/schema";
import { ResumePaper } from "@/components/resume/resume-paper";
import { RichTextarea } from "@/components/resume/rich-textarea";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const emptyExperience = (): ResumeExperience => ({
  company: "",
  companyUrl: "",
  role: "",
  start: "",
  end: "",
  current: false,
  bullets: [],
});
const emptyEducation = (): ResumeEducation => ({
  school: "",
  degree: "",
  field: "",
  start: "",
  end: "",
});
const emptyProject = (): ResumeProject => ({
  name: "",
  description: "",
  link: "",
});
const emptyLink = (): ResumeLink => ({ label: "", url: "" });

export function Editor({
  id,
  initialTitle,
  initialTemplateId,
  initialPageSize,
  initialScalePct,
  initialPadTop,
  initialPadBottom,
  initialTextAlign,
  initialContent,
}: {
  id: string;
  initialTitle: string;
  initialTemplateId: TemplateId;
  initialPageSize: PageSize;
  initialScalePct: number;
  initialPadTop: number;
  initialPadBottom: number;
  initialTextAlign: TextAlign;
  initialContent: ResumeContent;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplateId);
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [scalePct, setScalePct] = useState(initialScalePct);
  const [padTop, setPadTop] = useState(initialPadTop);
  const [padBottom, setPadBottom] = useState(initialPadBottom);
  const [textAlign, setTextAlign] = useState<TextAlign>(initialTextAlign);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [exporting, setExporting] = useState(false);
  const [tuneOpen, setTuneOpen] = useState(false);

  // Debounced autosave. Skip the first render (nothing changed yet).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    const t = setTimeout(async () => {
      const res = await saveResume(id, {
        title,
        templateId,
        pageSize,
        scalePct,
        padTop,
        padBottom,
        textAlign,
        content,
      });
      setStatus(res.ok ? "saved" : "error");
    }, 800);
    return () => clearTimeout(t);
  }, [
    id,
    title,
    templateId,
    pageSize,
    scalePct,
    padTop,
    padBottom,
    textAlign,
    content,
  ]);

  function resetTune() {
    setScalePct(DEFAULT_SCALE);
    setPadTop(DEFAULT_PAD);
    setPadBottom(DEFAULT_PAD);
  }

  // Export to PDF: flush any pending edits, then download the server-rendered
  // PDF directly (no browser print dialog).
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await saveResume(id, {
        title,
        templateId,
        pageSize,
        scalePct,
        padTop,
        padBottom,
        textAlign,
        content,
      });
      const res = await fetch(`/api/resume/${id}/pdf`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setStatus("error");
    } finally {
      setExporting(false);
    }
  }

  // --- content updaters -----------------------------------------------------
  const setBasics = (field: keyof ResumeContent["basics"], value: string) =>
    setContent((c) => ({ ...c, basics: { ...c.basics, [field]: value } }));

  function updateExperience(i: number, patch: Partial<ResumeExperience>) {
    setContent((c) => ({
      ...c,
      experience: c.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  }
  function updateEducation(i: number, patch: Partial<ResumeEducation>) {
    setContent((c) => ({
      ...c,
      education: c.education.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  }
  function updateProject(i: number, patch: Partial<ResumeProject>) {
    setContent((c) => ({
      ...c,
      projects: c.projects.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    }));
  }
  function updateLink(i: number, patch: Partial<ResumeLink>) {
    setContent((c) => ({
      ...c,
      links: c.links.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    }));
  }

  // Reorder an item within one of the repeatable sections (by +1 / -1).
  function moveItem(key: keyof ResumeContent, i: number, dir: -1 | 1) {
    setContent((c) => {
      const list = c[key];
      if (!Array.isArray(list)) return c;
      const j = i + dir;
      if (j < 0 || j >= list.length) return c;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...c, [key]: next };
    });
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="rx-pill font-mono text-xs">
            ← home
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Resume title"
            className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-foreground hover:border-border focus:border-border focus:bg-card focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <SaveIndicator status={status} />
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
            aria-label="Template"
            className="rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Tune popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTuneOpen((o) => !o)}
              aria-expanded={tuneOpen}
              className="rx-pill font-mono text-xs"
            >
              tune
            </button>
            {tuneOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close tune"
                  onClick={() => setTuneOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="rx-panel absolute right-0 top-full z-40 mt-2 w-[248px] p-3.5 font-mono text-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[color:var(--rx-muted)]">
                      {"// tune"}
                    </span>
                    <button
                      type="button"
                      onClick={resetTune}
                      className="text-[color:var(--rx-muted)] transition-colors hover:text-foreground"
                    >
                      reset
                    </button>
                  </div>
                  <Slider
                    label="scale"
                    value={scalePct}
                    min={SCALE_MIN}
                    max={SCALE_MAX}
                    step={1}
                    display={`${(scalePct / 100).toFixed(2)}x`}
                    onChange={(v) => setScalePct(clampScale(v))}
                  />
                  <div className="mt-3">
                    <Segmented
                      green
                      block
                      label="density"
                      options={DENSITIES}
                      value={densityForScale(scalePct)}
                      onChange={(d) => {
                        const preset = DENSITIES.find((x) => x.id === d);
                        if (preset) setScalePct(preset.scale);
                      }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3">
                    <Slider
                      label="pad top"
                      value={padTop}
                      min={PAD_MIN}
                      max={PAD_MAX}
                      step={1}
                      display={`${padTop}mm`}
                      onChange={(v) => setPadTop(clampPad(v))}
                    />
                    <Slider
                      label="pad bottom"
                      value={padBottom}
                      min={PAD_MIN}
                      max={PAD_MAX}
                      step={1}
                      display={`${padBottom}mm`}
                      onChange={(v) => setPadBottom(clampPad(v))}
                    />
                  </div>
                  <div className="mt-3">
                    <Segmented
                      green
                      block
                      label="page"
                      options={PAGE_SIZES}
                      value={pageSize}
                      onChange={setPageSize}
                    />
                  </div>

                  <div className="mt-3">
                    <Segmented
                      green
                      block
                      label="align"
                      options={TEXT_ALIGNS}
                      value={textAlign}
                      onChange={setTextAlign}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rx-pill rx-accent font-mono text-xs disabled:opacity-60"
          >
            {exporting ? "exporting…" : "export pdf"}
          </button>
        </div>
      </header>

      {/* Split: form (left) | live preview (right), like Overleaf. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left: form */}
        <div className="rx-scroll w-full overflow-auto border-b border-border font-sans lg:w-1/2 lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-2xl space-y-8 px-5 py-6">
              <FormSection title="Basics">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={content.basics.name}
                    onChange={(v) => setBasics("name", v)}
                  />
                  <Field
                    label="Title"
                    value={content.basics.title}
                    onChange={(v) => setBasics("title", v)}
                    placeholder="Software Engineer"
                  />
                  <Field
                    label="Email"
                    value={content.basics.email}
                    onChange={(v) => setBasics("email", v)}
                  />
                  <Field
                    label="Phone"
                    value={content.basics.phone}
                    onChange={(v) => setBasics("phone", v)}
                  />
                  <Field
                    label="Location"
                    value={content.basics.location}
                    onChange={(v) => setBasics("location", v)}
                  />
                  <Field
                    label="Website"
                    value={content.basics.website}
                    onChange={(v) => setBasics("website", v)}
                  />
                </div>
                <RichTextarea
                  label="Summary"
                  value={content.basics.summary}
                  onChange={(v) => setBasics("summary", v)}
                  rows={3}
                />
              </FormSection>

              <FormSection
                title="Experience"
                onAdd={() =>
                  setContent((c) => ({
                    ...c,
                    experience: [...c.experience, emptyExperience()],
                  }))
                }
              >
                {content.experience.map((exp, i) => (
                  <RepeatItem
                    key={i}
                    onRemove={() =>
                      setContent((c) => ({
                        ...c,
                        experience: c.experience.filter((_, j) => j !== i),
                      }))
                    }
                    onMoveUp={
                      i > 0 ? () => moveItem("experience", i, -1) : undefined
                    }
                    onMoveDown={
                      i < content.experience.length - 1
                        ? () => moveItem("experience", i, 1)
                        : undefined
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Role"
                        value={exp.role}
                        onChange={(v) => updateExperience(i, { role: v })}
                      />
                      <Field
                        label="Company"
                        value={exp.company}
                        onChange={(v) => updateExperience(i, { company: v })}
                      />
                      <Field
                        label="Start"
                        value={exp.start}
                        onChange={(v) => updateExperience(i, { start: v })}
                        placeholder="Jan 2023"
                      />
                      <Field
                        label="End"
                        value={exp.end}
                        onChange={(v) => updateExperience(i, { end: v })}
                        placeholder="Present"
                        disabled={exp.current}
                      />
                    </div>
                    <Field
                      label="Company website"
                      value={exp.companyUrl}
                      onChange={(v) => updateExperience(i, { companyUrl: v })}
                      placeholder="acme.com"
                    />
                    <label className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) =>
                          updateExperience(i, { current: e.target.checked })
                        }
                      />
                      I currently work here
                    </label>
                    <RichTextarea
                      label="Highlights (one per line)"
                      value={exp.bullets.join("\n")}
                      onChange={(v) =>
                        updateExperience(i, { bullets: v.split("\n") })
                      }
                      rows={3}
                      lists={false}
                    />
                  </RepeatItem>
                ))}
              </FormSection>

              <FormSection
                title="Education"
                onAdd={() =>
                  setContent((c) => ({
                    ...c,
                    education: [...c.education, emptyEducation()],
                  }))
                }
              >
                {content.education.map((ed, i) => (
                  <RepeatItem
                    key={i}
                    onRemove={() =>
                      setContent((c) => ({
                        ...c,
                        education: c.education.filter((_, j) => j !== i),
                      }))
                    }
                    onMoveUp={
                      i > 0 ? () => moveItem("education", i, -1) : undefined
                    }
                    onMoveDown={
                      i < content.education.length - 1
                        ? () => moveItem("education", i, 1)
                        : undefined
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="School"
                        value={ed.school}
                        onChange={(v) => updateEducation(i, { school: v })}
                      />
                      <Field
                        label="Degree"
                        value={ed.degree}
                        onChange={(v) => updateEducation(i, { degree: v })}
                      />
                      <Field
                        label="Field"
                        value={ed.field}
                        onChange={(v) => updateEducation(i, { field: v })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Start"
                          value={ed.start}
                          onChange={(v) => updateEducation(i, { start: v })}
                        />
                        <Field
                          label="End"
                          value={ed.end}
                          onChange={(v) => updateEducation(i, { end: v })}
                        />
                      </div>
                    </div>
                  </RepeatItem>
                ))}
              </FormSection>

              <FormSection title="Skills">
                <Field
                  label="Skills (comma separated)"
                  value={content.skills.join(", ")}
                  onChange={(v) =>
                    // Split on a comma plus any surrounding spaces. The value is
                    // re-joined with ", ", so splitting on "," alone would keep
                    // re-adding that space and make it accumulate as you type.
                    setContent((c) => ({ ...c, skills: v.split(/\s*,\s*/) }))
                  }
                  placeholder="Go, TypeScript, PostgreSQL"
                />
              </FormSection>

              <FormSection
                title="Projects"
                onAdd={() =>
                  setContent((c) => ({
                    ...c,
                    projects: [...c.projects, emptyProject()],
                  }))
                }
              >
                {content.projects.map((pr, i) => (
                  <RepeatItem
                    key={i}
                    onRemove={() =>
                      setContent((c) => ({
                        ...c,
                        projects: c.projects.filter((_, j) => j !== i),
                      }))
                    }
                    onMoveUp={
                      i > 0 ? () => moveItem("projects", i, -1) : undefined
                    }
                    onMoveDown={
                      i < content.projects.length - 1
                        ? () => moveItem("projects", i, 1)
                        : undefined
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Name"
                        value={pr.name}
                        onChange={(v) => updateProject(i, { name: v })}
                      />
                      <Field
                        label="Link"
                        value={pr.link}
                        onChange={(v) => updateProject(i, { link: v })}
                      />
                    </div>
                    <RichTextarea
                      label="Description"
                      value={pr.description}
                      onChange={(v) => updateProject(i, { description: v })}
                      rows={2}
                    />
                  </RepeatItem>
                ))}
              </FormSection>

              <FormSection
                title="Links"
                onAdd={() =>
                  setContent((c) => ({ ...c, links: [...c.links, emptyLink()] }))
                }
              >
                {content.links.map((l, i) => (
                  <RepeatItem
                    key={i}
                    onRemove={() =>
                      setContent((c) => ({
                        ...c,
                        links: c.links.filter((_, j) => j !== i),
                      }))
                    }
                    onMoveUp={i > 0 ? () => moveItem("links", i, -1) : undefined}
                    onMoveDown={
                      i < content.links.length - 1
                        ? () => moveItem("links", i, 1)
                        : undefined
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Label"
                        value={l.label}
                        onChange={(v) => updateLink(i, { label: v })}
                        placeholder="GitHub"
                      />
                      <Field
                        label="URL"
                        value={l.url}
                        onChange={(v) => updateLink(i, { url: v })}
                      />
                    </div>
                  </RepeatItem>
                ))}
              </FormSection>
          </div>
        </div>

        {/* Right: live preview (faithful, scaled A4 — matches the PDF). */}
        <div className="rx-scroll rx-canvas w-full overflow-auto lg:w-1/2">
          <div className="px-6 py-8">
            <ResumePaper
              templateId={templateId}
              content={content}
              pageSize={pageSize}
              scalePct={scalePct}
              padTop={padTop}
              padBottom={padBottom}
              align={textAlign}
              showPageBreaks
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A labelled range slider with a value readout. */
function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="text-[color:var(--rx-muted)]">{label}</span>
        <span className="text-foreground">{display}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="r-slider"
      />
    </label>
  );
}

/** A side-by-side row of options (segmented control). */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  green,
  block,
}: {
  label?: string;
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  green?: boolean;
  /** Full-width row with equal-width buttons (avoids wrapping in tight panels). */
  block?: boolean;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1 text-[color:var(--rx-muted)]">{label}</p>
      ) : null}
      <div
        role="group"
        aria-label={label ?? "options"}
        className={`${
          block ? "flex w-full" : "inline-flex flex-wrap"
        } overflow-hidden rounded-md border border-border`}
      >
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                block ? "flex-1 text-center" : ""
              } ${
                active
                  ? green
                    ? "rx-accent"
                    : "bg-foreground text-background"
                  : "text-[color:var(--rx-muted)] hover:bg-black/5"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- small building blocks --------------------------------------------------

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "saving…"
      : status === "saved"
        ? "saved"
        : status === "error"
          ? "save failed"
          : "";
  if (!label) return null;
  return (
    <span
      className={`rx-pill font-mono text-xs ${
        status === "error" ? "text-red-600" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      {label}
    </span>
  );
}

function FormSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          {title}
        </h2>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            + Add
          </button>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function RepeatItem({
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative space-y-3 rounded-card border border-border bg-card p-4">
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label="Move up"
          title="Move up"
          className="rounded-md px-1.5 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label="Move down"
          title="Move down"
          className="rounded-md px-1.5 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="rounded-md px-2 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-red-500"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-subtle">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none disabled:opacity-50"
      />
    </label>
  );
}
