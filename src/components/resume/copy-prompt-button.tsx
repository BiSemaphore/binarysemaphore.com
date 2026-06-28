"use client";

import { useState } from "react";
import { templatePrompt } from "@/lib/resume/prompt";
import type { Template } from "@/lib/resume/schema";

/**
 * Copies an AI prompt (tailored to the template) to the clipboard so people can
 * draft resume content in ChatGPT/Claude, then paste it into the builder.
 */
export function CopyPromptButton({
  template,
  className = "rx-pill",
}: {
  template: Template;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(templatePrompt(template));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context) — nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy AI prompt for ${template.label}`}
      className={className}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}
