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
  clampPad,
  clampScale,
  densityForScale,
  pageSizeCss,
  scaleZoom,
  type PageSize,
  type ResumeContent,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeLink,
  type ResumeProject,
  type TemplateId,
} from "@/lib/resume/schema";
import { renderTemplate } from "@/components/resume/templates";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const emptyExperience = (): ResumeExperience => ({
  company: "",
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
  initialContent,
}: {
  id: string;
  initialTitle: string;
  initialTemplateId: TemplateId;
  initialPageSize: PageSize;
  initialScalePct: number;
  initialPadTop: number;
  initialPadBottom: number;
  initialContent: ResumeContent;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplateId);
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [scalePct, setScalePct] = useState(initialScalePct);
  const [padTop, setPadTop] = useState(initialPadTop);
  const [padBottom, setPadBottom] = useState(initialPadBottom);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
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
        content,
      });
      setStatus(res.ok ? "saved" : "error");
    }, 800);
    return () => clearTimeout(t);
  }, [id, title, templateId, pageSize, scalePct, padTop, padBottom, content]);

  function resetTune() {
    setScalePct(DEFAULT_SCALE);
    setPadTop(DEFAULT_PAD);
    setPadBottom(DEFAULT_PAD);
  }

  // CSS applied to the rendered resume (preview + print): zoom + page margins.
  const resumeVars = {
    zoom: scaleZoom(scalePct),
    "--rpt": `${padTop}mm`,
    "--rpb": `${padBottom}mm`,
  } as React.CSSProperties;

  // Print just the resume: a body class scopes the print stylesheet (globals.css)
  // so only the hidden .resume-print container shows in the PDF.
  function handleDownloadPdf() {
    const cleanup = () => {
      document.body.classList.remove("printing-resume");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    document.body.classList.add("printing-resume");
    window.print();
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

  return (
    <main className="flex-1">
      {/* Toolbar */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="shrink-0 font-mono text-xs text-subtle transition-colors hover:text-foreground"
            >
              ← Dashboard
            </Link>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Resume title"
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-foreground hover:border-border focus:border-border focus:bg-card focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator status={status} />
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-1.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Split: form | preview */}
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-8">
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
            <TextArea
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
                <TextArea
                  label="Highlights (one per line)"
                  value={exp.bullets.join("\n")}
                  onChange={(v) =>
                    updateExperience(i, { bullets: v.split("\n") })
                  }
                  rows={3}
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
                setContent((c) => ({ ...c, skills: v.split(",") }))
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
                <TextArea
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

        {/* Live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {/* Header: template row + a compact tune popover */}
          <div className="mb-3 flex items-end justify-between gap-3">
            <Segmented
              label="Template"
              options={TEMPLATES}
              value={templateId}
              onChange={setTemplateId}
            />

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setTuneOpen((o) => !o)}
                aria-expanded={tuneOpen}
                aria-haspopup="dialog"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${
                  tuneOpen
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-subtle hover:bg-card-hover hover:text-foreground"
                }`}
              >
                {"// tune"}
              </button>

              {tuneOpen ? (
                <>
                  {/* click-outside backdrop */}
                  <button
                    type="button"
                    aria-label="Close tune"
                    onClick={() => setTuneOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div
                    role="dialog"
                    aria-label="Tune"
                    className="absolute right-0 z-20 mt-2 w-72 rounded-card border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-mono text-xs text-subtle">{"// tune"}</p>
                      <button
                        type="button"
                        onClick={resetTune}
                        className="font-mono text-xs text-subtle transition-colors hover:text-foreground"
                      >
                        reset
                      </button>
                    </div>

                    <Slider
                      label="Scale"
                      value={scalePct}
                      min={SCALE_MIN}
                      max={SCALE_MAX}
                      step={1}
                      display={`${(scalePct / 100).toFixed(2)}x`}
                      onChange={(v) => setScalePct(clampScale(v))}
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-subtle">
                        density
                      </span>
                      <Segmented
                        options={DENSITIES}
                        value={densityForScale(scalePct)}
                        onChange={(d) => {
                          const preset = DENSITIES.find((x) => x.id === d);
                          if (preset) setScalePct(preset.scale);
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4">
                      <Slider
                        label="Pad top"
                        value={padTop}
                        min={PAD_MIN}
                        max={PAD_MAX}
                        step={1}
                        display={`${padTop}mm`}
                        onChange={(v) => setPadTop(clampPad(v))}
                      />
                      <Slider
                        label="Pad bottom"
                        value={padBottom}
                        min={PAD_MIN}
                        max={PAD_MAX}
                        step={1}
                        display={`${padBottom}mm`}
                        onChange={(v) => setPadBottom(clampPad(v))}
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-subtle">
                        page size
                      </span>
                      <Segmented
                        options={PAGE_SIZES}
                        value={pageSize}
                        onChange={setPageSize}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-card border border-border shadow-soft">
            <div className="max-h-[calc(100vh-9rem)] overflow-auto bg-neutral-100 p-4">
              <div style={resumeVars}>{renderTemplate(templateId, content)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print target: hidden on screen; the print stylesheet (globals.css,
          scoped to body.printing-resume) reveals only this for the PDF. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@page { size: ${pageSizeCss(pageSize)}; margin: 0; }`,
        }}
      />
      <div className="resume-print" aria-hidden>
        <div style={resumeVars}>{renderTemplate(templateId, content)}</div>
      </div>
    </main>
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
        <span className="font-mono text-xs text-subtle">{label}</span>
        <span className="font-mono text-xs text-foreground">{display}</span>
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
}: {
  label?: string;
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
          {label}
        </p>
      ) : null}
      <div
        role="group"
        aria-label={label ?? "options"}
        className="inline-flex flex-wrap overflow-hidden rounded-lg border border-border"
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              value === o.id
                ? "bg-foreground text-background"
                : "text-subtle hover:bg-card-hover"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- small building blocks --------------------------------------------------

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? "Save failed"
          : "";
  return (
    <span
      className={`font-mono text-xs ${
        status === "error" ? "text-red-500" : "text-subtle"
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
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative space-y-3 rounded-card border border-border bg-card p-4">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="absolute right-3 top-3 rounded-md px-2 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-red-500"
      >
        Remove
      </button>
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

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-subtle">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none"
      />
    </label>
  );
}
