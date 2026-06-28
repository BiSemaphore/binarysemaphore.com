"use client";

import Link from "next/link";
import { useTemplateAction } from "@/app/resume/(app)/actions";
import { SAMPLE_RESUME } from "@/lib/resume/sample";
import type { Template } from "@/lib/resume/schema";
import { ResumePaper } from "@/components/resume/resume-paper";

/**
 * A template gallery card: a live mini-preview of the template, its name,
 * description and tags, plus "use" (create a resume) and "preview" actions.
 */
export function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white">
      {/* Live mini-preview, clipped to the card top. */}
      <Link
        href={`/preview/${template.id}`}
        aria-label={`Preview ${template.label}`}
        className="block max-h-72 overflow-hidden border-b border-black/5 bg-white p-3"
      >
        <div className="pointer-events-none">
          <ResumePaper templateId={template.id} content={SAMPLE_RESUME} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-foreground">
          {template.label}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[color:var(--rx-muted)]">
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

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/5 pt-3 font-mono text-xs">
          <span className="text-[color:var(--rx-muted)]">{template.id}</span>
          <div className="flex items-center gap-2">
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
