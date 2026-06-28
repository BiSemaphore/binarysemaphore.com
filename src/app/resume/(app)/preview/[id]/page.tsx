import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMPLATES, isTemplateId } from "@/lib/resume/schema";
import { SAMPLE_RESUME } from "@/lib/resume/sample";
import { ResumePaper } from "@/components/resume/resume-paper";
import { CopyPromptButton } from "@/components/resume/copy-prompt-button";
import { useTemplateAction } from "@/app/resume/(app)/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tpl = TEMPLATES.find((t) => t.id === id);
  if (!tpl) return { title: "Template" };
  return {
    title: `${tpl.label} template`,
    description: tpl.description,
    alternates: {
      canonical: `https://resume.binarysemaphore.com/preview/${tpl.id}`,
    },
  };
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();
  const tpl = TEMPLATES.find((t) => t.id === id)!;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/templates" className="rx-pill font-mono text-xs">
            ← templates
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {tpl.label}
            </h1>
            <p className="font-mono text-xs text-[color:var(--rx-muted)]">
              {tpl.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyPromptButton
            template={tpl}
            className="rx-pill font-mono text-xs"
          />
          <form action={useTemplateAction}>
            <input type="hidden" name="templateId" value={tpl.id} />
            <button type="submit" className="rx-pill rx-accent font-mono text-xs">
              use this template
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-[820px]">
        <ResumePaper templateId={tpl.id} content={SAMPLE_RESUME} showPageBreaks />
      </div>
    </div>
  );
}
