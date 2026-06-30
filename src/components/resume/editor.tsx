"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { saveResume } from "@/app/resume/editor/[id]/actions";
import {
  DEFAULT_PAD,
  DEFAULT_SCALE,
  TEMPLATES,
  type PageSize,
  type TextAlign,
  type ResumeContent,
  type TemplateId,
} from "@/lib/resume/schema";
import { ResumePaper } from "@/components/resume/resume-paper";
import { ResumeForm } from "@/components/resume/resume-form";
import { TunePanel } from "@/components/resume/tune-panel";
import { SaveIndicator, type SaveStatus } from "@/components/resume/editor-ui";

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
  const [exportError, setExportError] = useState(false);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const patch = {
    title,
    templateId,
    pageSize,
    scalePct,
    padTop,
    padBottom,
    textAlign,
    content,
  };

  // Debounced autosave. Skip the first render (nothing changed yet).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    const t = setTimeout(async () => {
      const res = await saveResume(id, patch);
      setStatus(res.ok ? "saved" : "error");
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Trigger a client-side file download from a blob.
  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Export the resume (content + presentation) as a JSON file for portability.
  function handleExportJson() {
    const data = { version: 1, ...patch };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    download(blob, `${title || "resume"}.json`);
  }

  // Export to PDF: flush any pending edits, then download the server-rendered
  // PDF directly (no browser print dialog).
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setExportError(false);
    try {
      await saveResume(id, patch);
      const res = await fetch(`/api/resume/${id}/pdf`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      download(await res.blob(), `${title || "resume"}.pdf`);
    } catch {
      // Distinct from a save error: the resume is saved, the PDF render failed.
      setExportError(true);
    } finally {
      setExporting(false);
    }
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
              <TunePanel
                scalePct={scalePct}
                setScalePct={setScalePct}
                padTop={padTop}
                setPadTop={setPadTop}
                padBottom={padBottom}
                setPadBottom={setPadBottom}
                pageSize={pageSize}
                setPageSize={setPageSize}
                textAlign={textAlign}
                setTextAlign={setTextAlign}
                onReset={resetTune}
                onClose={() => setTuneOpen(false)}
              />
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="rx-pill font-mono text-xs"
          >
            json
          </button>

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

      {exportError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 font-mono text-xs text-red-700"
        >
          <span>PDF export failed. Your changes are saved — try again.</span>
          <button
            type="button"
            onClick={() => setExportError(false)}
            aria-label="Dismiss"
            className="shrink-0 px-1 text-red-700/70 transition-colors hover:text-red-700"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Mobile-only Edit / Preview toggle (desktop shows both side by side). */}
      <div className="flex border-b border-border p-2 lg:hidden">
        <div className="mx-auto inline-flex overflow-hidden rounded-lg border border-border font-mono text-xs">
          {(["edit", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMobileView(v)}
              aria-pressed={mobileView === v}
              className={`px-4 py-1.5 transition-colors ${
                mobileView === v
                  ? "bg-foreground text-background"
                  : "text-subtle hover:bg-card-hover"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Split: form (left) | live preview (right), like Overleaf. On mobile,
          only the toggled pane shows (each full-height); desktop shows both. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className={`${
            mobileView === "edit" ? "flex" : "hidden"
          } rx-scroll min-h-0 flex-1 flex-col overflow-auto border-b border-border font-sans lg:flex lg:w-1/2 lg:flex-none lg:border-b-0 lg:border-r`}
        >
          <ResumeForm content={content} setContent={setContent} />
        </div>

        {/* Right: live preview (faithful, scaled A4 — matches the PDF). */}
        <div
          className={`${
            mobileView === "preview" ? "block" : "hidden"
          } rx-scroll rx-canvas min-h-0 flex-1 overflow-auto lg:block lg:w-1/2 lg:flex-none`}
        >
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
