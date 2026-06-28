"use client";

import Link from "next/link";
import { useTemplateAction } from "@/app/resume/(app)/actions";
import { SAMPLE_RESUME } from "@/lib/resume/sample";
import type { Template } from "@/lib/resume/schema";
import { ResumePaper } from "@/components/resume/resume-paper";
import { CopyPromptButton } from "@/components/resume/copy-prompt-button";

/**
 * A template gallery card: a live mini-preview of the template, its name,
 * description and tags, plus "use" (create a resume) and "preview" actions.
 */
export function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      {/* Live mini-preview: a fixed-height window onto the top of the page,
          with a soft fade so the crop reads as intentional. */}
      <Link
        href={`/preview/${template.id}`}
        aria-label={`Preview ${template.label}`}
        className="relative block h-60 overflow-hidden border-b border-black/10 bg-neutral-50"
      >
        <div className="pointer-events-none px-4 pt-4">
          <ResumePaper
            templateId={template.id}
            content={SAMPLE_RESUME}
            frame={false}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-foreground">
          {template.label}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[color:var(--rx-muted)]">
          {template.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 px-2 py-0.5 font-mono text-[11px] text-[color:var(--rx-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Width-independent footer: id on its own line, actions on a fixed row
            below, so the card renders identically in any grid (home, gallery). */}
        <div className="mt-auto border-t border-black/5 pt-3 font-mono text-xs">
          <p className="mb-2 truncate text-[color:var(--rx-muted)]">
            {template.id}
          </p>
          <div className="flex items-center gap-2">
            <CopyPromptButton template={template} />
            <form action={useTemplateAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <button type="submit" className="rx-pill rx-accent">
                use
              </button>
            </form>
            <Link href={`/preview/${template.id}`} className="rx-pill">
              preview →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
