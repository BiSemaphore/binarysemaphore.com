import type { Metadata } from "next";
import { TemplatesGallery } from "./templates-gallery";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Browse resume templates. Search by name, tag, or description, preview any one, and start building.",
  alternates: { canonical: "https://resume.binarysemaphore.com/templates" },
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      <header className="mb-6">
        <p className="font-mono text-xs text-[color:var(--rx-muted)]">
          {"// templates"}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground">
          Templates
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[color:var(--rx-muted)]">
          Click any card to open the full preview, or use a template to start a
          new resume.
        </p>
      </header>
      <TemplatesGallery />
    </div>
  );
}
