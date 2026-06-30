"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  type ResumeContent,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeLink,
  type ResumeListKey,
  type ResumeProject,
} from "@/lib/resume/schema";
import { Field, FormSection, RepeatItem } from "@/components/resume/editor-ui";
import { RichTextarea } from "@/components/resume/rich-textarea";

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

/** The left-hand editing form for a resume. Owns all content mutations. */
export function ResumeForm({
  content,
  setContent,
}: {
  content: ResumeContent;
  setContent: Dispatch<SetStateAction<ResumeContent>>;
}) {
  const setBasics = (field: keyof ResumeContent["basics"], value: string) =>
    setContent((c) => ({ ...c, basics: { ...c.basics, [field]: value } }));

  const updateExperience = (i: number, patch: Partial<ResumeExperience>) =>
    setContent((c) => ({
      ...c,
      experience: c.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  const updateEducation = (i: number, patch: Partial<ResumeEducation>) =>
    setContent((c) => ({
      ...c,
      education: c.education.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  const updateProject = (i: number, patch: Partial<ResumeProject>) =>
    setContent((c) => ({
      ...c,
      projects: c.projects.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    }));
  const updateLink = (i: number, patch: Partial<ResumeLink>) =>
    setContent((c) => ({
      ...c,
      links: c.links.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    }));

  const removeAt = (key: ResumeListKey, i: number) =>
    setContent((c) => ({ ...c, [key]: c[key].filter((_, j) => j !== i) }));

  // Reorder an item within one of the repeatable (array) sections (+1 / -1).
  const moveItem = (key: ResumeListKey, i: number, dir: -1 | 1) =>
    setContent((c) => {
      const list = c[key];
      const j = i + dir;
      if (j < 0 || j >= list.length) return c;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...c, [key]: next };
    });

  // Shared up/down props for an item at index `i` in section `key`.
  const moveProps = (key: ResumeListKey, i: number, length: number) => ({
    onMoveUp: i > 0 ? () => moveItem(key, i, -1) : undefined,
    onMoveDown: i < length - 1 ? () => moveItem(key, i, 1) : undefined,
  });

  return (
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
            onRemove={() => removeAt("experience", i)}
            {...moveProps("experience", i, content.experience.length)}
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
              onChange={(v) => updateExperience(i, { bullets: v.split("\n") })}
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
            onRemove={() => removeAt("education", i)}
            {...moveProps("education", i, content.education.length)}
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
            onRemove={() => removeAt("projects", i)}
            {...moveProps("projects", i, content.projects.length)}
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
            onRemove={() => removeAt("links", i)}
            {...moveProps("links", i, content.links.length)}
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
  );
}
