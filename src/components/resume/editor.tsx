"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveResume } from "@/app/resume/editor/[id]/actions";
import {
  DENSITIES,
  TEMPLATES,
  densityZoom,
  type Density,
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
  initialDensity,
  initialContent,
}: {
  id: string;
  initialTitle: string;
  initialTemplateId: TemplateId;
  initialDensity: Density;
  initialContent: ResumeContent;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplateId);
  const [density, setDensity] = useState<Density>(initialDensity);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");

  // Debounced autosave. Skip the first render (nothing changed yet).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    const t = setTimeout(async () => {
      const res = await saveResume(id, { title, templateId, density, content });
      setStatus(res.ok ? "saved" : "error");
    }, 800);
    return () => clearTimeout(t);
  }, [id, title, templateId, density, content]);

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
            <label className="flex items-center gap-2">
              <span className="hidden font-mono text-xs text-subtle lg:inline">
                Template
              </span>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value as TemplateId)}
                aria-label="Template"
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Fit-to-page density */}
            <div
              role="group"
              aria-label="Density"
              className="hidden overflow-hidden rounded-lg border border-border sm:flex"
            >
              {DENSITIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDensity(d.id)}
                  aria-pressed={density === d.id}
                  title={`${d.label} spacing`}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    density === d.id
                      ? "bg-foreground text-background"
                      : "text-subtle hover:bg-card-hover"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <SaveIndicator status={status} />
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
          <div className="overflow-hidden rounded-card border border-border shadow-soft">
            <div className="max-h-[calc(100vh-7rem)] overflow-auto bg-neutral-100 p-4">
              <div style={{ zoom: densityZoom(density) } as React.CSSProperties}>
                {renderTemplate(templateId, content)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
