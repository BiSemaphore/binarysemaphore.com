"use client";

/**
 * Code blocks with a copy-to-clipboard button.
 *
 * Registered as the `pre` element in `src/mdx-components.tsx`. The incoming
 * props (including rehype-pretty-code's `data-*` attributes and classes) are
 * spread straight onto the real <pre>, so the highlighted output is preserved
 * exactly; we only wrap it to position the button.
 *
 * A `text` fence is exempt. The study notebooks draw their diagrams as ASCII in
 * a text fence (AUTHORING.md: "ASCII first"), so it is a figure, not code.
 * Giving it a copy button and code chrome invites the reader to paste a picture
 * into an editor.
 */

import { useRef, useState, type ComponentPropsWithoutRef } from "react";

export function Pre(props: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    const text = ref.current?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context, denied permission): leave the
      // button idle rather than pretending it worked.
    }
  }

  // rehype-pretty-code puts the fence's language here.
  const language = (props as { "data-language"?: string })["data-language"];
  if (language === "text") {
    return <pre {...props} data-figure="" />;
  }

  return (
    <div className="group relative">
      <pre ref={ref} {...props} />
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
        className="absolute right-3 top-3 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] leading-none text-subtle opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue group-hover:opacity-100"
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
